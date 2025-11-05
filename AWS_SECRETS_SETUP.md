# AWS Secrets Manager Setup Guide

**Date:** November 3, 2025

## Overview

This guide explains how to set up AWS Secrets Manager for storing and rotating the OpenAI API key securely.

## Architecture

- **Secrets Manager:** Stores OpenAI API key in AWS
- **Caching:** 5-minute cache to reduce API calls
- **Rotation Support:** Invalidate cache and refresh keys on demand
- **Fallback:** Falls back to environment variable if AWS fetch fails

## Setup Steps

### 1. Create AWS Secret

#### Option A: Plain Text Secret

```bash
aws secretsmanager create-secret \
  --name gameqai/openai-api-key \
  --secret-string "sk-your-openai-api-key-here" \
  --region us-east-1
```

#### Option B: JSON Secret (Recommended)

```bash
aws secretsmanager create-secret \
  --name gameqai/openai-api-key \
  --secret-string '{"api_key":"sk-your-openai-api-key-here"}' \
  --region us-east-1
```

### 2. Configure IAM Permissions

The Lambda function or application needs permission to read the secret:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:gameqai/openai-api-key-*"
    }
  ]
}
```

### 3. Configure Environment Variables

Set these environment variables:

```env
# Enable AWS Secrets Manager
USE_AWS_SECRETS=true

# Secret name (optional, defaults to 'gameqai/openai-api-key')
AWS_SECRET_OPENAI_KEY=gameqai/openai-api-key

# AWS Region (optional, defaults to 'us-east-1')
AWS_REGION=us-east-1
```

### 4. AWS Credentials

For Lambda:
- Use IAM role with Secrets Manager permissions
- No additional configuration needed

For Local Development:
- Use AWS CLI credentials: `aws configure`
- Or set environment variables:
  ```env
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret-key
  AWS_REGION=us-east-1
  ```

## Usage

### Automatic Key Fetching

The application will automatically fetch the API key from AWS Secrets Manager when:
- `USE_AWS_SECRETS=true` is set, OR
- `AWS_SECRET_OPENAI_KEY` environment variable is set

### Manual Key Rotation

To refresh the API key manually (after updating in AWS):

```typescript
import { AIEvaluator } from './src/evaluation/AIEvaluator.js';

const evaluator = new AIEvaluator();

// Refresh API key from AWS
await evaluator.refreshApiKey();
```

### Cache Invalidation

```typescript
import { getSecretsManager } from './src/utils/SecretsManager.js';

const secretsManager = getSecretsManager();

// Invalidate cache for a specific secret
secretsManager.invalidateCache('gameqai/openai-api-key', 'api_key');

// Or clear all cache
secretsManager.clearAllCache();
```

## Secret Formats

### Plain Text Secret
```
Secret Value: "sk-your-openai-api-key-here"
```

### JSON Secret (Recommended)
```
Secret Value: {"api_key":"sk-your-openai-api-key-here"}
```

The application supports both formats:
- JSON secrets: Extract `api_key` field
- Plain text: Use secret value directly

## Rotation Strategy

### Automatic Rotation (AWS)
1. Set up AWS Secrets Manager automatic rotation
2. Application automatically fetches new key after cache expires (5 minutes)
3. No code changes needed

### Manual Rotation
1. Update secret in AWS Secrets Manager
2. Call `refreshApiKey()` or invalidate cache
3. Application fetches new key on next use

## Security Best Practices

1. **Use IAM Roles** (Lambda)
   - Assign IAM role with minimal permissions
   - No credentials in code

2. **Use JSON Secrets** (Recommended)
   - Allows storing multiple keys
   - Better for key rotation

3. **Enable Encryption**
   - Use AWS KMS to encrypt secrets
   - Default encryption is enabled

4. **Monitor Access**
   - Enable CloudTrail for audit logging
   - Monitor secret access patterns

5. **Rotate Regularly**
   - Set up automatic rotation
   - Rotate keys every 90 days (recommended)

## Cost Considerations

- **Secrets Manager:** ~$0.40 per secret per month
- **API Calls:** $0.05 per 10,000 API calls
- **Caching:** Reduces API calls significantly

## Troubleshooting

### "Access Denied" Error
- Check IAM permissions
- Verify secret ARN in IAM policy
- Check AWS credentials

### "Secret Not Found" Error
- Verify secret name matches `AWS_SECRET_OPENAI_KEY`
- Check AWS region
- Verify secret exists in AWS Console

### Cache Issues
- Clear cache: `secretsManager.clearAllCache()`
- Reduce cache TTL if needed
- Check cache expiration logic

## Testing

### Test Secret Retrieval

```typescript
import { getSecretsManager } from './src/utils/SecretsManager.js';

const secretsManager = getSecretsManager();
const apiKey = await secretsManager.getOpenAIKey('gameqai/openai-api-key', false);
console.log('API Key retrieved:', apiKey ? 'Success' : 'Failed');
```

### Test with Environment Variable

```bash
# Set environment variables
export USE_AWS_SECRETS=true
export AWS_SECRET_OPENAI_KEY=gameqai/openai-api-key
export AWS_REGION=us-east-1

# Run application
npm run dev <game-url>
```

---

**Status:** ✅ Ready for AWS Secrets Manager integration

