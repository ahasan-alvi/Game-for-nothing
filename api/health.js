/**
 * VERCEL SERVERLESS BACKEND API — HEALTH STATUS
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    service: 'NeuroPulse Reaction Time Backend',
    platform: 'Vercel Serverless Functions',
    timestamp: new Date().toISOString()
  });
};
