/**
 * NEUROPULSE MAIN APPLICATION CONTROLLER
 * Manages view switching, setup bindings, canvas chart rendering, and CSV triggers.
 */
class NeuroPulseApp {
  constructor() {
    this.currentView = 'setup';
    this.currentSessionData = null;

    // Config state
    this.config = {
      mode: 'pvt', // 'pvt' | 'stroop'
      participantId: 'Player_01',
      durationSeconds: 300, // 5 min default (SRS)
      stroopTrials: 20,
      tappingHand: 'Right Hand',
      dominantHand: 'Right Hand',
      hand: 'Right Hand',
      finger: 'Index Finger',
      noiseLevel: 'Quiet Room',
      interruptions: 'None',
      notes: ''
    };
  }

  init() {
    // Bind testing engine DOM hooks
    window.testingEngine.bindElements();

    this.bindDOM();
    this.bindPills();
    this.updateHistoryBadge();
    this.showScreen('setup');
  }

  bindDOM() {
    // Header Actions
    const btnSound = document.getElementById('btn-toggle-sound');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    btnSound.addEventListener('click', () => {
      const isSound = window.soundEngine.toggleSound();
      iconSoundOn.classList.toggle('hidden', !isSound);
      iconSoundOff.classList.toggle('hidden', isSound);
    });

    // History Drawer
    const btnOpenHistory = document.getElementById('btn-open-history');
    const btnCloseHistory = document.getElementById('btn-close-history');
    const drawerHistory = document.getElementById('drawer-history');

    btnOpenHistory.addEventListener('click', () => {
      this.renderHistoryList();
      drawerHistory.classList.remove('hidden');
    });

    btnCloseHistory.addEventListener('click', () => {
      drawerHistory.classList.add('hidden');
    });

    drawerHistory.addEventListener('click', (e) => {
      if (e.target === drawerHistory) drawerHistory.classList.add('hidden');
    });

    // Mode Selector (PVT vs Stroop)
    const tabPvt = document.getElementById('tab-pvt');
    const tabStroop = document.getElementById('tab-stroop');
    const groupDuration = document.getElementById('group-duration');
    const groupStroopTrials = document.getElementById('group-stroop-trials');

    tabPvt.addEventListener('click', () => {
      this.config.mode = 'pvt';
      tabPvt.classList.add('active');
      tabStroop.classList.remove('active');
      groupDuration.classList.remove('hidden');
      groupStroopTrials.classList.add('hidden');
    });

    tabStroop.addEventListener('click', () => {
      this.config.mode = 'stroop';
      tabStroop.classList.add('active');
      tabPvt.classList.remove('active');
      groupDuration.classList.add('hidden');
      groupStroopTrials.classList.remove('hidden');
    });

    // Start Test CTA Button
    document.getElementById('btn-start-session').addEventListener('click', () => {
      this.readFormInputs();
      if (this.config.mode === 'pvt') {
        this.showScreen('pvt-test');
        window.testingEngine.startPVTSession(this.config);
      } else {
        this.showScreen('stroop-test');
        window.testingEngine.startStroopSession(this.config);
      }
    });

    // Abort Buttons
    document.getElementById('btn-abort-test').addEventListener('click', () => {
      if (confirm('Abort the current reaction time session?')) {
        window.testingEngine.abortSession();
      }
    });

    document.getElementById('btn-abort-stroop').addEventListener('click', () => {
      if (confirm('Abort the current Stroop session?')) {
        window.testingEngine.abortSession();
      }
    });

    // Results Screen Action Buttons
    document.getElementById('btn-return-home').addEventListener('click', () => {
      this.showScreen('setup');
    });

    document.getElementById('btn-export-current-csv').addEventListener('click', () => {
      if (this.currentSessionData) {
        window.storageEngine.exportSingleSessionCSV(this.currentSessionData);
      }
    });

    document.getElementById('btn-export-trial-csv').addEventListener('click', () => {
      if (this.currentSessionData) {
        window.storageEngine.exportRawTrialsCSV(this.currentSessionData);
      }
    });

    // History Drawer Actions
    document.getElementById('btn-export-all-csv').addEventListener('click', () => {
      window.storageEngine.exportAllSessionsCSV();
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm('Are you sure you want to permanently clear all saved session data?')) {
        window.storageEngine.clearAllSessions();
        this.renderHistoryList();
        this.updateHistoryBadge();
      }
    });
  }

  // Pill selectors for hand, finger, duration, and stroop trials
  bindPills() {
    this.setupPillGroup('duration-selector', (btn) => {
      this.config.durationSeconds = parseInt(btn.getAttribute('data-duration'), 10);
    });

    this.setupPillGroup('stroop-trials-selector', (btn) => {
      this.config.stroopTrials = parseInt(btn.getAttribute('data-trials'), 10);
    });

    this.setupPillGroup('tapping-hand-selector', (btn) => {
      this.config.tappingHand = btn.getAttribute('data-tapping-hand');
    });

    this.setupPillGroup('hand-selector', (btn) => {
      this.config.hand = btn.getAttribute('data-hand');
      this.config.dominantHand = btn.getAttribute('data-hand');
    });

    this.setupPillGroup('finger-selector', (btn) => {
      this.config.finger = btn.getAttribute('data-finger');
    });
  }

  setupPillGroup(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('.pill-btn');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onSelect(btn);
      });
    });
  }

  readFormInputs() {
    const inputId = document.getElementById('input-participant-id');
    const selectNoise = document.getElementById('select-noise');
    const selectInterruption = document.getElementById('select-interruption');
    const inputNotes = document.getElementById('input-notes');

    this.config.participantId = (inputId.value || '').trim() || 'Player_01';
    this.config.noiseLevel = selectNoise.value;
    this.config.interruptions = selectInterruption.value;
    this.config.notes = (inputNotes.value || '').trim();
  }

  showScreen(screenName) {
    this.currentView = screenName;
    const screens = {
      'setup': document.getElementById('screen-setup'),
      'pvt-test': document.getElementById('screen-pvt-test'),
      'stroop-test': document.getElementById('screen-stroop-test'),
      'results': document.getElementById('screen-results')
    };

    Object.keys(screens).forEach(key => {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === screenName);
      }
    });
  }

  // Populate and render Results View
  displayResults(data) {
    this.currentSessionData = data;
    this.updateHistoryBadge();
    this.showScreen('results');

    // Header banner
    document.getElementById('results-badge-type').textContent = data.testType.toUpperCase();
    document.getElementById('results-summary-headline').textContent = `${data.medianRT} ms Median RT`;
    document.getElementById('results-timestamp').textContent = `Test Start: ${data.startTimeClock} (${data.startTimeISO.slice(0, 10)})`;

    // Metrics grid
    document.getElementById('metric-median-rt').textContent = `${data.medianRT} ms`;
    document.getElementById('metric-mean-rt').textContent = `${data.meanRT} ms`;
    document.getElementById('metric-best-rt').textContent = `${data.bestRT} ms`;
    document.getElementById('metric-worst-rt').textContent = `${data.worstRT} ms`;
    document.getElementById('metric-lapses').textContent = data.lapsesCount;
    document.getElementById('metric-lapse-rate').textContent = `${data.lapseRate}% lapse rate`;
    document.getElementById('metric-false-starts').textContent = data.falseStartsCount;
    document.getElementById('metric-valid-trials').textContent = data.validTrialsCount;
    document.getElementById('metric-accuracy-rate').textContent = `${data.accuracyRate}% accuracy`;

    // Stroop Results Card
    const stroopCard = document.getElementById('stroop-results-card');
    if (data.testType.includes('Stroop')) {
      stroopCard.classList.remove('hidden');
      document.getElementById('metric-stroop-cong').textContent = `${data.stroopCongruentMeanRT} ms`;
      document.getElementById('metric-stroop-incong').textContent = `${data.stroopIncongruentMeanRT} ms`;
      document.getElementById('metric-stroop-interference').textContent = `${data.stroopInterferenceDelta > 0 ? '+' : ''}${data.stroopInterferenceDelta} ms`;
      document.getElementById('metric-stroop-errors').textContent = data.stroopErrorsCount;
    } else {
      stroopCard.classList.add('hidden');
    }

    // Metadata Review
    document.getElementById('res-meta-participant').textContent = data.participantId;
    document.getElementById('res-meta-clock').textContent = data.startTimeClock;
    const resTappingHand = document.getElementById('res-meta-tapping-hand');
    if (resTappingHand) resTappingHand.textContent = data.tappingHand || data.hand || 'Right Hand';
    document.getElementById('res-meta-hand').textContent = `${data.dominantHand || data.hand || 'Right Hand'} • ${data.finger || 'Index'}`;
    document.getElementById('res-meta-noise').textContent = data.noiseLevel;
    document.getElementById('res-meta-interruptions').textContent = data.interruptions;
    document.getElementById('res-meta-notes').textContent = data.notes || 'None logged';

    // Render Canvas Chart
    setTimeout(() => {
      this.drawLatencyChart(data);
    }, 100);
  }

  // Draw smooth HTML5 2D Latency Chart
  drawLatencyChart(data) {
    const canvas = document.getElementById('canvas-trial-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = (rect.width || 500) * dpr;
    canvas.height = (rect.height || 200) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width || 500;
    const height = rect.height || 200;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const trials = (data.trials || []).filter(t => !t.isFalseStart && t.rt >= 100);
    if (trials.length === 0) {
      ctx.fillStyle = '#8e9bb0';
      ctx.font = '14px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No valid reaction trials to graph.', width / 2, height / 2);
      return;
    }

    const padding = { top: 25, right: 25, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxRT = Math.max(600, ...trials.map(t => t.rt) * 1.1);
    const minRT = 0;

    const getY = (val) => padding.top + chartH - ((val - minRT) / (maxRT - minRT)) * chartH;
    const getX = (idx) => padding.left + (idx / Math.max(1, trials.length - 1)) * chartW;

    // Draw 500ms Lapse Threshold Line (Dashed Orange)
    const lapseY = getY(500);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 183, 3, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding.left, lapseY);
    ctx.lineTo(width - padding.right, lapseY);
    ctx.stroke();

    ctx.fillStyle = '#ffb703';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('500ms Lapse Limit', padding.left + 5, lapseY - 4);

    // Draw Median Line (Dashed Cyan)
    const medianY = getY(data.medianRT);
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding.left, medianY);
    ctx.lineTo(width - padding.right, medianY);
    ctx.stroke();

    ctx.fillStyle = '#00f2fe';
    ctx.fillText(`Median (${data.medianRT}ms)`, width - padding.right - 95, medianY - 4);
    ctx.setLineDash([]);

    // Draw Connecting Trend Curve
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
    ctx.lineWidth = 2.5;

    trials.forEach((t, i) => {
      const x = getX(i);
      const y = getY(t.rt);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Plot Points
    trials.forEach((t, i) => {
      const x = getX(i);
      const y = getY(t.rt);
      const isLapse = t.rt > 500;

      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isLapse ? '#ff3366' : '#00f2fe';
      ctx.fill();
      ctx.strokeStyle = '#07090e';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Y-Axis Labels
    ctx.fillStyle = '#54627a';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    [0, 250, 500, Math.round(maxRT)].forEach(tick => {
      ctx.fillText(`${tick}`, padding.left - 8, getY(tick) + 3);
    });

    // X-Axis Label
    ctx.textAlign = 'center';
    ctx.fillText('Trial Progression Sequence', width / 2, height - 8);
  }

  // History Badge Count
  updateHistoryBadge() {
    const sessions = window.storageEngine.getAllSessions();
    const pill = document.getElementById('history-counter-pill');
    if (pill) {
      if (sessions.length > 0) {
        pill.textContent = sessions.length;
        pill.classList.remove('hidden');
      } else {
        pill.classList.add('hidden');
      }
    }
  }

  // Populate Saved Sessions List in Drawer
  renderHistoryList() {
    const listContainer = document.getElementById('history-list-container');
    const sessions = window.storageEngine.getAllSessions();

    if (!sessions || sessions.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <p>No tests recorded yet.</p>
          <span>Complete a 5-minute PVT or Stroop test to log data.</span>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = sessions.map(s => `
      <div class="history-item-card" data-id="${s.sessionId}">
        <div class="history-item-top">
          <span class="history-type-badge">${s.testType}</span>
          <span class="history-date">${s.startTimeClock} • ${s.startTimeISO ? s.startTimeISO.slice(0, 10) : ''}</span>
        </div>
        <div class="history-item-stats">
          <div>Participant: <strong>${s.participantId || 'Player'}</strong></div>
          <div>Tapping Hand: <strong class="font-mono" style="color:var(--cyan-bright)">${s.tappingHand || s.hand || 'Right Hand'}</strong></div>
          <div>Median: <strong class="text-success font-mono">${s.medianRT} ms</strong></div>
          <div>Lapses: <strong class="text-warning font-mono">${s.lapsesCount}</strong></div>
        </div>
        <div class="history-item-actions" style="display:flex; gap:8px; margin-top:4px;">
          <button class="btn-action-primary download-single-btn" data-id="${s.sessionId}" style="padding: 6px 10px; font-size: 0.74rem;">
            Export CSV
          </button>
          <button class="btn-action-secondary view-session-btn" data-id="${s.sessionId}" style="padding: 6px 10px; font-size: 0.74rem;">
            View Analytics
          </button>
        </div>
      </div>
    `).join('');

    // Bind item buttons
    listContainer.querySelectorAll('.download-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const session = sessions.find(s => s.sessionId === id);
        if (session) window.storageEngine.exportSingleSessionCSV(session);
      });
    });

    listContainer.querySelectorAll('.view-session-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const session = sessions.find(s => s.sessionId === id);
        if (session) {
          document.getElementById('drawer-history').classList.add('hidden');
          this.displayResults(session);
        }
      });
    });
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new NeuroPulseApp();
  window.app.init();

  // Register Service Worker for offline PWA / APK support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('NeuroPulse Service Worker registered:', reg.scope))
      .catch(err => console.log('Service Worker registration skipped/failed:', err));
  }
});

