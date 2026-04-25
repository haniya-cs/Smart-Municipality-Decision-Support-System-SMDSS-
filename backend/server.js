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
      res.json({
        message: "Registration completed successfully",
        role_id,
        citizen_id,
        email
      });
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
    SELECT u.user_id, u.password, u.citizen_id, u.full_name, u.email, ur.role_id
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
      return res.json({
        message: "Login successful",
        role: "citizen",
        citizen_id: user.citizen_id,
        full_name: user.full_name,
        email: user.email
      });
    } else {
      return res.status(403).json({ error: "Access denied. Unknown role." });
    }
  });
});

// Get dues for the currently logged-in citizen.
// Only returns dues linked to properties owned by that citizen.
app.get("/api/citizens/:citizenId/dues", (req, res) => {
  const { citizenId } = req.params;

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
      d.payment_method,
      d.content
    FROM users u
    JOIN properties p ON p.owner_id = u.user_id
    LEFT JOIN dues d ON d.property_id = p.property_id
    WHERE u.citizen_id = ?
    ORDER BY p.property_id ASC, d.due_date DESC
  `;

  db.query(query, [citizenId], (err, rows) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (rows.length === 0) {
      return res.json({ properties: [] });
    }

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
          payment_method: row.payment_method,
          content: row.content
        });
      }
    });

    return res.json({ properties: Array.from(propertiesMap.values()) });
  });
});

// Submit a new complaint
app.post("/api/complaints", (req, res) => {
  const { citizen_id, description, location } = req.body;
  if (!citizen_id || !description) {
    return res.status(400).json({ error: "citizen_id and description are required" });
  }

  // We will try inserting with the string citizen_id first.
  const insertQuery = `INSERT INTO complaints (citizen_id, description, location, status) VALUES (?, ?, ?, 'Pending')`;
  db.query(insertQuery, [citizen_id, description, location || null], (err, result) => {
    if (err) {
      console.error("Insert error (using string citizen_id):", err.message);
      
      // If it failed, maybe citizen_id in the complaints table is actually an INT (foreign key to users.user_id)
      const getUserQuery = `SELECT user_id FROM users WHERE citizen_id = ?`;
      db.query(getUserQuery, [citizen_id], (err2, results) => {
        if (err2 || results.length === 0) return res.status(500).json({ error: "Failed to find user" });
        
        const user_id = results[0].user_id;
        db.query(insertQuery, [user_id, description, location || null], (err3, result3) => {
          if (err3) {
            console.error("Insert error (using int user_id):", err3.message);
            // Send the EXACT error message to the frontend so we know why it failed!
            return res.status(500).json({ error: err3.message || err.message });
          }
          return res.json({ message: "Complaint submitted successfully", complaint_id: result3.insertId });
        });
      });
    } else {
      res.json({ message: "Complaint submitted successfully", complaint_id: result.insertId });
    }
  });
});

// Get complaints for a citizen
app.get("/api/citizens/:citizenId/complaints", (req, res) => {
  const { citizenId } = req.params;
  
  // Try querying with the string citizen_id first
  const query = `SELECT * FROM complaints WHERE citizen_id = ? ORDER BY complaint_id DESC`;
  
  db.query(query, [citizenId], (err, results) => {
    if (err) {
      console.error("Database error fetching complaints:", err);
      return res.status(500).json({ error: "Database error" });
    } 
    
    // If it returned empty, maybe the citizen_id column stores the integer user_id. Let's do a JOIN fallback.
    if (results.length === 0) {
      const fallbackQuery = `
        SELECT c.* 
        FROM complaints c
        JOIN users u ON c.citizen_id = u.user_id
        WHERE u.citizen_id = ?
        ORDER BY c.complaint_id DESC
      `;
      db.query(fallbackQuery, [citizenId], (err2, results2) => {
        if (err2) return res.status(500).json({ error: "Database error" });
        return res.json({ complaints: results2 });
      });
    } else {
      res.json({ complaints: results });
    }
  });
});

// Admin: Get all citizens
app.get("/api/admin/citizens", (req, res) => {
  const query = `
    SELECT u.user_id, u.citizen_id, u.full_name, u.email, u.phone, u.address 
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    WHERE ur.role_id = 2
    ORDER BY u.user_id DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error fetching citizens:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ citizens: results });
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});