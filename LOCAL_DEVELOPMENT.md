# Local Development Guide

## OpenAI API Key Configuration

### Default Behavior (Local Development)

When running locally, the application **automatically uses the `.env` file** instead of AWS Secrets Manager.

**Setup:**
1. Create or edit `.env` file in project root
2. Add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   BROWSERBASE_API_KEY=your-browserbase-api-key-here
   ```

That's it! The application will automatically use `.env` file when running locally.

### Force AWS Secrets Manager (Local Development)

If you want to test AWS Secrets Manager integration locally, explicitly enable it:

```env
USE_AWS_SECRETS=true
AWS_SECRET_OPENAI_KEY=YOUR_SECRET_NAME
AWS_REGION=YOUR_AWS_REGION
```

**Note:** Even with `USE_AWS_SECRETS=true`, if `OPENAI_API_KEY` is set in `.env`, it will be used first. To force AWS Secrets Manager, don't set `OPENAI_API_KEY` in `.env`.

## Environment Detection

The application automatically detects the environment:

| Environment | Detection | Behavior |
|------------|----------|----------|
| **Local** | No `AWS_LAMBDA_FUNCTION_NAME` | Uses `.env` file |
| **Lambda** | `AWS_LAMBDA_FUNCTION_NAME` is set | Uses AWS Secrets Manager |
| **Local (forced)** | `USE_AWS_SECRETS=true` | Uses AWS Secrets Manager |

## Configuration Priority

1. **Local Development:**
   - Uses `.env` file by default
   - Secret name: Configured via `AWS_SECRET_OPENAI_KEY` (when AWS Secrets Manager is enabled)

2. **Production/Lambda:**
   - Uses AWS Secrets Manager automatically
   - Secret name: Configured via `AWS_SECRET_OPENAI_KEY` or default
   - Can be overridden with `AWS_SECRET_OPENAI_KEY` environment variable

## Testing

### Test Local Development (.env file):
```bash
# Make sure .env file has OPENAI_API_KEY
npm run dev <game-url>
```

### Test AWS Secrets Manager (local):
```bash
# Set environment variables
export USE_AWS_SECRETS=true
export AWS_SECRET_OPENAI_KEY=YOUR_SECRET_NAME
export AWS_REGION=YOUR_AWS_REGION

# Don't set OPENAI_API_KEY in .env, or remove it
npm run dev <game-url>
```

### Test AWS Secrets Manager Integration:
```bash
npm run test:aws-secrets
```

## Summary

- ✅ **Local Development:** Uses `.env` file automatically
- ✅ **Production/Lambda:** Uses AWS Secrets Manager automatically
- ✅ **Secret Name:** Configured via `AWS_SECRET_OPENAI_KEY` environment variable
- ✅ **Override:** Set `USE_AWS_SECRETS=true` to force AWS Secrets Manager locally

