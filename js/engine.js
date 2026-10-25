/**
 * NEUROPULSE TESTING ENGINE
 * High-precision, sub-millisecond timer architecture for PVT & Stroop tests.
 * Fully compliant with SRS 4.2 and high-frequency touch listener standards.
 */
class TestingEngine {
  constructor() {
    this.activeMode = null; // 'pvt' | 'stroop' | null
    this.sessionConfig = null;
    this.trials = [];
    this.isRunning = false;

    // PVT Engine state
    this.pvtState = 'idle'; // 'idle' | 'waiting_stimulus' | 'stimulus_visible' | 'feedback'
    this.stimulusTimestamp = 0;
    this.scheduledDelay = 0;
    this.delayTimerId = null;
    this.sessionTimerId = null;
    this.sessionEndTime = 0;
    this.totalDurationMs = 300000; // 5 min default (SRS)

    // Stroop Engine state
    this.stroopCurrentTrial = 0;
    this.stroopTotalTrials = 20;
    this.stroopStimulusTimestamp = 0;
    this.stroopColors = [
      { name: 'RED', hex: '#ff3b30' },
      { name: 'GREEN', hex: '#34c759' },
      { name: 'BLUE', hex: '#007aff' },
      { name: 'YELLOW', hex: '#ffd60a' }
    ];

    // DOM Element hooks
    this.elements = {};
  }

  bindElements() {
    this.elements = {
      // PVT Elements
      pvtScreen: document.getElementById('screen-pvt-test'),
      pvtArena: document.getElementById('pvt-arena'),
      stimulusDigit: document.getElementById('stimulus-digit'),
      stimulusStatus: document.getElementById('stimulus-status-indicator'),
      instantFeedback: document.getElementById('instant-feedback-banner'),
      hudTimer: document.getElementById('hud-timer'),
      hudProgressFill: document.getElementById('hud-progress-fill'),
      hudTrialCount: document.getElementById('hud-trial-count'),
      hudLastRt: document.getElementById('hud-last-rt'),
      hudLapses: document.getElementById('hud-lapses'),

      // Stroop Elements
      stroopScreen: document.getElementById('screen-stroop-test'),
      stroopWordDisplay: document.getElementById('stroop-word-display'),
      stroopFeedback: document.getElementById('stroop-feedback'),
      stroopHudTrial: document.getElementById('stroop-hud-trial'),
      stroopHudCongRt: document.getElementById('stroop-hud-cong-rt'),
      stroopHudIncongRt: document.getElementById('stroop-hud-incong-rt'),
      stroopHudErrors: document.getElementById('stroop-hud-errors')
    };

    this.attachEventListeners();
  }

