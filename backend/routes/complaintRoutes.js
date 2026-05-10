const { analyzeComplaint, detectDuplicateComplaint } = require("../ai");
const { resolveCategoryIdFromAiLabel } = require("../utils/aiCategory");
const { authenticateToken } = require("../middleware/auth");

const readInsertId = (result) => {
  if (!result || typeof result !== "object") return null;
  const raw = result.insertId;
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === "bigint" ? Number(raw) : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizeText = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const chooseComplaintCategoryId = (userCategoryId, aiCategoryId) => {
  if (!Number.isFinite(userCategoryId) || userCategoryId <= 0) {
    return aiCategoryId;
  }
  // If the user chose Other, trust the AI category.
  if (userCategoryId === 7) {
    return aiCategoryId;
  }
  // If AI found a specific category and it differs from the user's choice, prefer AI.
  if (aiCategoryId !== 7 && aiCategoryId !== userCategoryId) {
    return aiCategoryId;
  }
  // Otherwise keep the user's concrete category.
  return userCategoryId;
};

const registerComplaintRoutes = ({ app, db, queryAsync, upload, logSystemActivity }) => {
  app.post("/api/complaints", authenticateToken, async (req, res) => {
    const { citizen_id, description, location, category_id, language: providedLanguage } = req.body;
    if (!citizen_id || !description) {
      return res.status(400).json({ error: "citizen_id and description are required" });
    }
    if (!req.user.roles?.includes(1) && req.user.citizen_id !== citizen_id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const language = providedLanguage || (/[\u0600-\u06FF]/.test(description) ? "ar" : "en");
    const parsedCat = Number(category_id);
    const finalCategoryId =
      Number.isFinite(parsedCat) && parsedCat > 0 ? parsedCat : 7;

    let transactionOpen = false;
    try {
      const normalizedDescription = normalizeText(description);

      const cachedAnalysisRows = await queryAsync(
        `
        SELECT c.analysis_id AS analysisId,
               a.priority_level AS priorityLevel,
               a.summary,
               a.suggested_category AS suggestedCategory
        FROM complaints c
        JOIN ai_analysis a ON c.analysis_id = a.analysis_id
        WHERE LOWER(TRIM(c.description)) = ?
        LIMIT 1
        `,
        [normalizedDescription]
      );

      let aiResult;
      let analysisId = null;
      let duplicateResult = { duplicateOfId: null, similarityScore: 0 };

      if (cachedAnalysisRows.length > 0) {
        const cached = cachedAnalysisRows[0];
        aiResult = {
          priority: cached.priorityLevel || "Medium",
          category: cached.suggestedCategory || "Other",
          summary: cached.summary || "AI analysis failed"
        };
        analysisId = cached.analysisId;
      } else {
        try {
          aiResult = await analyzeComplaint(description);
        } catch (error) {
          aiResult = { priority: "Medium", summary: "AI Analysis Failed", category: "Other" };
        }

        const aiMappedCategoryId = await resolveCategoryIdFromAiLabel(
          queryAsync,
          aiResult.category,
          finalCategoryId
        );

        const categoryIdForComplaint = chooseComplaintCategoryId(finalCategoryId, aiMappedCategoryId);

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

        duplicateResult = await detectDuplicateComplaint(description, candidateRows);

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

        analysisId = readInsertId(aiRes);
        if (!analysisId) {
          const lidRows = await queryAsync("SELECT LAST_INSERT_ID() AS id");
          const lid = lidRows[0]?.id;
          analysisId = typeof lid === "bigint" ? Number(lid) : Number(lid);
          if (!Number.isFinite(analysisId) || analysisId <= 0) {
            throw new Error("Could not read ai_analysis insert id after INSERT");
          }
        }
      }

      const userRows = await queryAsync(
        "SELECT user_id FROM users WHERE citizen_id = ? LIMIT 1",
        [citizen_id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ error: "Citizen not found" });
      }

      const userId = userRows[0].user_id;

      const aiMappedCategoryId = await resolveCategoryIdFromAiLabel(
        queryAsync,
        aiResult.category,
        finalCategoryId
      );

      const categoryIdForComplaint = chooseComplaintCategoryId(finalCategoryId, aiMappedCategoryId);

      if (cachedAnalysisRows.length > 0) {
        await queryAsync("START TRANSACTION");
        transactionOpen = true;
      }

      const complaintInsertResult = await queryAsync(
        `
        INSERT INTO complaints (citizen_id, category_id, analysis_id, description, language, status, location)
        VALUES (?, ?, ?, ?, ?, 'Pending', ?)
        `,
        [userId, categoryIdForComplaint, analysisId, description, language, location || null]
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
 app.get("/api/citizens/:citizenId/complaints", authenticateToken, async (req, res) => {
  const { citizenId } = req.params;

  try {
    const rows = await queryAsync(
      `
      SELECT c.*
      FROM complaints c
      JOIN users u ON c.citizen_id = u.user_id
      WHERE u.citizen_id = ?
      ORDER BY c.complaint_id DESC
      `,
      [citizenId]
    );

    return res.json({ complaints: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});
  app.get("/api/categories", (req, res) => {
    db.query("SELECT * FROM categories", (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      return res.json({ categories: results });
    });
  });

  app.post("/api/complaints/:complaintId/images", authenticateToken, upload.single("image"), async (req, res) => {
    const { complaintId } = req.params;
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    if (!req.user.roles?.includes(1)) {
      const ownerRows = await queryAsync(
        `
        SELECT c.citizen_id, u.citizen_id AS citizenCode
         FROM complaints c
          JOIN users u ON c.citizen_id = u.user_id
         WHERE c.complaint_id = ?
         LIMIT 1
        `,
        [complaintId]
      );
      if (!ownerRows.length || ownerRows[0].citizenCode !== req.user.citizen_id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

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


  // Image get for citizen complaints
  app.get('/api/complaints/:id/images', authenticateToken, async (req, res) => {
    try {
      const complaintId = req.params.id;

      if (!req.user.roles?.includes(1)) {
        const ownerRows = await queryAsync(
          `
          SELECT c.citizen_id, u.citizen_id AS citizenCode
          FROM complaints c
          JOIN users u ON c.citizen_id = u.user_id
          WHERE c.complaint_id = ?
          LIMIT 1
          `,
          [complaintId]
        );
        if (!ownerRows.length || ownerRows[0].citizenCode !== req.user.citizen_id) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const rows = await queryAsync(
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
