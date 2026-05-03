const initializeActivityUtils = ({ queryAsync }) => {
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

  return { initializeActivityTable, logSystemActivity };
};

module.exports = { initializeActivityUtils };
