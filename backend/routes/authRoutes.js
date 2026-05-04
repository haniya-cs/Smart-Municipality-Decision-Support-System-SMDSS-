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

  // Citizen-only: Forgot password (no email sending; verifies citizen_id + email then resets)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { citizen_id, email, new_password } = req.body || {};
    const cid = String(citizen_id || "").trim();
    const em = String(email || "").trim().toLowerCase();
    const pw = String(new_password || "").trim();

    if (!cid || !em || !pw) {
      return res.status(400).json({ error: "citizen_id, email, and new_password are required" });
    }
    if (pw.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    try {
      // Only allow citizens (role_id = 2) to use this flow
      const rows = await new Promise((resolve, reject) => {
        db.query(
          `
          SELECT u.user_id, u.email
          FROM users u
          JOIN user_roles ur ON u.user_id = ur.user_id
          WHERE u.citizen_id = ?
            AND ur.role_id = 2
          LIMIT 1
          `,
          [cid],
          (err, results) => {
            if (err) return reject(err);
            return resolve(results);
          }
        );
      });

      if (!rows.length) {
        return res.status(404).json({ error: "Citizen not found" });
      }

      const dbEmail = String(rows[0].email || "").trim().toLowerCase();
      if (!dbEmail || dbEmail !== em) {
        return res.status(401).json({ error: "Citizen ID and email do not match" });
      }

      const passwordHash = await bcrypt.hash(pw, 10);

      await new Promise((resolve, reject) => {
        db.query(
          `UPDATE users SET password = ? WHERE user_id = ?`,
          [passwordHash, rows[0].user_id],
          (err) => {
            if (err) return reject(err);
            return resolve();
          }
        );
      });

      return res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get user profile data (used by Citizen/Admin My Account page)
  app.get("/api/users/:userId/profile", (req, res) => {
    const { userId } = req.params;
    db.query(
      `
      SELECT user_id, citizen_id, full_name, email, phone, address
      FROM users
      WHERE user_id = ?
      LIMIT 1
      `,
      [userId],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Internal server error" });
        if (!results.length) return res.status(404).json({ error: "User not found" });
        return res.json({ profile: results[0] });
      }
    );
  });

  // Update user profile (email, phone, address, optional password)
  app.put("/api/users/:userId/profile", async (req, res) => {
    const { userId } = req.params;
    const { email, phone, address, password } = req.body;

    if (!email || !phone || !address) {
      return res.status(400).json({ error: "email, phone, and address are required" });
    }

    try {
      let sql = `
        UPDATE users
        SET email = ?, phone = ?, address = ?
        WHERE user_id = ?
      `;
      let values = [email, phone, address, userId];

      const newPassword = String(password || "").trim();
      if (newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 10);
        sql = `
          UPDATE users
          SET email = ?, phone = ?, address = ?, password = ?
          WHERE user_id = ?
        `;
        values = [email, phone, address, passwordHash, userId];
      }

      db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: "Internal server error" });
        if (!result.affectedRows) return res.status(404).json({ error: "User not found" });
        return res.json({ message: "Profile updated successfully" });
      });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};

module.exports = { registerAuthRoutes };
