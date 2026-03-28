const AWS = require('aws-sdk');

// Initialize AWS Secrets Manager client
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get secret from AWS Secrets Manager
const getSecret = async (secretName) => {
  try {
    // Check cache first
    const cached = secretsCache.get(secretName);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.value;
    }

    console.log(`Fetching secret: ${secretName}`);
    
    const result = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise();

    let secret;
    if (result.SecretString) {
      secret = JSON.parse(result.SecretString);
    } else {
      // Handle binary secrets if needed
      secret = Buffer.from(result.SecretBinary, 'base64').toString('ascii');
    }

    // Cache the secret
    secretsCache.set(secretName, {
      value: secret,
      timestamp: Date.now()
    });

    return secret;
  } catch (error) {
    console.error(`Error fetching secret ${secretName}:`, error.message);
    
    // Fallback to environment variables in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Falling back to environment variable for ${secretName}`);
      return null;
    }
    
    throw error;
  }
};

// Get database configuration from secrets
const getDatabaseConfig = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      // In development, use environment variables
      return {
        DATABASE_URL: process.env.DATABASE_URL,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD
      };
    }

    // In production, get from AWS Secrets Manager
    const dbSecrets = await getSecret('vaultsphere/database');
    return dbSecrets;
  } catch (error) {
    console.error('Error getting database config:', error);
    // Fallback to environment variables
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      DB_HOST: process.env.DB_HOST,
      DB_PORT: process.env.DB_PORT,
      DB_NAME: process.env.DB_NAME,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD
    };
  }
};

// Get JWT secret from secrets manager
const getJWTSecret = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return process.env.JWT_SECRET;
    }

    const jwtSecrets = await getSecret('vaultsphere/jwt');
    return jwtSecrets.JWT_SECRET;
  } catch (error) {
    console.error('Error getting JWT secret:', error);
    return process.env.JWT_SECRET;
  }
};

// Get all application secrets
const getAppSecrets = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      return {
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dev-encryption-key'
      };
    }

    const appSecrets = await getSecret('vaultsphere/app');
    return appSecrets;
  } catch (error) {
    console.error('Error getting app secrets:', error);
    return {
      JWT_SECRET: process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'fallback-key'
    };
  }
};

// Clear secrets cache (useful for rotation)
const clearSecretsCache = () => {
  secretsCache.clear();
  console.log('Secrets cache cleared');
};

// Initialize secrets on startup
const initializeSecrets = async () => {
  try {
    console.log('Initializing application secrets...');
    
    if (process.env.NODE_ENV === 'production') {
      // Pre-load critical secrets
      await Promise.all([
        getJWTSecret(),
        getDatabaseConfig(),
        getAppSecrets()
      ]);
      console.log('✅ Application secrets initialized successfully');
    } else {
      console.log('✅ Development mode: Using environment variables');
    }
  } catch (error) {
    console.error('❌ Failed to initialize secrets:', error);
    console.log('Falling back to environment variables...');
  }
};

module.exports = {
  getSecret,
  getDatabaseConfig,
  getJWTSecret,
  getAppSecrets,
  clearSecretsCache,
  initializeSecrets
};