const fs = require('fs');
const path = require('path');

// SSL/TLS Configuration
const getSSLConfig = () => {
  const sslConfig = {
    enabled: process.env.SSL_ENABLED === 'true',
    port: process.env.SSL_PORT || 443,
    redirectHttp: process.env.SSL_REDIRECT_HTTP === 'true'
  };

  // In production, use SSL certificates
  if (sslConfig.enabled) {
    try {
      const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs';
      const keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private';
      
      sslConfig.options = {
        key: fs.readFileSync(path.join(keyPath, 'server.key')),
        cert: fs.readFileSync(path.join(certPath, 'server.crt')),
        // Optional: Add intermediate certificates
        ca: process.env.SSL_CA_PATH ? 
          fs.readFileSync(process.env.SSL_CA_PATH) : undefined
      };

      console.log('✅ SSL certificates loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load SSL certificates:', error.message);
      console.log('Falling back to HTTP mode...');
      sslConfig.enabled = false;
    }
  }

  return sslConfig;
};

// HTTPS redirect middleware
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

// Security headers for HTTPS
const httpsSecurityHeaders = (req, res, next) => {
  // Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent mixed content
  res.setHeader('Content-Security-Policy', "upgrade-insecure-requests");
  
  next();
};

module.exports = {
  getSSLConfig,
  httpsRedirect,
  httpsSecurityHeaders
};