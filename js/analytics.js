/**
 * NEUROPULSE ANALYTICS & STATISTICAL ENGINE
 * Computes clinical PVT and Stroop metrics:
 * - Median reaction time (ms)
 * - Mean reaction time (ms)
 * - Lapses (slower than 500 ms)
 * - False starts (faster than 100 ms)
 * - Number of valid trials
 * - Stroop Congruent / Incongruent Mean RT and errors
 * - RFC 4180 compliant CSV Export
 */
class AnalyticsEngine {
  
  // Calculate arithmetic mean
  static calculateMean(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return Math.round((sum / values.length) * 10) / 10;
  }

  // Calculate true median (handles odd and even sample sizes)
  static calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return Math.round(sorted[mid]);
    }
    return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
  }

  // Process raw PVT trials into standardized clinical metrics
  static processPVTResults(trials, sessionConfig) {
    // A trial is an object: { trialNum, stimulusTime, responseTime, rt, isFalseStart, stimulusDigit }
    const validTrials = trials.filter(t => !t.isFalseStart && t.rt >= 100);
    const validRTs = validTrials.map(t => t.rt);

    const falseStartsCount = trials.filter(t => t.isFalseStart || t.rt < 100).length;
    const lapsesList = validTrials.filter(t => t.rt > 500);
    const lapsesCount = lapsesList.length;

    const meanRT = this.calculateMean(validRTs);
    const medianRT = this.calculateMedian(validRTs);

    const bestRT = validRTs.length > 0 ? Math.min(...validRTs) : 0;
    const worstRT = validRTs.length > 0 ? Math.max(...validRTs) : 0;

    const totalTrialsCount = trials.length;
    const lapseRate = validTrials.length > 0 
      ? Math.round((lapsesCount / validTrials.length) * 1000) / 10 
      : 0;

    const accuracyRate = totalTrialsCount > 0
      ? Math.round(((validTrials.length - lapsesCount) / totalTrialsCount) * 1000) / 10
      : 100;

    return {
      sessionId: 'PVT_' + Date.now().toString(36).toUpperCase(),
      testType: 'PVT (Digit Reaction)',
      startTimeClock: sessionConfig.startTimeClock || new Date().toLocaleString(),
      startTimeISO: sessionConfig.startTimeISO || new Date().toISOString(),
      durationSeconds: sessionConfig.durationSeconds || 300,
      participantId: sessionConfig.participantId || 'Anonymous',
      hand: sessionConfig.hand || 'Right Hand',
      finger: sessionConfig.finger || 'Index Finger',
      noiseLevel: sessionConfig.noiseLevel || 'Quiet Room',
      interruptions: sessionConfig.interruptions || 'None',
      notes: sessionConfig.notes || '',
      
      // Core Required Metrics
      meanRT,
      medianRT,
      bestRT,
      worstRT,
      validTrialsCount: validTrials.length,
      totalTrialsCount,
      falseStartsCount,
      lapsesCount,
      lapseRate,
      accuracyRate,

      // Stroop fields set to null/empty for PVT
      stroopCongruentMeanRT: null,
      stroopIncongruentMeanRT: null,
      stroopInterferenceDelta: null,
      stroopErrorsCount: null,
      stroopValidCount: null,

      // Raw trial log for chart and detailed export
      trials: trials
    };
  }

  // Process Stroop trials into cognitive interference metrics
  static processStroopResults(trials, sessionConfig) {
    // Each trial: { trialNum, word, inkColor, isCongruent, selectedColor, isCorrect, rt }
    const correctTrials = trials.filter(t => t.isCorrect && t.rt >= 100);
    const congruentTrials = correctTrials.filter(t => t.isCongruent);
    const incongruentTrials = correctTrials.filter(t => !t.isCongruent);

    const congRTs = congruentTrials.map(t => t.rt);
    const incongRTs = incongruentTrials.map(t => t.rt);
    const allValidRTs = correctTrials.map(t => t.rt);

    const congMean = this.calculateMean(congRTs);
    const incongMean = this.calculateMean(incongRTs);
    const interferenceDelta = Math.round((incongMean - congMean) * 10) / 10;

    const errorsCount = trials.filter(t => !t.isCorrect).length;
    const meanRT = this.calculateMean(allValidRTs);
    const medianRT = this.calculateMedian(allValidRTs);

    const bestRT = allValidRTs.length > 0 ? Math.min(...allValidRTs) : 0;
    const worstRT = allValidRTs.length > 0 ? Math.max(...allValidRTs) : 0;

    return {
      sessionId: 'STR_' + Date.now().toString(36).toUpperCase(),
      testType: 'Stroop Color-Word Interference',
      startTimeClock: sessionConfig.startTimeClock || new Date().toLocaleString(),
      startTimeISO: sessionConfig.startTimeISO || new Date().toISOString(),
      durationSeconds: null,
      participantId: sessionConfig.participantId || 'Anonymous',
      hand: sessionConfig.hand || 'Right Hand',
      finger: sessionConfig.finger || 'Index Finger',
      noiseLevel: sessionConfig.noiseLevel || 'Quiet Room',
      interruptions: sessionConfig.interruptions || 'None',
      notes: sessionConfig.notes || '',

      // General Metrics
      meanRT,
      medianRT,
      bestRT,
      worstRT,
      validTrialsCount: correctTrials.length,
      totalTrialsCount: trials.length,
      falseStartsCount: 0,
      lapsesCount: correctTrials.filter(t => t.rt > 1000).length,
      lapseRate: 0,
      accuracyRate: Math.round((correctTrials.length / trials.length) * 1000) / 10,

      // Stroop Specific Metrics
      stroopCongruentMeanRT: congMean,
      stroopIncongruentMeanRT: incongMean,
      stroopInterferenceDelta: interferenceDelta,
      stroopErrorsCount: errorsCount,
      stroopValidCount: correctTrials.length,

      trials: trials
    };
  }

  // Generate Master CSV string of all recorded sessions
  static generateSessionsCSV(sessions) {
    const headers = [
      'Session_ID',
      'Test_Type',
      'Test_Start_Time_Clock',
      'ISO_Timestamp',
      'Participant_ID',
      'Ergonomic_Hand',
      'Ergonomic_Finger',
      'Median_RT_ms',
      'Mean_RT_ms',
      'Peak_Best_RT_ms',
      'Peak_Worst_RT_ms',
      'Valid_Trials',
      'Total_Trials',
      'Lapses_gt_500ms',
      'Lapse_Rate_pct',
      'False_Starts_lt_100ms',
      'Accuracy_Rate_pct',
      'Stroop_Mean_Congruent_RT_ms',
      'Stroop_Mean_Incongruent_RT_ms',
      'Stroop_Interference_Delta_ms',
      'Stroop_Errors',
      'Ambient_Noise',
      'Interruptions',
      'Session_Notes'
    ];

    const rows = sessions.map(s => [
      s.sessionId,
      `"${s.testType}"`,
      `"${s.startTimeClock}"`,
      `"${s.startTimeISO}"`,
      `"${s.participantId || 'Anonymous'}"`,
      `"${s.hand || 'Right Hand'}"`,
      `"${s.finger || 'Index Finger'}"`,
      s.medianRT,
      s.meanRT,
      s.bestRT,
      s.worstRT,
      s.validTrialsCount,
      s.totalTrialsCount,
      s.lapsesCount,
      s.lapseRate,
      s.falseStartsCount,
      s.accuracyRate,
      s.stroopCongruentMeanRT !== null ? s.stroopCongruentMeanRT : '',
      s.stroopIncongruentMeanRT !== null ? s.stroopIncongruentMeanRT : '',
      s.stroopInterferenceDelta !== null ? s.stroopInterferenceDelta : '',
      s.stroopErrorsCount !== null ? s.stroopErrorsCount : '',
      `"${s.noiseLevel || ''}"`,
      `"${s.interruptions || ''}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  }

  // Generate detailed trial-by-trial CSV for scientific verification
  static generateDetailedTrialsCSV(session) {
    if (session.testType.includes('Stroop')) {
      const headers = [
        'Session_ID',
        'Trial_Index',
        'Word',
        'Ink_Color',
        'Congruency',
        'Participant_Response',
        'Result',
        'Reaction_Time_ms'
      ];
      const rows = (session.trials || []).map((t, idx) => [
        session.sessionId,
        idx + 1,
        `"${t.word}"`,
        `"${t.inkColor}"`,
        t.isCongruent ? 'Congruent' : 'Incongruent',
        `"${t.selectedColor}"`,
        t.isCorrect ? 'Correct' : 'Error',
        t.rt
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    } else {
      const headers = [
        'Session_ID',
        'Trial_Index',
        'Stimulus_Digit',
        'Random_Interval_Delay_ms',
        'Reaction_Time_ms',
        'Classification'
      ];
      const rows = (session.trials || []).map((t, idx) => {
        let classification = 'Valid';
        if (t.isFalseStart || t.rt < 100) classification = 'False Start (<100ms)';
        else if (t.rt > 500) classification = 'Lapse (>500ms)';

        return [
          session.sessionId,
          idx + 1,
          t.stimulusDigit !== undefined ? t.stimulusDigit : 'N/A',
          t.delayMs || 0,
          t.rt,
          `"${classification}"`
        ];
      });
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    }
  }
}

if (typeof window !== 'undefined') {
  window.AnalyticsEngine = AnalyticsEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsEngine;
}

