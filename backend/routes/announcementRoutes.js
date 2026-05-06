const { authenticateToken, requireRole } = require("../middleware/auth");

const registerAnnouncementRoutes = ({ app, db, upload }) => {
  app.post("/api/announcements", authenticateToken, requireRole(1), upload.single("image"), (req, res) => {
    const { admin_id, title, content, type, publish_start, publish_end } = req.body;
    const allowedTypes = ["urgent", "event", "general", "meeting", "maintenance"];
    let finalType = (type || "general").toString().trim().toLowerCase();
    if (!allowedTypes.includes(finalType)) finalType = "general";

    if (!admin_id || !title || !content || !finalType) {
      return res.status(400).json({ error: "admin_id, title, content, and type are required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    db.query("SELECT user_id FROM users WHERE citizen_id = ?", [admin_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.length === 0) return res.status(404).json({ error: "User not found" });

      db.query(
        `
        INSERT INTO announcements (admin_id, title, content, type, image, publish_start, publish_end)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [result[0].user_id, title, content, finalType, imageUrl, publish_start || null, publish_end || null],
        (insertErr, insertResult) => {
          if (insertErr) return res.status(500).json({ error: "Database error", details: insertErr.message });
          return res.json({
            message: "Announcement published successfully",
            announcement_id: insertResult.insertId
          });
        }
      );
    });
  });

  app.get("/api/announcements", (req, res) => {
    db.query(
      `
      SELECT a.*, u.full_name as admin_name
      FROM announcements a
      LEFT JOIN users u ON a.admin_id = u.user_id
      ORDER BY a.announcement_id DESC
      `,
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.json({ announcements: results });
      }
    );
  });

  app.get("/api/announcements/urgent", (req, res) => {
    db.query(
      `
      SELECT a.*, u.full_name as admin_name
      FROM announcements a
      LEFT JOIN users u ON a.admin_id = u.user_id
      WHERE a.type = 'urgent'
        AND ((a.publish_start IS NULL OR a.publish_start = '' OR a.publish_start <= NOW())
        AND (a.publish_end IS NULL OR a.publish_end = '' OR a.publish_end >= NOW()))
      ORDER BY a.announcement_id DESC
      `,
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.json({ announcements: results });
      }
    );
  });

  app.get("/api/announcements/public", (req, res) => {
    db.query(
      `
      SELECT a.*, u.full_name as admin_name
      FROM announcements a
      LEFT JOIN users u ON a.admin_id = u.user_id
      WHERE (
        (a.publish_start IS NULL OR a.publish_start = '' OR a.publish_start <= NOW())
        AND (a.publish_end IS NULL OR a.publish_end = '' OR a.publish_end >= NOW())
      )
      ORDER BY
        CASE a.type
          WHEN 'urgent' THEN 1
          WHEN 'maintenance' THEN 2
          WHEN 'meeting' THEN 3
          WHEN 'event' THEN 4
          ELSE 5
        END,
        a.announcement_id DESC
      `,
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.json({ announcements: results });
      }
    );
  });

  app.delete("/api/announcements/:announcementId", authenticateToken, requireRole(1), (req, res) => {
    const { announcementId } = req.params;
    db.query("DELETE FROM announcements WHERE announcement_id = ?", [announcementId], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: "Announcement not found" });
      return res.json({ message: "Announcement deleted successfully" });
    });
  });
};

module.exports = { registerAnnouncementRoutes };
