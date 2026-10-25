/**
 * VERCEL SERVERLESS BACKEND API — SESSION PERSISTENCE
 * Handles POST (save session), GET (retrieve all sessions), DELETE (clear).
 * Uses /tmp/ filesystem storage with in-memory cache for serverless environments.
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join('/tmp', 'neuropulse_sessions.json');

// Helper to load sessions from serverless /tmp store
function loadSessions() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading sessions database:', err);
  }
  return [];
}

// Helper to persist sessions
function saveSessions(sessions) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(sessions, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving sessions database:', err);
    return false;
  }
}

module.exports = async (req, res) => {
  // Set CORS headers for mobile and web cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET: Retrieve all saved test sessions
    if (req.method === 'GET') {
      const sessions = loadSessions();
      return res.status(200).json({
        success: true,
        count: sessions.length,
        sessions: sessions
      });
    }

    // POST: Save a completed test session
    if (req.method === 'POST') {
      const sessionData = req.body;

      if (!sessionData || !sessionData.sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required session payload or sessionId.'
        });
      }

      const sessions = loadSessions();
      // Prepend so latest session is always first
      sessions.unshift({
        ...sessionData,
        syncedAt: new Date().toISOString()
      });

      // Keep up to 500 recent sessions in server cache
      if (sessions.length > 500) {
        sessions.length = 500;
      }

      saveSessions(sessions);

      return res.status(201).json({
        success: true,
        message: 'Session successfully saved to backend database.',
        sessionId: sessionData.sessionId,
        syncedAt: new Date().toISOString()
      });
    }

    // DELETE: Clear sessions history
    if (req.method === 'DELETE') {
      saveSessions([]);
      return res.status(200).json({
        success: true,
        message: 'All sessions successfully cleared from backend.'
      });
    }

    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Serverless API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
