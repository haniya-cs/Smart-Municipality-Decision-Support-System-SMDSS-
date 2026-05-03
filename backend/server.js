const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const db = require("./db");
const upload = require("./middleware/upload");
const { initializeActivityUtils } = require("./utils/activity");
const { registerAuthRoutes } = require("./routes/authRoutes");
const { registerDuesRoutes } = require("./routes/duesRoutes");
const { registerComplaintRoutes } = require("./routes/complaintRoutes");
const { registerAnnouncementRoutes } = require("./routes/announcementRoutes");
const { registerAdminRoutes } = require("./routes/adminRoutes");
const { registerPublicRoutes } = require("./routes/publicRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const queryAsync = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) return reject(err);
      return resolve(results);
    });
  });

const { initializeActivityTable, logSystemActivity } = initializeActivityUtils({ queryAsync });
initializeActivityTable();

registerAuthRoutes({ app, db, logSystemActivity });
registerDuesRoutes({ app, db, queryAsync, logSystemActivity });
registerComplaintRoutes({ app, db, queryAsync, upload, logSystemActivity });
registerAnnouncementRoutes({ app, db, upload });
registerAdminRoutes({ app, db, queryAsync, logSystemActivity });
registerPublicRoutes({ app, queryAsync });
 
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
