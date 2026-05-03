const registerPublicRoutes = ({ app, queryAsync }) => {
  app.get("/api/public/home-stats", async (req, res) => {
    try {
      const [totalsRows, resolvedRows, avgHoursRows] = await Promise.all([
        queryAsync(`SELECT COUNT(*) AS total FROM complaints`),
        queryAsync(`SELECT COUNT(*) AS total FROM complaints WHERE LOWER(TRIM(status)) = 'resolved'`),
        queryAsync(`
          SELECT AVG(TIMESTAMPDIFF(HOUR, c.created_at, cu.first_resolved_at)) AS avg_hours
          FROM complaints c
          JOIN (
            SELECT complaint_id, MIN(updated_at) AS first_resolved_at
            FROM complaint_updates
            WHERE LOWER(TRIM(status)) = 'resolved'
            GROUP BY complaint_id
          ) cu ON cu.complaint_id = c.complaint_id
          WHERE LOWER(TRIM(c.status)) = 'resolved'
        `)
      ]);

      const totalComplaints = Number(totalsRows[0]?.total || 0);
      const resolvedComplaints = Number(resolvedRows[0]?.total || 0);
      const avgHoursRaw = avgHoursRows[0]?.avg_hours;
      const avgHours = avgHoursRaw === null || avgHoursRaw === undefined ? null : Number(avgHoursRaw);

      let satisfactionPercent = null;
      if (totalComplaints > 0) {
        const resolvedRate = resolvedComplaints / totalComplaints;
        let fastRate = 0;
        if (avgHours !== null && !Number.isNaN(avgHours)) {
          fastRate = avgHours <= 48 ? 1 : Math.max(0, 1 - (avgHours - 48) / 120);
        }
        const score = 55 + resolvedRate * 35 + fastRate * 10;
        satisfactionPercent = Math.min(99, Math.max(65, Math.round(score)));
      }

      return res.json({
        complaints_resolved: resolvedComplaints,
        complaints_total: totalComplaints,
        avg_resolution_hours: avgHours,
        satisfaction_percent: satisfactionPercent
      });
    } catch (error) {
      return res.status(500).json({ error: "Failed to load home stats" });
    }
  });
};

module.exports = { registerPublicRoutes };
