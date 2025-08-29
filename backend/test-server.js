const express = require('express');
const app = express();
const PORT = 5001;

app.use(express.json());

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}/test`);
  console.log(`🏥 Health URL: http://localhost:${PORT}/api/health`);
});
