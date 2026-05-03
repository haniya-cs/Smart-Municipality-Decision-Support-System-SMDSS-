const bcrypt = require("bcryptjs");

const registerAuthRoutes = ({ app, db, logSystemActivity }) => {
  app.post("/api/verify-citizen-id", (req, res) => {
    const { citizen_id } = req.body;
    if (!citizen_id) {
      return res.status(400).json({ error: "Citizen ID is required" });
    }

    const query = `
      SELECT u.full_name, ur.role_id
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      WHERE u.citizen_id = ? AND ur.role_id = 2
    `;
    db.query(query, [citizen_id], (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (results.length === 0) {
        return res.status(404).json({ error: "Citizen ID not found or not a citizen" });
      }
      return res.json({ full_name: results[0].full_name, role_id: results[0].role_id });
    });
  });

  app.post("/api/complete-registration", async (req, res) => {
    const { citizen_id, email, password, phone, address } = req.body;
    if (!citizen_id || !email || !password || !phone || !address) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const query = `UPDATE users SET email = ?, password = ?, phone = ?, address = ? WHERE citizen_id = ?`;

    db.query(query, [email, passwordHash, phone, address, citizen_id], (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Citizen ID not found" });
      }

      const roleQuery = `
        SELECT ur.role_id
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        WHERE u.citizen_id = ?
      `;
      db.query(roleQuery, [citizen_id], async (roleErr, roleResults) => {
        if (roleErr) return res.status(500).json({ error: "Internal server error" });

        const role_id = roleResults[0]?.role_id || null;
        await logSystemActivity({
          actorCitizenId: citizen_id,
          activityType: "citizen_registered",
          actionText: "completed citizen registration"
        });

        return res.json({
          message: "Registration completed successfully",
          role_id,
          citizen_id,
          email
        });
      });
    });
  });

  app.post("/api/login", (req, res) => {
    const { citizen_id, password } = req.body;
    if (!citizen_id || !password) {
      return res.status(400).json({ error: "Citizen ID and password are required" });
    }

    const query = `
      SELECT u.user_id, u.password, u.citizen_id, u.full_name, u.email, ur.role_id
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      WHERE u.citizen_id = ?
    `;

    db.query(query, [citizen_id], async (err, results) => {
      if (err) return res.status(500).json({ error: "Internal server error" });
      if (results.length === 0) return res.status(404).json({ error: "Citizen ID not found" });

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return res.status(401).json({ error: "Invalid password" });

      return res.json({
        message: "Login successful",
        roles: results.map((row) => row.role_id),
        user_id: user.user_id,
        citizen_id: user.citizen_id,
        full_name: user.full_name,
        email: user.email
      });
    });
  });
};

module.exports = { registerAuthRoutes };
