const mysql = require ("mysql2");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "smdss_db (2)"
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

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    const allowedTypes = /jpeg|jpg|png|gif|jfif|webp/;
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

     // Extract all roles for the user
    const roles = results.map((row) => row.role_id);

    // Return user data along with roles
    return res.json({ 
      message: "Login successful", 
      roles,
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
app.post("/api/complaints", (req, res) => {
  const { citizen_id, description, location, category_id, language: providedLanguage } = req.body;
  
  if (!citizen_id || !description) {
    return res.status(400).json({ error: "citizen_id and description are required" });
  }

  // Use language from frontend if provided, otherwise auto-detect
  const language = providedLanguage || (/[\u0600-\u06FF]/.test(description) ? 'ar' : 'en');
  const finalCategoryId = category_id || 7;

  // First, get the user_id from the citizen_id string
  const getUserQuery = `SELECT user_id FROM users WHERE citizen_id = ?`;
  db.query(getUserQuery, [citizen_id], (err, results) => {
    if (err || results.length === 0) {
      console.error("User not found:", err);
      return res.status(500).json({ error: "Citizen not found" });
    }

    const userId = results[0].user_id;

    // Now insert with the numeric user_id
    const insertQuery = `
      INSERT INTO complaints (citizen_id, category_id, description, language, status, location) 
      VALUES (?, ?, ?, ?, 'Pending', ?)
    `;
    
    db.query(insertQuery, [userId, finalCategoryId, description, language, location || null], 
      (err2, result) => {
        if (err2) {
          console.error("Insert error:", err2.message);
          return res.status(500).json({ error: err2.message });
        }
        
        res.json({ 
          message: "Complaint submitted successfully", 
          complaint_id: result.insertId,
          language: language,
          status: 'Pending'
        });
      });
  });
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

// ==================== ANNOUNCEMENTS ENDPOINTS ====================

// Create a new announcement (Admin)
app.post("/api/announcements", upload.single('image'), (req, res) => {
  const { admin_id, title, content, type, publish_start, publish_end } = req.body;
  const allowedTypes = ['urgent','event','general','meeting','maintenance'];

let finalType = (type || 'general').toString().trim().toLowerCase();

if (!allowedTypes.includes(finalType)) {
  finalType = 'general'; // fallback
}
  //const finalType = (type || 'general').toString().trim().toLowerCase();
  if (!admin_id || !title || !content || !finalType) {
    return res.status(400).json({ error: "admin_id, title, content, and type are required" });
  }
  
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
//
 const getUserIdQuery = "SELECT user_id FROM users WHERE citizen_id = ?";

  db.query(getUserIdQuery, [admin_id], (err, result) => {
    if (err) {
      console.error("User lookup error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = result[0].user_id;

  console.log("Final type value:", finalType); // Debugging log

    const query = `
      INSERT INTO announcements (admin_id, title, content, type, image, publish_start, publish_end) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [userId, title, content, finalType, imageUrl, publish_start || null, publish_end || null], 
      (err, result) => {
        if (err) {
          console.error("Insert announcement error:", err); // Log any errors
          return res.status(500).json({ error: "Database error", details: err.message });
        }
        
        res.json({ 
          message: "Announcement published successfully", 
          announcement_id: result.insertId
        });
      }
    );
  });
});

// Get all announcements (for Admin management page)
app.get("/api/announcements", (req, res) => {
  const query = `
    SELECT a.*, u.full_name as admin_name
    FROM announcements a
    LEFT JOIN users u ON a.admin_id = u.user_id
    ORDER BY a.announcement_id DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error fetching announcements:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ announcements: results });
  });
});

// Get urgent announcements only (for Home page)
app.get("/api/announcements/urgent", (req, res) => {
  
  const query = `
    SELECT a.*, u.full_name as admin_name
    FROM announcements a
    LEFT JOIN users u ON a.admin_id = u.user_id
   WHERE a.type = 'urgent'
      AND (
     (a.publish_start IS NULL OR a.publish_start = '' OR a.publish_start <= NOW())
     AND 
     (a.publish_end IS NULL OR a.publish_end = '' OR a.publish_end >= NOW())
     )
    ORDER BY a.announcement_id DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error fetching urgent announcements:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ announcements: results });
  });
});

// Get public announcements (for Guest/Citizen pages)
app.get("/api/announcements/public", (req, res) => {

  const query = `
    SELECT a.*, u.full_name as admin_name
    FROM announcements a
    LEFT JOIN users u ON a.admin_id = u.user_id
    WHERE (
      (a.publish_start IS NULL OR a.publish_start = '' OR a.publish_start <= NOW())
      AND 
      (a.publish_end IS NULL OR a.publish_end = '' OR a.publish_end >= NOW())
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
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Database error fetching public announcements:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ announcements: results });
  });
});

// Delete an announcement (Admin)
app.delete("/api/announcements/:announcementId", (req, res) => {
  const { announcementId } = req.params;
  
  const query = "DELETE FROM announcements WHERE announcement_id = ?";
  db.query(query, [announcementId], (err, result) => {
    if (err) {
      console.error("Delete announcement error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.json({ message: "Announcement deleted successfully" });
  });
});

//get properties for dropdown
app.get("/api/citizens/:citizen_id/properties", (req, res) => {
  const { citizen_id } = req.params;

  // Step 1: get user_id from citizen_id
  const userQuery = "SELECT user_id FROM users WHERE citizen_id= ?";

  db.query(userQuery, [citizen_id], (err, userResult) => {
    if (err) {
      console.error("User lookup error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (userResult.length === 0) {
      return res.status(404).json({ error: "Citizen not found" });
    }

    const user_id = userResult[0].user_id;

    // Step 2: get properties
    const propertyQuery = `
      SELECT property_id, type, location
      FROM properties
      WHERE owner_id = ?
    `;

    db.query(propertyQuery, [user_id], (err, properties) => {
      if (err) {
        console.error("Property fetch error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({ properties });
    });
  });
});

//post new due
app.post("/api/dues", (req, res) => {
  const { property_id, type, amount, due_date, status, content } = req.body;

  const query = `
    INSERT INTO dues (property_id, type, amount, due_date, status, content)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [property_id, type, amount, due_date, status, content], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Due added successfully" });
  });
});
// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});