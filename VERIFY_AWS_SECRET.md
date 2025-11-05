# Verify AWS Secret Setup

## ✅ Secret Created Successfully

Your AWS secret has been created:
- **Name:** `openai/api-key`
- **ARN:** `arn:aws:secretsmanager:us-east-1:971422717446:secret:openai/api-key-Fg1UTB`
- **Region:** `us-east-1`

## Code Status

✅ **No code changes needed!** The code is already configured to use:
- Secret name: `openai/api-key` (matches your secret)
- Region: `us-east-1` (default, matches your secret)
- Supports both JSON and plain text formats
- Supports multiple keys (key1, key2, key3)

## Next Steps

### 1. Verify Secret Format

Check what format your secret is in:

```bash
aws secretsmanager get-secret-value --secret-id openai/api-key --region us-east-1 --query SecretString --output text
```

**Expected formats:**
- **JSON (single key):** `{"api_key":"sk-..."}`
- **JSON (multiple keys):** `{"api_key":"sk-...","api_key2":"sk-...","api_key3":"sk-..."}`
- **Plain text:** `sk-...`

### 2. Configure Environment Variables

Set these environment variables:

**PowerShell:**
```powershell
$env:USE_AWS_SECRETS='true'
$env:AWS_SECRET_OPENAI_KEY='openai/api-key'
$env:AWS_REGION='us-east-1'
```

**Bash:**
```bash
export USE_AWS_SECRETS=true
export AWS_SECRET_OPENAI_KEY=openai/api-key
export AWS_REGION=us-east-1
```

**Or add to `.env` file:**
```env
USE_AWS_SECRETS=true
AWS_SECRET_OPENAI_KEY=openai/api-key
AWS_REGION=us-east-1
```

### 3. Test the Setup

Test that the secret is being fetched correctly:

```bash
npm run dev <game-url>
```

The application should:
1. Fetch the OpenAI API key from AWS Secrets Manager
2. Log: `[INFO] Fetching OpenAI API key from AWS Secrets Manager: openai/api-key`
3. Log: `[INFO] OpenAI API key retrieved from AWS Secrets Manager`

## Troubleshooting

### If secret is not found:
- Verify secret name matches exactly: `openai/api-key`
- Check AWS region matches: `us-east-1`
- Verify AWS credentials have Secrets Manager permissions

### If key format is wrong:
- JSON format: `{"api_key":"sk-..."}`
- Plain text: `sk-...`
- Update secret if needed: `aws secretsmanager update-secret --secret-id openai/api-key --secret-string '{"api_key":"NEW_KEY"}' --region us-east-1`

## Code Configuration

The code automatically:
- ✅ Uses secret name: `openai/api-key` (default)
- ✅ Uses region: `us-east-1` (default)
- ✅ Tries key1, then key2, then key3 (if multiple keys)
- ✅ Falls back to environment variable if AWS fetch fails
- ✅ Caches secrets for 5 minutes

**Everything is configured correctly!** 🎉

