const mysql = require ("mysql2");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "smdss_db"
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
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { analyzeComplaint, detectDuplicateComplaint } = require("./ai");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const queryAsync = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

const initializeActivityTable = async () => {
  try {
    await queryAsync(`
      CREATE TABLE IF NOT EXISTS system_activities (
        activity_id INT AUTO_INCREMENT PRIMARY KEY,
        actor_citizen_id VARCHAR(50) NULL,
        activity_type VARCHAR(50) NOT NULL,
        action_text VARCHAR(255) NOT NULL,
        reference_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error("Failed to initialize system_activities table:", error);
  }
};

const logSystemActivity = async ({
  actorCitizenId = null,
  activityType,
  actionText,
  referenceId = null
}) => {
  if (!activityType || !actionText) return;
  try {
    await queryAsync(
      `
      INSERT INTO system_activities (actor_citizen_id, activity_type, action_text, reference_id)
      VALUES (?, ?, ?, ?)
      `,
      [actorCitizenId, activityType, actionText, referenceId]
    );
  } catch (error) {
    console.error("Failed to log system activity:", error);
  }
};

initializeActivityTable();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

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
    db.query(roleQuery, [citizen_id], async (err, roleResults) => {
      if (err) {
        console.error("Role fetch error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      const role_id = roleResults[0]?.role_id || null;
      await logSystemActivity({
        actorCitizenId: citizen_id,
        activityType: "citizen_registered",
        actionText: "completed citizen registration"
      });

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

     // Extract all roles for the user
    const roles = results.map((row) => row.role_id);

    // Return user data along with roles
    return res.json({ 
      message: "Login successful", 
      roles,
      user_id: user.user_id,
      citizen_id: user.citizen_id,
      full_name: user.full_name,
      email: user.email
    });
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

// Pay a single due
app.put("/api/dues/:dueId/pay", (req, res) => {
  const { dueId } = req.params;
  const query = "UPDATE dues SET status = 'paid', payment_method = 'Credit Card' WHERE due_id = ?";
  db.query(query, [dueId], (err, result) => {
    if (err) {
      console.error("Error paying due:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Due not found" });
    }
    res.json({ message: "Payment successful" });
  });
});

// Pay all dues for a property
app.put("/api/properties/:propertyId/pay-all", (req, res) => {
  const { propertyId } = req.params;
  const query = "UPDATE dues SET status = 'paid', payment_method = 'Credit Card' WHERE property_id = ? AND status = 'unpaid'";
  db.query(query, [propertyId], (err, result) => {
    if (err) {
      console.error("Error paying property dues:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ message: "All outstanding dues paid successfully", updated: result.affectedRows });
  });
});

// Submit a new complaint
app.post("/api/complaints", async (req, res) => {
  const { citizen_id, description, location, category_id, language: providedLanguage } = req.body;
  
  if (!citizen_id || !description) {
    return res.status(400).json({ error: "citizen_id and description are required" });
  }

  // Use language from frontend if provided, otherwise auto-detect
  const language = providedLanguage || (/[\u0600-\u06FF]/.test(description) ? 'ar' : 'en');
  const finalCategoryId = category_id || 7;

  try {
    // 1. Run AI Analysis
    let aiResult;
    try {
      aiResult = await analyzeComplaint(description);
    } catch (error) {
      console.error("Failed to run AI:", error);
      aiResult = { priority: "Medium", summary: "AI Analysis Failed", category: "Other" };
    }

    // 2. Find citizen user_id
    const users = await queryAsync(`SELECT user_id FROM users WHERE citizen_id = ? LIMIT 1`, [citizen_id]);
    if (!users.length) {
      return res.status(404).json({ error: "Citizen not found" });
    }
    const userId = users[0].user_id;

    // 3. Get candidate previous complaints for duplicate detection
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
      [finalCategoryId]
    );

    const duplicateResult = await detectDuplicateComplaint(description, candidateRows);

    // 4. Insert into ai_analysis including duplicate metadata
    const insertAnalysisQuery = `
      INSERT INTO ai_analysis (priority_level, summary, suggested_category, duplicate_of_id, similarity_score)
      VALUES (?, ?, ?, ?, ?)
    `;
    const aiRes = await queryAsync(insertAnalysisQuery, [
      aiResult.priority,
      aiResult.summary,
      aiResult.category,
      duplicateResult.duplicateOfId,
      duplicateResult.similarityScore
    ]);

    const analysisId = aiRes.insertId;

    // 5. Insert complaint linked to analysis
    const insertQuery = `
      INSERT INTO complaints (citizen_id, category_id, analysis_id, description, language, status, location) 
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `;
    const complaintInsertResult = await queryAsync(insertQuery, [
      userId,
      finalCategoryId,
      analysisId,
      description,
      language,
      location || null
    ]);

    await logSystemActivity({
      actorCitizenId: citizen_id,
      activityType: "complaint_submitted",
      actionText: "submitted a new complaint",
      referenceId: complaintInsertResult.insertId
    });

    res.json({
      message: "Complaint submitted successfully with AI Analysis",
      complaint_id: complaintInsertResult.insertId,
      ai_analysis: {
        ...aiResult,
        duplicate_of_id: duplicateResult.duplicateOfId,
        similarity_score: duplicateResult.similarityScore
      },
      language,
      status: "Pending"
    });
  } catch (error) {
    console.error("Submit complaint flow error:", error);
    return res.status(500).json({ error: "Failed to submit complaint with AI analysis" });
  }
});

//get gategory
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ categories: results });
  });
});

// Upload complaint image
app.post("/api/complaints/:complaintId/images", upload.single('image'), (req, res) => {
  const { complaintId } = req.params;
  
  console.log("Image upload request - complaintId:", complaintId);
  console.log("Uploaded file:", req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: "No image uploaded" });
  }

  // Store the URL path to the image
  const imageUrl = `/uploads/${req.file.filename}`;
  
  const insertQuery = `
    INSERT INTO complaint_images (complaint_id, url) 
    VALUES (?, ?)
  `;
  
  db.query(insertQuery, [complaintId, imageUrl], (err, result) => {
    if (err) {
      console.error("Image insert error:", err.message);
      console.error("Error code:", err.code);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      message: "Image uploaded successfully", 
      image_id: result.insertId,
      url: imageUrl
    });
  });
});

// Get complaint images
app.get("/api/complaints/:complaintId/images", (req, res) => {
  const { complaintId } = req.params;
  
  const query = `SELECT * FROM complaint_images WHERE complaint_id = ?`;
  db.query(query, [complaintId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ images: results });
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

// Admin: Dashboard cards statistics
app.get("/api/admin/dashboard-stats", async (req, res) => {
  try {
    const [highPriorityRows, pendingRows, duesRows, citizensRows] = await Promise.all([
      queryAsync(
        `
        SELECT COUNT(*) AS total
        FROM complaints c
        JOIN ai_analysis a ON c.analysis_id = a.analysis_id
        WHERE a.priority_level = 'High'
          AND c.status <> 'Resolved'
        `
      ),
      queryAsync(`SELECT COUNT(*) AS total FROM complaints WHERE status = 'Pending'`),
      queryAsync(`SELECT COALESCE(SUM(amount), 0) AS total FROM dues WHERE status = 'paid'`),
      queryAsync(
        `
        SELECT COUNT(*) AS total
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        WHERE ur.role_id = 2
        `
      )
    ]);

    return res.json({
      high_priority: Number(highPriorityRows[0]?.total || 0),
      pending_issues: Number(pendingRows[0]?.total || 0),
      dues_collected: Number(duesRows[0]?.total || 0),
      registered_citizens: Number(citizensRows[0]?.total || 0)
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

// Admin: Live activity feed
app.get("/api/admin/live-activities", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  try {
    const rows = await queryAsync(
      `
      SELECT activity_id, actor_citizen_id, activity_type, action_text, reference_id, created_at
      FROM system_activities
      ORDER BY created_at DESC, activity_id DESC
      LIMIT ?
      `,
      [limit]
    );

    return res.json({ activities: rows });
  } catch (error) {
    console.error("Live activities fetch error:", error);
    return res.status(500).json({ error: "Failed to load live activities" });
  }
});

// Admin: Get all complaints
app.get("/api/admin/complaints", (req, res) => {
  const query = `
    SELECT c.*, u.full_name, u.citizen_id as user_citizen_id, cat.name as category_name
    FROM complaints c
    LEFT JOIN users u ON c.citizen_id = u.user_id OR c.citizen_id = u.citizen_id
    LEFT JOIN categories cat ON c.category_id = cat.category_id
    ORDER BY c.created_at DESC, c.complaint_id DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error fetching all complaints:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Remove duplicate matches from the OR join condition by grouping by complaint_id
    const uniqueComplaints = [];
    const seenIds = new Set();
    results.forEach(row => {
      if (!seenIds.has(row.complaint_id)) {
        seenIds.add(row.complaint_id);
        uniqueComplaints.push(row);
      }
    });

    res.json({ complaints: uniqueComplaints });
  });
});

