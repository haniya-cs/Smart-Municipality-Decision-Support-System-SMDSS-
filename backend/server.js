const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "smdss db"
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
  } else {
    console.log("Connected to database");
  }
});

module.exports = db;

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Endpoint to verify Citizen ID and check role (for citizens only)
app.post("/api/verify-citizen-id", (req, res) => {
  const { citizen_id } = req.body;
  if (!citizen_id) {
    return res.status(400).json({ error: "Citizen ID is required" });
  }

  // First, get user details and check if role is citizen (2)
  const query = `
    SELECT u.full_name, ur.role_id
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    WHERE u.citizen_id = ? AND ur.role_id = 2
  `;
  db.query(query, [citizen_id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Citizen ID not found or not a citizen" });
    }

    res.json({ full_name: results[0].full_name, role_id: results[0].role_id });
  });
});

// Endpoint to complete registration
app.post("/api/complete-registration", async (req, res) => {
  const { citizen_id, email, password, phone, address } = req.body;
  if (!citizen_id || !email || !password || !phone || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const query = `UPDATE users SET email = ?, password = ?, phone = ?, address = ? WHERE citizen_id = ?`;

  db.query(query, [email, passwordHash, phone, address, citizen_id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Citizen ID not found" });
    }

    // After update, fetch role_id for dashboard logic
    const roleQuery = `
      SELECT ur.role_id
      FROM users u
      JOIN user_roles ur ON u.user_id = ur.user_id
      WHERE u.citizen_id = ?
    `;
    db.query(roleQuery, [citizen_id], (err, roleResults) => {
      if (err) {
        console.error("Role fetch error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      const role_id = roleResults[0]?.role_id || null;
      res.json({ message: "Registration completed successfully", role_id });
    });
  });
});
// Additional endpoints for login, admin verification can be added here as needed
app.post("/api/login", (req, res) => {
  const { citizen_id, password } = req.body;

  if (!citizen_id || !password) {
    return res.status(400).json({ error: "Citizen ID and password are required" });
  }

  // Query to get user details and role
  const query = `
    SELECT u.user_id, u.password, ur.role_id
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    WHERE u.citizen_id = ?
  `;

  db.query(query, [citizen_id], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Citizen ID not found" });
    }

    const user = results[0];

     console.log("Login query results:", results);
     console.log("Role ID:", user.role_id);

    // Check if the password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Check the role and respond accordingly
      if (user.role_id === 1) {
      return res.json({ message: "Login successful", role: "admin" });
    } else if (user.role_id === 2) {
      return res.json({ message: "Login successful", role: "citizen" });
    } else {
      return res.status(403).json({ error: "Access denied. Unknown role." });
    }
  });
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});