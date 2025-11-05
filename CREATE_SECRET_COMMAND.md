# Create AWS Secret Command

## Quick Command

Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key and run:

### PowerShell:
```powershell
aws secretsmanager create-secret `
    --name openai/api-key `
    --secret-string '{"api_key":"YOUR_OPENAI_API_KEY"}' `
    --region us-east-1 `
    --description "OpenAI API key"
```

### Bash/Command Line:
```bash
aws secretsmanager create-secret \
    --name openai/api-key \
    --secret-string '{"api_key":"YOUR_OPENAI_API_KEY"}' \
    --region us-east-1 \
    --description "OpenAI API key"
```

## Example (with placeholder key):
```powershell
aws secretsmanager create-secret `
    --name openai/api-key `
    --secret-string '{"api_key":"sk-proj-xxxxxxxxxxxxxxxxxxxxx"}' `
    --region us-east-1 `
    --description "OpenAI API key"
```

## After Creating

1. **Set environment variables:**
   ```powershell
   $env:USE_AWS_SECRETS='true'
   $env:AWS_SECRET_OPENAI_KEY='openai/api-key'
   $env:AWS_REGION='us-east-1'
   ```

2. **Or add to .env file:**
   ```env
USE_AWS_SECRETS=true
AWS_SECRET_OPENAI_KEY=openai/api-key
AWS_REGION=us-east-1
   ```

3. **Test:**
   ```powershell
   npm run dev <game-url>
   ```

