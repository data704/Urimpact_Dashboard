// AWS Secrets Manager Integration
// Fetches secrets from AWS Secrets Manager in production
// Falls back to environment variables in development

import dotenv from 'dotenv';

dotenv.config();

// Dynamically import AWS SDK (only if available)
let SecretsManagerClient, GetSecretValueCommand, secretsClient;

async function initAwsSdk() {
  try {
    const awsSdk = await import('@aws-sdk/client-secrets-manager');
    SecretsManagerClient = awsSdk.SecretsManagerClient;
    GetSecretValueCommand = awsSdk.GetSecretValueCommand;
    
    secretsClient = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'eu-central-1',
    });
    
    return true;
  } catch (error) {
    console.warn('⚠️  AWS SDK not available, secrets will use environment variables only');
    return false;
  }
}

/**
 * Fetch secret from AWS Secrets Manager
 * @param {string} secretName - Name of the secret in Secrets Manager
 * @returns {Promise<object|string>} - Secret value (parsed JSON if possible, else string)
 */
async function getSecret(secretName) {
  if (!secretsClient || !GetSecretValueCommand) {
    throw new Error('AWS Secrets Manager SDK not initialized');
  }
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsClient.send(command);
    
    // Try to parse as JSON, fall back to string
    try {
      return JSON.parse(response.SecretString);
    } catch {
      return response.SecretString;
    }
  } catch (error) {
    console.error(`❌ Failed to fetch secret ${secretName}:`, error.message);
    throw error;
  }
}

/**
 * Fetch all required secrets from AWS Secrets Manager
 * @returns {Promise<object>} - Object with all secrets
 */
async function fetchAllSecrets() {
  try {
    const [
      rdsPassword,
      jwtSecret,
      geeCredentials,
      mapboxToken,
    ] = await Promise.all([
      getSecret('ndvi/rds/password'),
      getSecret('ndvi/jwt/secret'),
      getSecret('ndvi/gee/credentials'),
      getSecret('ndvi/mapbox/token').catch(() => null), // Optional
    ]);

    // Parse GEE credentials (should be JSON)
    let geePrivateKey, geeClientEmail, geeProjectId;
    if (typeof geeCredentials === 'object' && geeCredentials.private_key) {
      geePrivateKey = geeCredentials.private_key;
      geeClientEmail = geeCredentials.client_email;
      geeProjectId = geeCredentials.project_id;
    } else if (typeof geeCredentials === 'string') {
      // If it's a string, try to parse as JSON
      try {
        const parsed = JSON.parse(geeCredentials);
        geePrivateKey = parsed.private_key;
        geeClientEmail = parsed.client_email;
        geeProjectId = parsed.project_id;
      } catch {
        // If not JSON, assume it's the private key only
        geePrivateKey = geeCredentials;
        geeClientEmail = process.env.GEE_CLIENT_EMAIL;
        geeProjectId = process.env.GEE_PROJECT_ID;
      }
    }

    return {
      DB_PASSWORD: rdsPassword,
      JWT_SECRET: jwtSecret,
      GEE_PRIVATE_KEY: geePrivateKey,
      GEE_CLIENT_EMAIL: geeClientEmail,
      GEE_PROJECT_ID: geeProjectId,
      MAPBOX_ACCESS_TOKEN: mapboxToken,
    };
  } catch (error) {
    console.error('❌ Failed to fetch secrets:', error);
    throw new Error('Failed to fetch required secrets from AWS Secrets Manager');
  }
}

/**
 * Initialize secrets - fetch from AWS if in production, else use env vars
 * @returns {Promise<void>}
 */
export async function initializeSecrets() {
  const useAwsSecrets = process.env.USE_AWS_SECRETS === 'true';
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Only fetch from AWS in production
  if (useAwsSecrets || nodeEnv === 'production') {
    try {
      // Initialize AWS SDK
      const sdkAvailable = await initAwsSdk();
      
      if (!sdkAvailable) {
        console.warn('⚠️  AWS SDK not available, using environment variables');
        return;
      }
      
      const secrets = await fetchAllSecrets();
      
      // Override environment variables with secrets
      if (secrets.DB_PASSWORD) {
        process.env.DB_PASSWORD = secrets.DB_PASSWORD;
      }
      if (secrets.JWT_SECRET) {
        process.env.JWT_SECRET = secrets.JWT_SECRET;
      }
      if (secrets.GEE_PRIVATE_KEY) {
        process.env.GEE_PRIVATE_KEY = secrets.GEE_PRIVATE_KEY;
      }
      if (secrets.GEE_CLIENT_EMAIL) {
        process.env.GEE_CLIENT_EMAIL = secrets.GEE_CLIENT_EMAIL;
      }
      if (secrets.GEE_PROJECT_ID) {
        process.env.GEE_PROJECT_ID = secrets.GEE_PROJECT_ID;
      }
      if (secrets.MAPBOX_ACCESS_TOKEN) {
        process.env.MAPBOX_ACCESS_TOKEN = secrets.MAPBOX_ACCESS_TOKEN;
      }

      console.log('✅ Secrets initialized from AWS Secrets Manager');
    } catch (error) {
      console.warn('⚠️  Failed to fetch secrets from AWS, falling back to environment variables');
      console.warn('   Make sure AWS credentials are configured (IAM role or credentials file)');
      console.warn('   Error:', error.message);
    }
  } else {
    console.log('📝 Using environment variables for configuration (development mode)');
  }
}

/**
 * Get a specific secret value (for runtime access)
 * @param {string} secretName - Name of the secret
 * @returns {Promise<string|object>} - Secret value
 */
export async function getSecretValue(secretName) {
  if (!secretsClient) {
    await initAwsSdk();
  }
  return getSecret(secretName);
}

export default {
  initializeSecrets,
  getSecretValue,
  fetchAllSecrets,
};
