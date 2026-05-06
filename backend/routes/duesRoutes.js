const { authenticateToken, requireRole } = require("../middleware/auth");

const registerDuesRoutes = ({ app, db, queryAsync, logSystemActivity }) => {
  app.get("/api/citizens/:citizenId/dues", authenticateToken, (req, res) => {
    const { citizenId } = req.params;
    if (!req.user.roles?.includes(1) && req.user.citizen_id !== citizenId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const query = `
      SELECT
        p.property_id,
        p.type AS property_type,
        p.location,
        d.due_id,
        d.type AS due_type,
        d.amount,
        d.due_date,
        d.status,
        d.content
      FROM users u
      JOIN properties p ON p.owner_id = u.user_id
      LEFT JOIN dues d ON d.property_id = p.property_id
      WHERE u.citizen_id = ?
      ORDER BY p.property_id ASC, d.due_date DESC
    `;

    db.query(query, [citizenId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (rows.length === 0) return res.json({ properties: [] });

      const propertiesMap = new Map();
      rows.forEach((row) => {
        if (!propertiesMap.has(row.property_id)) {
          propertiesMap.set(row.property_id, {
            property_id: row.property_id,
            type: row.property_type,
            location: row.location,
            dues: []
          });
        }
        if (row.due_id) {
          propertiesMap.get(row.property_id).dues.push({
            due_id: row.due_id,
            type: row.due_type,
            amount: Number(row.amount),
            due_date: row.due_date,
            status: row.status,
            content: row.content
          });
        }
      });

      return res.json({ properties: Array.from(propertiesMap.values()) });
    });
  });

  app.put("/api/dues/:dueId/pay", authenticateToken, async (req, res) => {
    const { dueId } = req.params;
    try {
      if (!req.user.roles?.includes(1)) {
        const ownerRows = await queryAsync(
          `
          SELECT u.citizen_id
          FROM dues d
          JOIN properties p ON d.property_id = p.property_id
          JOIN users u ON p.owner_id = u.user_id
          WHERE d.due_id = ?
          LIMIT 1
          `,
          [dueId]
        );
        if (!ownerRows.length || ownerRows[0].citizen_id !== req.user.citizen_id) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const result = await queryAsync("UPDATE dues SET status = 'paid' WHERE due_id = ?", [dueId]);
      if (result.affectedRows === 0) return res.status(404).json({ error: "Due not found" });

      const ownerRows = await queryAsync(
        `
        SELECT u.citizen_id, d.amount
        FROM dues d
        JOIN properties p ON d.property_id = p.property_id
        JOIN users u ON p.owner_id = u.user_id
        WHERE d.due_id = ?
        LIMIT 1
        `,
        [dueId]
      );

      await logSystemActivity({
        actorCitizenId: ownerRows[0]?.citizen_id || null,
        activityType: "due_paid",
        actionText: `paid due #${dueId}${Number(ownerRows[0]?.amount || 0) ? ` ($${Number(ownerRows[0]?.amount || 0)})` : ""}`,
        referenceId: Number(dueId)
      });

      return res.json({ message: "Payment successful" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/properties/:propertyId/pay-all", authenticateToken, async (req, res) => {
    const { propertyId } = req.params;
    try {
      if (!req.user.roles?.includes(1)) {
        const ownerRows = await queryAsync(
          `
          SELECT u.citizen_id
          FROM properties p
          JOIN users u ON p.owner_id = u.user_id
          WHERE p.property_id = ?
          LIMIT 1
          `,
          [propertyId]
        );
        if (!ownerRows.length || ownerRows[0].citizen_id !== req.user.citizen_id) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const result = await queryAsync(
        "UPDATE dues SET status = 'paid' WHERE property_id = ? AND status = 'unpaid'",
        [propertyId]
      );
      const ownerRows = await queryAsync(
        `
        SELECT u.citizen_id
        FROM properties p
        JOIN users u ON p.owner_id = u.user_id
        WHERE p.property_id = ?
        LIMIT 1
        `,
        [propertyId]
      );

      await logSystemActivity({
        actorCitizenId: ownerRows[0]?.citizen_id || null,
        activityType: "dues_paid_bulk",
        actionText: `paid all dues for property #${propertyId} (${result.affectedRows} dues)`,
        referenceId: Number(propertyId)
      });

      return res.json({ message: "All outstanding dues paid successfully", updated: result.affectedRows });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/citizens/:citizen_id/properties", authenticateToken, (req, res) => {
    const { citizen_id } = req.params;
    if (!req.user.roles?.includes(1) && req.user.citizen_id !== citizen_id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    db.query("SELECT user_id FROM users WHERE citizen_id= ?", [citizen_id], (err, userResult) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (userResult.length === 0) return res.status(404).json({ error: "Citizen not found" });

      db.query(
        `
        SELECT property_id, type, location
        FROM properties
        WHERE owner_id = ?
        `,
        [userResult[0].user_id],
        (propErr, properties) => {
          if (propErr) return res.status(500).json({ error: "Database error" });
          return res.json({ properties });
        }
      );
    });
  });

  app.post("/api/dues", authenticateToken, requireRole(1), (req, res) => {
    const { property_id, type, amount, due_date, status, content } = req.body;
    db.query(
      `
      INSERT INTO dues (property_id, type, amount, due_date, status, content)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [property_id, type, amount, due_date, status, content],
      (err) => {
        if (err) return res.status(500).json({ error: "Database error" });
        return res.json({ message: "Due added successfully" });
      }
    );
  });
};

module.exports = { registerDuesRoutes };
