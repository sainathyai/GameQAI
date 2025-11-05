# Quick Create AWS Secret - All Shells

## One-Liner Commands (Easiest)

### Single Key

**PowerShell:**
```powershell
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"YOUR_OPENAI_API_KEY"}' --region us-east-1 --description "OpenAI API key"
```

**Bash/Git Bash:**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"YOUR_OPENAI_API_KEY"}' --region us-east-1 --description "OpenAI API key"
```

**Windows CMD:**
```cmd
aws secretsmanager create-secret --name openai/api-key --secret-string "{\"api_key\":\"YOUR_OPENAI_API_KEY\"}" --region us-east-1 --description "OpenAI API key"
```

### Multiple Keys (key1, key2, key3)

**PowerShell:**
```powershell
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"KEY1","api_key2":"KEY2","api_key3":"KEY3"}' --region us-east-1 --description "OpenAI API keys"
```

**Bash/Git Bash:**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"KEY1","api_key2":"KEY2","api_key3":"KEY3"}' --region us-east-1 --description "OpenAI API keys"
```

**Windows CMD:**
```cmd
aws secretsmanager create-secret --name openai/api-key --secret-string "{\"api_key\":\"KEY1\",\"api_key2\":\"KEY2\",\"api_key3\":\"KEY3\"}" --region us-east-1 --description "OpenAI API keys"
```

## Replace Placeholders

Replace these with your actual values:
- `YOUR_OPENAI_API_KEY` - Your OpenAI API key
- `KEY1`, `KEY2`, `KEY3` - Your OpenAI API keys (for multiple keys)

## Example (Single Key)

**Bash/Git Bash:**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"sk-proj-abc123xyz"}' --region us-east-1 --description "OpenAI API key"
```

## Example (Multiple Keys)

**Bash/Git Bash:**
```bash
aws secretsmanager create-secret --name openai/api-key --secret-string '{"api_key":"sk-proj-key1","api_key2":"sk-proj-key2","api_key3":"sk-proj-key3"}' --region us-east-1 --description "OpenAI API keys"
```

## Verify Secret Created

After creating, verify it:

```bash
aws secretsmanager get-secret-value --secret-id openai/api-key --region us-east-1 --query SecretString --output text
```

## Troubleshooting

### "command not found" errors
- Make sure you're using the **one-liner** format (no line breaks)
- Or use the correct line continuation for your shell:
  - **Bash/Git Bash**: Use `\` (backslash)
  - **PowerShell**: Use `` ` `` (backtick)

### "Invalid JSON" errors
- Make sure JSON is properly formatted
- Use single quotes in Bash: `'{"key":"value"}'`
- Use escaped double quotes in CMD: `"{\"key\":\"value\"}"`

