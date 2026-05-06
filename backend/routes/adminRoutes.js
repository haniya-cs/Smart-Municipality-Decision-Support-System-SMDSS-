const { authenticateToken, requireRole } = require("../middleware/auth");

const registerAdminRoutes = ({ app, db, queryAsync, logSystemActivity }) => {
  app.get("/api/admin/citizens", authenticateToken, requireRole(1), (req, res) => {
    db.query(
      `
      SELECT u.user_id, u.citizen_id, u.full_name, u.email, u.phone, u.address
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      WHERE ur.role_id = 2
      ORDER BY u.user_id DESC
      `,
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.json({ citizens: results });
      }
    );
  });

  app.get("/api/admin/dashboard-stats", authenticateToken, requireRole(1), async (req, res) => {
    try {
      const [highPriorityRows, pendingRows, duesRows, citizensRows] = await Promise.all([
        queryAsync(`
          SELECT COUNT(*) AS total
          FROM complaints c
          JOIN ai_analysis a ON c.analysis_id = a.analysis_id
          WHERE a.priority_level = 'High'
            AND c.status <> 'Resolved'
        `),
        queryAsync(`SELECT COUNT(*) AS total FROM complaints WHERE status = 'Pending'`),
        queryAsync(`SELECT COALESCE(SUM(amount), 0) AS total FROM dues WHERE status = 'paid'`),
        queryAsync(`
          SELECT COUNT(*) AS total
          FROM users u
          JOIN user_roles ur ON u.user_id = ur.user_id
          WHERE ur.role_id = 2
        `)
      ]);

      return res.json({
        high_priority: Number(highPriorityRows[0]?.total || 0),
        pending_issues: Number(pendingRows[0]?.total || 0),
        dues_collected: Number(duesRows[0]?.total || 0),
        registered_citizens: Number(citizensRows[0]?.total || 0)
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to load dashboard stats" });
    }
  });

  app.get("/api/admin/live-activities", authenticateToken, requireRole(1), async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const days = Math.min(Math.max(Number(req.query.days) || 0, 0), 30);
    try {
      const whereClause = days > 0 ? `WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)` : ``;
      const listValues = days > 0 ? [days, limit, offset] : [limit, offset];
      const countValues = days > 0 ? [days] : [];

      const [rows, totalRows] = await Promise.all([
        queryAsync(
          `
          SELECT activity_id, actor_citizen_id, activity_type, action_text, reference_id, created_at
          FROM system_activities
          ${whereClause}
          ORDER BY created_at DESC, activity_id DESC
          LIMIT ? OFFSET ?
          `,
          listValues
        ),
        queryAsync(
          `
          SELECT COUNT(*) AS total
          FROM system_activities
          ${whereClause}
          `,
          countValues
        )
      ]);
      return res.json({
        activities: rows,
        pagination: {
          total: Number(totalRows[0]?.total || 0),
          limit,
          offset
        }
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to load live activities" });
    }
  });

  // AI duplicate clusters for the review board (non-resolved complaints only)
  app.get("/api/admin/smart-board", authenticateToken, requireRole(1), async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
    try {
      const rows = await queryAsync(
        `
        SELECT
          x.cluster_key AS cluster_id,
          COUNT(*) AS reports,
          CASE MAX(CASE x.priority_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END)
            WHEN 3 THEN 'High'
            WHEN 2 THEN 'Medium'
            ELSE 'Low'
          END AS ai_priority,
          SUBSTRING_INDEX(
            GROUP_CONCAT(x.summary ORDER BY x.complaint_id ASC SEPARATOR '##'),
            '##',
            1
          ) AS title,
          SUBSTRING_INDEX(
            GROUP_CONCAT(x.category_label ORDER BY x.complaint_id ASC SEPARATOR '##'),
            '##',
            1
          ) AS category,
          CASE
            WHEN COUNT(DISTINCT x.status) = 1 THEN MAX(x.status)
            ELSE 'Mixed'
          END AS status
        FROM (
          SELECT
            c.complaint_id,
            c.status,
            a.priority_level,
            a.summary,
            COALESCE(NULLIF(TRIM(cat.name), ''), NULLIF(TRIM(a.suggested_category), ''), 'Other') AS category_label,
            COALESCE(NULLIF(a.duplicate_of_id, 0), a.analysis_id) AS cluster_key
          FROM complaints c
          JOIN ai_analysis a ON c.analysis_id = a.analysis_id
          LEFT JOIN categories cat ON c.category_id = cat.category_id
          WHERE LOWER(TRIM(c.status)) <> 'resolved'
        ) x
        GROUP BY x.cluster_key
        ORDER BY
          MAX(CASE x.priority_level WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END) DESC,
          COUNT(*) DESC,
          x.cluster_key DESC
        LIMIT ?
        `,
        [limit]
      );

      const clusters = rows.map((row) => ({
        cluster_id: Number(row.cluster_id),
        reports: Number(row.reports || 0),
        ai_priority: row.ai_priority || "Medium",
        title: row.title || "Complaint cluster",
        category: row.category || "Other",
        status: row.status || "Pending"
      }));

      return res.json({ clusters });
    } catch (error) {
      console.error("Smart board error:", error);
      return res.status(500).json({ error: "Failed to load smart board" });
    }
  });

  app.get("/api/admin/complaints", authenticateToken, requireRole(1), (req, res) => {
    db.query(
      `
      SELECT
        c.*,
        u.full_name,
        u.citizen_id as user_citizen_id,
        cat.name as category_name,
        a.suggested_category as ai_suggested_category,
        CASE
          WHEN a.suggested_category IS NOT NULL AND TRIM(a.suggested_category) <> ''
            THEN a.suggested_category
          ELSE cat.name
        END AS category_display_name
      FROM complaints c
      LEFT JOIN users u ON c.citizen_id = u.user_id OR c.citizen_id = u.citizen_id
      LEFT JOIN categories cat ON c.category_id = cat.category_id
      LEFT JOIN ai_analysis a ON c.analysis_id = a.analysis_id
      ORDER BY c.created_at DESC, c.complaint_id DESC
      `,
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        const uniqueComplaints = [];
        const seenIds = new Set();
        results.forEach((row) => {
          if (!seenIds.has(row.complaint_id)) {
            seenIds.add(row.complaint_id);
            uniqueComplaints.push(row);
          }
        });
        return res.json({ complaints: uniqueComplaints });
      }
    );
  });

  app.put("/api/admin/complaints/:id/status", authenticateToken, requireRole(1), async (req, res) => {
    const { id } = req.params;
    const { status, updated_by = null } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    try {
      const currentRows = await queryAsync(
        "SELECT status FROM complaints WHERE complaint_id = ? LIMIT 1",
        [id]
      );
      if (!currentRows.length) return res.status(404).json({ error: "Complaint not found" });
      const previousStatus = currentRows[0].status;
      if (previousStatus === status) {
        return res.json({ message: "Status already set", complaint_id: Number(id), status });
      }

      await queryAsync("START TRANSACTION");
      await queryAsync("UPDATE complaints SET status = ? WHERE complaint_id = ?", [status, id]);
      await queryAsync(
        `
        INSERT INTO complaint_updates (complaint_id, status, update_text, updated_by)
        VALUES (?, ?, ?, ?)
        `,
        [id, status, `Status changed from ${previousStatus} to ${status}`, updated_by]
      );

      let adminCitizenId = null;
      if (updated_by) {
        const adminRows = await queryAsync("SELECT citizen_id FROM users WHERE user_id = ? LIMIT 1", [updated_by]);
        adminCitizenId = adminRows[0]?.citizen_id || null;
      }
      await logSystemActivity({
        actorCitizenId: adminCitizenId,
        activityType: "complaint_status_changed",
        actionText: `changed complaint #${id} status to ${status}`,
        referenceId: Number(id)
      });

      await queryAsync("COMMIT");
      return res.json({
        message: "Status updated successfully",
        complaint_id: Number(id),
        previous_status: previousStatus,
        current_status: status
      });
    } catch (error) {
      await queryAsync("ROLLBACK").catch(() => {});
      return res.status(500).json({ error: "Failed to update complaint status" });
    }
  });
 //citizen details update
 app.put('/api/admin/citizens/:id', authenticateToken, requireRole(1), (req, res) => {
  const { email, phone, address } = req.body;
  const userId = req.params.id;

  const sql = `
    UPDATE users 
    SET email = ?, phone = ?, address = ?
    WHERE user_id = ?
  `;

  db.query(sql, [email, phone, address, userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({ message: 'Citizen updated successfully' });
  });
});

// DELETE CITIZEN
app.delete("/api/admin/citizens/:id", authenticateToken, requireRole(1), (req, res) => {
  const citizenId = req.params.id;

  const sql = "DELETE FROM users WHERE user_id = ?";

  db.query(sql, [citizenId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json({ message: "Citizen deleted successfully" });
  });
});

//image getting for complaint 
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

module.exports = { registerAdminRoutes };