  attachEventListeners() {
    const arena = this.elements.pvtArena;
    if (!arena) return;

    // Use pointerdown with high responsiveness
    // Handled with passive: false to allow instant event processing
    const handleTap = (e) => {
      if (!this.isRunning || this.activeMode !== 'pvt') return;
      if (e.target && e.target.id === 'btn-abort-test') return;
      e.preventDefault();
      this.handlePVTTap();
    };

    arena.addEventListener('pointerdown', handleTap, { passive: false });
    
    // Keyboard spacebar listener for desktop pair-testing
    window.addEventListener('keydown', (e) => {
      if (this.isRunning && this.activeMode === 'pvt' && (e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        this.handlePVTTap();
      }
    });

    // Stroop Buttons
    const stroopButtons = document.querySelectorAll('.stroop-btn');
    stroopButtons.forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        if (!this.isRunning || this.activeMode !== 'stroop') return;
        e.preventDefault();
        const color = btn.getAttribute('data-color');
        this.handleStroopResponse(color);
      }, { passive: false });
    });
  }

  // =================================================================
  // PVT (PSYCHOMOTOR VIGILANCE TASK) RUNNER
  // =================================================================

  startPVTSession(config) {
    this.activeMode = 'pvt';
    this.sessionConfig = {
      ...config,
      startTimeClock: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      startTimeISO: new Date().toISOString()
    };
    this.trials = [];
    this.isRunning = true;
    this.totalDurationMs = (config.durationSeconds || 300) * 1000;
    this.sessionEndTime = performance.now() + this.totalDurationMs;

    // Reset HUD display
    this.updatePVTHUD();
    this.elements.pvtArena.classList.remove('stimulus-active', 'false-start', 'lapse-warning');
    this.elements.stimulusDigit.textContent = '➕';
    this.elements.stimulusStatus.textContent = 'PREPARE... FOCUS ON CENTER';
    this.elements.instantFeedback.textContent = 'Test beginning in 2s';
    this.elements.instantFeedback.style.color = 'var(--text-muted)';

    // Start background session countdown timer
    this.startSessionTimer();

    // Initial countdown lead-in
    setTimeout(() => {
      if (this.isRunning) {
        this.scheduleNextPVTStimulus();
      }
    }, 1800);
  }

  startSessionTimer() {
    clearInterval(this.sessionTimerId);
    this.sessionTimerId = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(this.sessionTimerId);
        return;
      }

      const remainingMs = Math.max(0, this.sessionEndTime - performance.now());
      const remainingSec = Math.ceil(remainingMs / 1000);
      const minutes = String(Math.floor(remainingSec / 60)).padStart(2, '0');
      const seconds = String(remainingSec % 60).padStart(2, '0');
      
      this.elements.hudTimer.textContent = `${minutes}:${seconds}`;

      // Progress bar fill
      const progressPercent = Math.min(100, Math.max(0, (remainingMs / this.totalDurationMs) * 100));
      this.elements.hudProgressFill.style.width = `${progressPercent}%`;

      // Check if session completed
      if (remainingMs <= 0) {
        this.completePVTSession();
      }
    }, 200);
  }

  scheduleNextPVTStimulus() {
    if (!this.isRunning) return;

    this.pvtState = 'waiting_stimulus';
    this.elements.pvtArena.classList.remove('stimulus-active', 'false-start', 'lapse-warning');
    this.elements.stimulusDigit.textContent = '···';
    this.elements.stimulusStatus.textContent = 'WAIT FOR DIGIT';
    this.elements.instantFeedback.textContent = 'Stay focused...';
    this.elements.instantFeedback.style.color = 'var(--text-dim)';

    // Randomized delay between 1.0s and 4.0s (SRS 4.2 Requirement)
    // 1000ms + (0 to 3000ms)
    this.scheduledDelay = Math.floor(1000 + Math.random() * 3000);

    clearTimeout(this.delayTimerId);
    this.delayTimerId = setTimeout(() => {
      this.triggerPVTStimulus();
    }, this.scheduledDelay);
  }

  triggerPVTStimulus() {
    if (!this.isRunning || this.pvtState !== 'waiting_stimulus') return;

    this.pvtState = 'stimulus_visible';
    // Generate random digit (0-9) as specified in SRS Section 4.2
    this.currentDigit = Math.floor(Math.random() * 10);
    this.elements.stimulusDigit.textContent = this.currentDigit;
    this.elements.stimulusStatus.textContent = 'TAP NOW!';
    this.elements.pvtArena.classList.add('stimulus-active');

    // High-resolution performance timestamp
    this.stimulusTimestamp = performance.now();

    // Play subtle audio stimulus beep
    window.soundEngine.playStimulus();

    // Check for extreme lapse timeout (> 3000ms unanswered)
    clearTimeout(this.lapseSafetyTimer);
    this.lapseSafetyTimer = setTimeout(() => {
      if (this.isRunning && this.pvtState === 'stimulus_visible') {
        // Record automatic lapse
        this.recordPVTTrial(3000, false);
        this.elements.instantFeedback.textContent = 'Missed! (>3000 ms)';
        this.elements.instantFeedback.style.color = 'var(--rose-danger)';
        window.soundEngine.playError();
        this.pvtState = 'feedback';
        setTimeout(() => this.scheduleNextPVTStimulus(), 1000);
      }
    }, 3000);
  }

  handlePVTTap() {
    const tapTimestamp = performance.now();

    // Case 1: Anticipation / Tapped BEFORE digit appeared (False Start)
    if (this.pvtState === 'waiting_stimulus') {
      clearTimeout(this.delayTimerId);
      this.pvtState = 'feedback';
      
      window.soundEngine.playError();
      window.soundEngine.triggerHaptic('error');

      this.elements.pvtArena.classList.add('false-start');
      this.elements.stimulusDigit.textContent = '⚠️';
      this.elements.stimulusStatus.textContent = 'FALSE START!';
      this.elements.instantFeedback.textContent = 'Too early! Wait for the digit.';
      this.elements.instantFeedback.style.color = 'var(--rose-danger)';

      // Record false start
      this.trials.push({
        trialNum: this.trials.length + 1,
        stimulusTime: null,
        responseTime: tapTimestamp,
        rt: 0,
        isFalseStart: true,
        stimulusDigit: null,
        delayMs: this.scheduledDelay
      });

      this.updatePVTHUD();

      // Penalty wait before resuming
      setTimeout(() => {
        if (this.isRunning) this.scheduleNextPVTStimulus();
      }, 1200);
      return;
    }

    // Case 2: Tapped when digit is visible
    if (this.pvtState === 'stimulus_visible') {
      clearTimeout(this.lapseSafetyTimer);
      this.pvtState = 'feedback';
      
      const rt = Math.round(tapTimestamp - this.stimulusTimestamp);

      if (rt < 100) {
        // False start: Sub-100ms reaction is physically anticipatory
        window.soundEngine.playError();
        window.soundEngine.triggerHaptic('error');
        this.elements.pvtArena.classList.add('false-start');
        this.elements.instantFeedback.textContent = `${rt} ms — False Start (<100ms)`;
        this.elements.instantFeedback.style.color = 'var(--rose-danger)';
        this.recordPVTTrial(rt, true);
      } else if (rt > 500) {
        // Lapse: Slower than 500ms
        window.soundEngine.playTapSuccess();
        window.soundEngine.triggerHaptic('light');
        this.elements.pvtArena.classList.remove('stimulus-active');
        this.elements.pvtArena.classList.add('lapse-warning');
        this.elements.instantFeedback.textContent = `${rt} ms — Lapse (>500ms)`;
        this.elements.instantFeedback.style.color = 'var(--amber-warning)';
        this.recordPVTTrial(rt, false);
      } else {
        // Optimal valid reaction!
        window.soundEngine.playTapSuccess();
        window.soundEngine.triggerHaptic('light');
        this.elements.pvtArena.classList.remove('stimulus-active');
        this.elements.instantFeedback.textContent = `${rt} ms — Optimal`;
        this.elements.instantFeedback.style.color = 'var(--emerald-success)';
        this.recordPVTTrial(rt, false);
      }

      this.updatePVTHUD();

      // Brief feedback delay before next trial
      setTimeout(() => {
        if (this.isRunning) this.scheduleNextPVTStimulus();
      }, 700);
    }
  }

  recordPVTTrial(rt, isFalseStart) {
    this.trials.push({
      trialNum: this.trials.length + 1,
      stimulusTime: this.stimulusTimestamp,
      responseTime: performance.now(),
      rt: rt,
      isFalseStart: isFalseStart,
      stimulusDigit: this.currentDigit,
      delayMs: this.scheduledDelay
    });
  }

  updatePVTHUD() {
    const valid = this.trials.filter(t => !t.isFalseStart && t.rt >= 100);
    const lapses = valid.filter(t => t.rt > 500).length;
    const lastTrial = this.trials[this.trials.length - 1];

    this.elements.hudTrialCount.textContent = valid.length;
    this.elements.hudLapses.textContent = lapses;

    if (lastTrial) {
      if (lastTrial.isFalseStart || lastTrial.rt < 100) {
        this.elements.hudLastRt.textContent = 'Early!';
        this.elements.hudLastRt.style.color = 'var(--rose-danger)';
      } else {
        this.elements.hudLastRt.textContent = `${lastTrial.rt} ms`;
        this.elements.hudLastRt.style.color = lastTrial.rt > 500 ? 'var(--amber-warning)' : 'var(--cyan-bright)';
      }
    } else {
      this.elements.hudLastRt.textContent = '--- ms';
      this.elements.hudLastRt.style.color = '#fff';
    }
  }

  completePVTSession() {
    this.isRunning = false;
    clearInterval(this.sessionTimerId);
    clearTimeout(this.delayTimerId);
    clearTimeout(this.lapseSafetyTimer);

    window.soundEngine.playCompleted();

    const processedResults = AnalyticsEngine.processPVTResults(this.trials, this.sessionConfig);
    window.storageEngine.saveSession(processedResults);

    if (window.app) {
      window.app.displayResults(processedResults);
    }
  }

  abortSession() {
    this.isRunning = false;
    clearInterval(this.sessionTimerId);
    clearTimeout(this.delayTimerId);
    clearTimeout(this.lapseSafetyTimer);
    if (window.app) {
      window.app.showScreen('setup');
    }
  }

  // =================================================================
  // STROOP COLOR-WORD INTERFERENCE ENGINE
  // =================================================================

  startStroopSession(config) {
    this.activeMode = 'stroop';
    this.sessionConfig = {
      ...config,
      startTimeClock: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      startTimeISO: new Date().toISOString()
    };
    this.trials = [];
    this.isRunning = true;
    this.stroopCurrentTrial = 0;
    this.stroopTotalTrials = config.stroopTrials || 20;

    this.updateStroopHUD();
    this.nextStroopTrial();
  }

  nextStroopTrial() {
    if (!this.isRunning) return;

    if (this.stroopCurrentTrial >= this.stroopTotalTrials) {
      this.completeStroopSession();
      return;
    }

    this.stroopCurrentTrial++;
    this.elements.stroopHudTrial.textContent = `Trial ${this.stroopCurrentTrial} / ${this.stroopTotalTrials}`;
    this.elements.stroopFeedback.textContent = 'Identify ink color...';
    this.elements.stroopFeedback.style.color = 'var(--text-dim)';

    // Randomize Congruent (50%) vs Incongruent (50%)
    const isCongruent = Math.random() < 0.5;
    const wordColorObj = this.stroopColors[Math.floor(Math.random() * this.stroopColors.length)];
    let inkColorObj;

    if (isCongruent) {
      inkColorObj = wordColorObj;
    } else {
      const remainingColors = this.stroopColors.filter(c => c.name !== wordColorObj.name);
      inkColorObj = remainingColors[Math.floor(Math.random() * remainingColors.length)];
    }

    this.currentStroopTrialData = {
      trialNum: this.stroopCurrentTrial,
      word: wordColorObj.name,
      inkColor: inkColorObj.name,
      inkHex: inkColorObj.hex,
      isCongruent: isCongruent
    };

    // Render word with ink color
    this.elements.stroopWordDisplay.textContent = wordColorObj.name;
    this.elements.stroopWordDisplay.style.color = inkColorObj.hex;
    this.elements.stroopWordDisplay.style.textShadow = `0 0 25px ${inkColorObj.hex}`;

    this.stroopStimulusTimestamp = performance.now();
  }

  handleStroopResponse(selectedColor) {
    if (!this.isRunning || this.activeMode !== 'stroop' || !this.currentStroopTrialData) return;

    const rt = Math.round(performance.now() - this.stroopStimulusTimestamp);
    const isCorrect = selectedColor === this.currentStroopTrialData.inkColor;

    if (isCorrect) {
      window.soundEngine.playTapSuccess();
      window.soundEngine.triggerHaptic('light');
      this.elements.stroopFeedback.textContent = `Correct! (${rt} ms)`;
      this.elements.stroopFeedback.style.color = 'var(--emerald-success)';
    } else {
      window.soundEngine.playError();
      window.soundEngine.triggerHaptic('error');
      this.elements.stroopFeedback.textContent = `Error! Ink was ${this.currentStroopTrialData.inkColor} (${rt} ms)`;
      this.elements.stroopFeedback.style.color = 'var(--rose-danger)';
    }

    this.trials.push({
      ...this.currentStroopTrialData,
      selectedColor,
      isCorrect,
      rt
    });

    this.updateStroopHUD();

    // Quick pause before next trial
    setTimeout(() => {
      this.nextStroopTrial();
    }, 450);
  }

  updateStroopHUD() {
    const correctTrials = this.trials.filter(t => t.isCorrect);
    const congTrials = correctTrials.filter(t => t.isCongruent);
    const incongTrials = correctTrials.filter(t => !t.isCongruent);
    const errorsCount = this.trials.filter(t => !t.isCorrect).length;

    const congMean = AnalyticsEngine.calculateMean(congTrials.map(t => t.rt));
    const incongMean = AnalyticsEngine.calculateMean(incongTrials.map(t => t.rt));

    this.elements.stroopHudCongRt.textContent = congTrials.length > 0 ? `${congMean} ms` : '--- ms';
    this.elements.stroopHudIncongRt.textContent = incongTrials.length > 0 ? `${incongMean} ms` : '--- ms';
    this.elements.stroopHudErrors.textContent = errorsCount;
  }

  completeStroopSession() {
    this.isRunning = false;
    window.soundEngine.playCompleted();

    const processedResults = AnalyticsEngine.processStroopResults(this.trials, this.sessionConfig);
    window.storageEngine.saveSession(processedResults);

    if (window.app) {
      window.app.displayResults(processedResults);
    }
  }
}

window.testingEngine = new TestingEngine();
