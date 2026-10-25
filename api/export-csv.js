/**
 * VERCEL SERVERLESS BACKEND API — CSV EXPORT STREAM
 * Generates and streams standard RFC 4180 CSV directly with download headers.
 */
const fs = require('fs');
const path = require('path');
const AnalyticsEngine = require('../js/analytics.js');

const DB_PATH = path.join('/tmp', 'neuropulse_sessions.json');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let sessions = [];
    if (fs.existsSync(DB_PATH)) {
      sessions = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }

    if (!sessions || sessions.length === 0) {
      // Return empty CSV structure if no sessions
      const emptyCsv = AnalyticsEngine.generateSessionsCSV([]);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="neuropulse_empty.csv"');
      return res.status(200).send('\uFEFF' + emptyCsv);
    }

    const csvContent = AnalyticsEngine.generateSessionsCSV(sessions);
    const dateStamp = new Date().toISOString().slice(0, 10);

    // Set download headers for automatic file save in browser
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="neuropulse_sessions_${dateStamp}.csv"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Prepend UTF-8 BOM so Excel opens the file cleanly without character encoding issues
    return res.status(200).send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('CSV Export Error:', error);
    return res.status(500).json({ error: 'Failed to generate CSV export', message: error.message });
  }
};
