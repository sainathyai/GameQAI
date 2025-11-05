# Create AWS Secret Command

## Quick Command

### Option 1: Single Key (One-liner - Works in any shell)

Replace `YOUR_OPENAI_API_KEY` with your actual OpenAI API key:

**PowerShell:**
```powershell
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key1":"YOUR_OPENAI_API_KEY"}' --region us-east-1 --description "OpenAI API key"
```

**Bash/Git Bash:**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key1":"YOUR_OPENAI_API_KEY"}' --region us-east-1 --description "OpenAI API key"
```

**Windows CMD:**
```cmd
aws secretsmanager create-secret --name openai/api-key --secret-string "{\"api_key1\":\"YOUR_OPENAI_API_KEY\"}" --region us-east-1 --description "OpenAI API key"
```

### Option 2: Multiple Keys (Recommended for Production)

Supports key rotation and automatic fallback:

**PowerShell (One-liner):**
```powershell
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key1":"YOUR_KEY1","api_key2":"YOUR_KEY2","api_key3":"YOUR_KEY3"}' --region us-east-1 --description "OpenAI API keys (key1, key2, key3)"
```

**Bash/Git Bash (One-liner):**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key1":"YOUR_KEY1","api_key2":"YOUR_KEY2","api_key3":"YOUR_KEY3"}' --region us-east-1 --description "OpenAI API keys (key1, key2, key3)"
```

**Windows CMD:**
```cmd
aws secretsmanager create-secret --name openai/api-key --secret-string "{\"api_key1\":\"YOUR_KEY1\",\"api_key2\":\"YOUR_KEY2\",\"api_key3\":\"YOUR_KEY3\"}" --region us-east-1 --description "OpenAI API keys (key1, key2, key3)"
```

**Note:** The application will automatically try keys in order (key1 → key2 → key3) if one fails.

### Multi-line Commands (For readability)

**PowerShell (using backticks):**
```powershell
aws secretsmanager create-secret `
    --name openai/api-key `
    --secret-string '{"api_key":"YOUR_OPENAI_API_KEY"}' `
    --region us-east-1 `
    --description "OpenAI API key"
```

**Bash/Git Bash (using backslashes):**
```bash
aws secretsmanager create-secret \
    --name openai/api-key \
    --secret-string '{"api_key1":"YOUR_OPENAI_API_KEY"}' \
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

