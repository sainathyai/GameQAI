/**
 * AWS Secrets Manager Utility
 * 
 * Fetches secrets from AWS Secrets Manager with caching and rotation support
 * Supports both plain text and JSON secret formats
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

/**
 * Secret cache entry
 */
interface SecretCache {
  secret: string;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Secrets Manager class
 * 
 * Handles fetching secrets from AWS Secrets Manager with caching
 */
export class SecretsManager {
  private client: SecretsManagerClient;
  private cache: Map<string, SecretCache> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default cache

  constructor(region?: string) {
    // Initialize AWS Secrets Manager client
    this.client = new SecretsManagerClient({
      region: region || process.env.AWS_REGION || 'us-east-1',
    });

    console.log(`[INFO] AWS Secrets Manager client initialized (region: ${region || process.env.AWS_REGION || 'us-east-1'})`);
  }

  /**
   * Get secret value from AWS Secrets Manager
   * 
   * @param secretName - Name or ARN of the secret
   * @param key - Optional key for JSON secrets (if secret is JSON object)
   * @param useCache - Whether to use cache (default: true)
   * @param ttl - Cache TTL in milliseconds (default: 5 minutes)
   * @returns Promise that resolves with secret value
   */
  async getSecret(
    secretName: string,
    key?: string,
    useCache: boolean = true,
    ttl?: number
  ): Promise<string> {
    const cacheKey = key ? `${secretName}:${key}` : secretName;

    // Check cache first
    if (useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        // Secret retrieved from cache (no logging to avoid spam)
        return cached.secret;
      }
    }

    try {
      console.log(`[INFO] Fetching secret from AWS Secrets Manager: ${secretName}${key ? ` (key: ${key})` : ''}`);

      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} has no SecretString value`);
      }

      let secretValue: string;

      // Handle JSON secrets
      if (key) {
        try {
          const secretJson = JSON.parse(response.SecretString);
          if (!(key in secretJson)) {
            throw new Error(`Key '${key}' not found in secret ${secretName}`);
          }
          secretValue = String(secretJson[key]);
        } catch (error) {
          if (error instanceof SyntaxError) {
            throw new Error(
              `Secret ${secretName} is not valid JSON, cannot extract key '${key}'`
            );
          }
          throw error;
        }
      } else {
        secretValue = response.SecretString;
      }

      // Cache the secret
      if (useCache) {
        this.cache.set(cacheKey, {
          secret: secretValue,
          timestamp: Date.now(),
          ttl: ttl || this.defaultTTL,
        });
      }

      console.log(`[INFO] Secret retrieved successfully: ${secretName}${key ? ` (key: ${key})` : ''}`);

      return secretValue;
    } catch (error) {
      console.error(`[ERROR] Failed to fetch secret from AWS Secrets Manager: ${secretName}`, error);
      throw error;
    }
  }

  /**
   * Get OpenAI API key from AWS Secrets Manager
   * 
   * @param secretName - Name of the secret (default: from env or 'gameqai/openai-api-key')
   * @param useCache - Whether to use cache
   * @returns Promise that resolves with API key
   */
  async getOpenAIKey(
    secretName?: string,
    useCache: boolean = true
  ): Promise<string> {
    const secret = secretName || process.env.AWS_SECRET_OPENAI_KEY || 'gameqai/openai-api-key';
    
    // Try to get 'api_key' key from JSON secret, or use plain text
    try {
      return await this.getSecret(secret, 'api_key', useCache);
    } catch (error) {
      // Fallback to plain text secret
      // Note: JSON secret failed, trying plain text
      return await this.getSecret(secret, undefined, useCache);
    }
  }

  /**
   * Clear cache for a specific secret
   * 
   * @param secretName - Name of the secret
   * @param key - Optional key for JSON secrets
   */
  clearCache(secretName: string, key?: string): void {
    const cacheKey = key ? `${secretName}:${key}` : secretName;
    this.cache.delete(cacheKey);
    // Secret cache cleared (no logging)
  }

  /**
   * Clear all cached secrets
   */
  clearAllCache(): void {
    this.cache.clear();
    // All secret cache cleared (no logging)
  }

  /**
   * Invalidate cache (useful for key rotation)
   * Same as clearCache, but more explicit for rotation scenarios
   * 
   * @param secretName - Name of the secret
   * @param key - Optional key for JSON secrets
   */
  invalidateCache(secretName: string, key?: string): void {
    this.clearCache(secretName, key);
  }
}

/**
 * Global secrets manager instance
 */
let secretsManagerInstance: SecretsManager | null = null;

/**
 * Get or create secrets manager instance
 * 
 * @param region - AWS region (optional)
 * @returns SecretsManager instance
 */
export function getSecretsManager(region?: string): SecretsManager {
  if (!secretsManagerInstance) {
    secretsManagerInstance = new SecretsManager(region);
  }
  return secretsManagerInstance;
}

/**
 * Reset secrets manager instance (useful for testing)
 */
export function resetSecretsManager(): void {
  secretsManagerInstance = null;
}

