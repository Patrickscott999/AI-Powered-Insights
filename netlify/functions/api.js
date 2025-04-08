const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const serverless = require('serverless-http');

const app = express();

// Set up proxy for local development
const API_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'
  : process.env.API_URL || 'https://your-production-api-url.com';

app.use('/api', createProxyMiddleware({
  target: API_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/'
  }
}));

// Default handler for other routes
app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports.handler = serverless(app); 