# Quick AWS Secret Setup Guide

## Current Status

✅ AWS CLI is installed and configured
✅ Secret `openai/api-key` (or custom name) can be created in AWS Secrets Manager

## Option 1: Update Existing Secret

To update the existing secret with your OpenAI API key:

### PowerShell (Windows):
```powershell
# Get your API key securely
$apiKey = Read-Host -AsSecureString -Prompt "Enter your OpenAI API key"
$apiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
)

# Create JSON format
$secretJson = @{ api_key = $apiKeyPlain } | ConvertTo-Json -Compress

# Update the secret
aws secretsmanager update-secret `
    --secret-id openai/api-key `
    --secret-string $secretJson `
    --region us-east-1
```

### Bash/Command Line:
```bash
# Replace YOUR_API_KEY with your actual OpenAI API key
aws secretsmanager update-secret \
    --secret-id openai/api-key \
    --secret-string '{"api_key":"sk-your-openai-api-key-here"}' \
    --region us-east-1
```

## Option 2: Create New Secret (if you want a different name)

```powershell
aws secretsmanager create-secret `
    --name openai/api-key-v2 `
    --secret-string '{"api_key":"sk-your-openai-api-key-here"}' `
    --region us-east-1 `
    --description "OpenAI API key"
```

## Option 3: Use Interactive Script

Run the setup script and choose to update when prompted:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-aws-secret.ps1
```

When prompted "Do you want to update it? (y/n):", type `y` and enter your API key.

## Verify Secret

After creating/updating, verify the secret:

```powershell
aws secretsmanager get-secret-value `
    --secret-id openai/api-key `
    --region us-east-1 `
    --query SecretString `
    --output text
```

## Configure Application

After the secret is set up, configure your application:

### Option A: Environment Variables (Local Development)

Create or update `.env` file:
```env
USE_AWS_SECRETS=true
AWS_SECRET_OPENAI_KEY=openai/api-key
AWS_REGION=us-east-1
```

### Option B: Export in PowerShell

```powershell
$env:USE_AWS_SECRETS='true'
$env:AWS_SECRET_OPENAI_KEY='openai/api-key'
$env:AWS_REGION='us-east-1'
```

### Option C: Lambda Environment Variables

If deploying to Lambda, set these environment variables in the Lambda configuration:
- `USE_AWS_SECRETS=true`
- `AWS_SECRET_OPENAI_KEY=gameqai/openai-api-key`
- `AWS_REGION=us-east-1`

## Test the Setup

After configuration, test it:

```powershell
npm run dev <game-url>
```

The application should automatically fetch the OpenAI API key from AWS Secrets Manager.

## Troubleshooting

### "Access Denied" Error
- Check IAM permissions for Secrets Manager
- Verify your AWS credentials have `secretsmanager:GetSecretValue` permission

### "Secret Not Found" Error
- Verify the secret name matches exactly
- Check the AWS region

### Test Secret Retrieval

```powershell
# Test fetching the secret
aws secretsmanager get-secret-value `
    --secret-id openai/api-key `
    --region us-east-1
```

