/**
 * Vercel Serverless Function Entry Point
 * Wraps the Express app as a serverless handler
 */
const app = require('../dist/server').default;

module.exports = app;
