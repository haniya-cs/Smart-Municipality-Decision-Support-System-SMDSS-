const { analyzeComplaint, detectDuplicateComplaint } = require("../ai");
const { resolveCategoryIdFromAiLabel } = require("../utils/aiCategory");

const readInsertId = (result) => {
  if (!result || typeof result !== "object") return null;
  const raw = result.insertId;
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const registerComplaintRoutes = ({ app, db, queryAsync, upload, logSystemActivity }) => {
  app.post("/api/complaints", async (req, res) => {
    const { citizen_id, description, location, category_id, language: providedLanguage } = req.body;
    if (!citizen_id || !description) {
      return res.status(400).json({ error: "citizen_id and description are required" });
    }

    const language = providedLanguage || (/[\u0600-\u06FF]/.test(description) ? "ar" : "en");
    const parsedCat = Number(category_id);
    const finalCategoryId =
      Number.isFinite(parsedCat) && parsedCat > 0 ? parsedCat : 7;

    let transactionOpen = false;
    try {
      let aiResult;
      try {
        aiResult = await analyzeComplaint(description);
      } catch (error) {
        aiResult = { priority: "Medium", summary: "AI Analysis Failed", category: "Other" };
      }

      const users = await queryAsync(`SELECT user_id FROM users WHERE citizen_id = ? LIMIT 1`, [citizen_id]);
      if (!users.length) return res.status(404).json({ error: "Citizen not found" });

      const aiMappedCategoryId = await resolveCategoryIdFromAiLabel(
        queryAsync,
        aiResult.category,
        finalCategoryId
      );

      // If the citizen picked a concrete category (not default "Other" = 7), keep that in `complaints`.
      // Otherwise use the AI-derived category so "Other + good description" can still route correctly.
      const categoryIdForComplaint =
        finalCategoryId !== 7 ? finalCategoryId : aiMappedCategoryId;

      const candidateRows = await queryAsync(
        `
        SELECT
          c.complaint_id AS complaintId,
          c.description,
          c.location,
          c.category_id AS categoryId,
          a.analysis_id AS analysisId,
          a.summary
        FROM complaints c
        JOIN ai_analysis a ON c.analysis_id = a.analysis_id
        WHERE c.category_id = ?
        ORDER BY c.complaint_id DESC
        LIMIT 20
        `,
        [categoryIdForComplaint]
      );

      const duplicateResult = await detectDuplicateComplaint(description, candidateRows);

      await queryAsync("START TRANSACTION");
      transactionOpen = true;

      const aiRes = await queryAsync(
        `
        INSERT INTO ai_analysis (priority_level, summary, suggested_category, duplicate_of_id, similarity_score)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          aiResult.priority,
          aiResult.summary,
          aiResult.category,
          duplicateResult.duplicateOfId,
          duplicateResult.similarityScore
        ]
      );

      let analysisId = readInsertId(aiRes);
      if (!analysisId) {
        const lidRows = await queryAsync("SELECT LAST_INSERT_ID() AS id");
        const lid = lidRows[0]?.id;
        analysisId =
          typeof lid === "bigint" ? Number(lid) : Number(lid);
        if (!Number.isFinite(analysisId) || analysisId <= 0) {
          throw new Error("Could not read ai_analysis insert id after INSERT");
        }
      }

      const complaintInsertResult = await queryAsync(
        `
        INSERT INTO complaints (citizen_id, category_id, analysis_id, description, language, status, location)
        VALUES (?, ?, ?, ?, ?, 'Pending', ?)
        `,
        [users[0].user_id, categoryIdForComplaint, analysisId, description, language, location || null]
      );

      const newComplaintId = readInsertId(complaintInsertResult);
      if (!newComplaintId) {
        throw new Error("Could not read complaints insert id after INSERT");
      }

      await queryAsync("COMMIT");
      transactionOpen = false;

      try {
        await logSystemActivity({
          actorCitizenId: citizen_id,
          activityType: "complaint_submitted",
          actionText: "submitted a new complaint",
          referenceId: newComplaintId
        });
      } catch (logErr) {
        console.error("Activity log failed after complaint submit:", logErr);
      }

      return res.json({
        message: "Complaint submitted successfully with AI Analysis",
        complaint_id: newComplaintId,
        analysis_id: analysisId,
        category_id: categoryIdForComplaint,
        ai_analysis: {
          ...aiResult,
          duplicate_of_id: duplicateResult.duplicateOfId,
          similarity_score: duplicateResult.similarityScore
        },
        language,
        status: "Pending"
      });
    } catch (error) {
      if (transactionOpen) {
        await queryAsync("ROLLBACK").catch(() => {});
      }
      console.error("Submit complaint flow error:", error);
      return res.status(500).json({ error: "Failed to submit complaint with AI analysis" });
    }
  });

  app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ categories: results });
    });
  });

  app.post("/api/complaints/:complaintId/images", upload.single("image"), (req, res) => {
    const { complaintId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const imageUrl = `/uploads/${req.file.filename}`;
    db.query(
      `
      INSERT INTO complaint_images (complaint_id, url)
      VALUES (?, ?)
      `,
      [complaintId, imageUrl],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({
          message: "Image uploaded successfully",
          image_id: result.insertId,
          url: imageUrl
        });
      }
    );
  });

  app.get("/api/complaints/:complaintId/images", (req, res) => {
    const { complaintId } = req.params;
    db.query("SELECT * FROM complaint_images WHERE complaint_id = ?", [complaintId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ images: results });
    });
  });

  app.get("/api/citizens/:citizenId/complaints", (req, res) => {
    const { citizenId } = req.params;
    db.query(
      "SELECT * FROM complaints WHERE citizen_id = ? ORDER BY complaint_id DESC",
      [citizenId],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0) return res.json({ complaints: results });

        db.query(
          `
          SELECT c.*
          FROM complaints c
          JOIN users u ON c.citizen_id = u.user_id
          WHERE u.citizen_id = ?
          ORDER BY c.complaint_id DESC
          `,
          [citizenId],
          (err2, results2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            return res.json({ complaints: results2 });
          }
        );
      }
    );
  });
  //image get for citizen complaints
  app.get('/api/complaints/:id/images', async (req, res) => {
  try {
    const complaintId = req.params.id;

    const [rows] = await db.query(
      `SELECT image_id, url 
       FROM complaint_images 
       WHERE complaint_id = ?`,
      [complaintId]
    );

    res.json({ images: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

};

module.exports = { registerComplaintRoutes };