// Admin: Update complaint status and write history log
app.put("/api/admin/complaints/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, updated_by = null } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required" });

  try {
    const currentRows = await queryAsync(
      "SELECT status FROM complaints WHERE complaint_id = ? LIMIT 1",
      [id]
    );

    if (!currentRows.length) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const previousStatus = currentRows[0].status;

    // If status did not change, avoid writing duplicate history logs.
    if (previousStatus === status) {
      return res.json({ message: "Status already set", complaint_id: Number(id), status });
    }

    await queryAsync("START TRANSACTION");

    await queryAsync(
      "UPDATE complaints SET status = ? WHERE complaint_id = ?",
      [status, id]
    );

    const updateText = `Status changed from ${previousStatus} to ${status}`;
    await queryAsync(
      `
      INSERT INTO complaint_updates (complaint_id, status, update_text, updated_by)
      VALUES (?, ?, ?, ?)
      `,
      [id, status, updateText, updated_by]
    );

    let adminCitizenId = null;
    if (updated_by) {
      const adminRows = await queryAsync(
        "SELECT citizen_id FROM users WHERE user_id = ? LIMIT 1",
        [updated_by]
      );
      adminCitizenId = adminRows[0]?.citizen_id || null;
    }

    await logSystemActivity({
      actorCitizenId: adminCitizenId,
      activityType: "complaint_status_changed",
      actionText: `changed complaint #${id} status to ${status}`,
      referenceId: Number(id)
    });

    await queryAsync("COMMIT");

    res.json({
      message: "Status updated successfully",
      complaint_id: Number(id),
      previous_status: previousStatus,
      current_status: status
    });
  } catch (error) {
    await queryAsync("ROLLBACK").catch(() => {});
    console.error("Status update error:", error);
    return res.status(500).json({ error: "Failed to update complaint status" });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});