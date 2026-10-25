/**
 * NEUROPULSE STORAGE & EXPORT ENGINE
 * Hybrid storage: Offline local storage + Automatic Cloud Sync to Vercel Serverless Backend.
 */
class StorageEngine {
  constructor() {
    this.STORAGE_KEY = 'neuropulse_pvt_sessions_v1';
    this.apiAvailable = true;
  }

  // Load all recorded sessions from localStorage
  getAllSessions() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
      return [];
    }
  }

  // Save a new test session to localStorage + Sync to Vercel backend
  async saveSession(sessionData) {
    try {
      // 1. Instant local persistence (offline resilience)
      const sessions = this.getAllSessions();
      sessions.unshift(sessionData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));

      // 2. Non-blocking cloud backend sync
      this.syncSessionToBackend(sessionData);
      return true;
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
      return false;
    }
  }

  // Sync to Vercel Serverless /api/sessions
  async syncSessionToBackend(sessionData) {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (response.ok) {
        console.log('✅ Session synced to Vercel backend:', sessionData.sessionId);
      }
    } catch (err) {
      // Offline or local file mode — local persistence already succeeded
      console.log('Cloud sync unavailable (offline mode). Stored locally.');
    }
  }

  // Clear all saved sessions (locally and on backend)
  async clearAllSessions() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      fetch('/api/sessions', { method: 'DELETE' }).catch(() => {});
      return true;
    } catch (e) {
      console.error('Failed to clear sessions', e);
      return false;
    }
  }

  // Trigger a browser file download for a CSV string
  downloadCSV(csvString, defaultFilename = 'NeuroPulse_Reaction_Data.csv') {
    try {
      // Add UTF-8 BOM so Excel and spreadsheet apps render characters and formatting cleanly
      const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', defaultFilename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (e) {
      console.error('Failed to trigger CSV download', e);
      alert('Could not download CSV automatically. Please check browser permissions.');
      return false;
    }
  }

  // Download all sessions aggregated CSV
  exportAllSessionsCSV() {
    const sessions = this.getAllSessions();
    if (!sessions || sessions.length === 0) {
      alert('No recorded sessions to export yet! Please complete a test first.');
      return;
    }
    const csv = AnalyticsEngine.generateSessionsCSV(sessions);
    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadCSV(csv, `NeuroPulse_AllSessions_${dateStr}.csv`);
  }

  // Download current/single session summary CSV
  exportSingleSessionCSV(session) {
    if (!session) return;
    const csv = AnalyticsEngine.generateSessionsCSV([session]);
    const cleanId = (session.sessionId || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
    this.downloadCSV(csv, `NeuroPulse_Session_${cleanId}.csv`);
  }

  // Download raw trial-by-trial millisecond CSV
  exportRawTrialsCSV(session) {
    if (!session || !session.trials || session.trials.length === 0) {
      alert('No raw trial data found for this session.');
      return;
    }
    const csv = AnalyticsEngine.generateDetailedTrialsCSV(session);
    const cleanId = (session.sessionId || 'session').replace(/[^a-zA-Z0-9_-]/g, '_');
    this.downloadCSV(csv, `NeuroPulse_RawTrials_${cleanId}.csv`);
  }
}

window.storageEngine = new StorageEngine();
