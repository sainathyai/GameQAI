# Setup AWS Secret for OpenAI API Key (PowerShell)
# This script creates an AWS Secrets Manager secret for the OpenAI API key

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "AWS Secrets Manager Setup for OpenAI API Key" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get secret name
$secretName = if ($env:AWS_SECRET_OPENAI_KEY) { $env:AWS_SECRET_OPENAI_KEY } else { "YOUR_SECRET_NAME" }
Write-Host "Secret name: $secretName" -ForegroundColor Yellow
Write-Host ""

# Get AWS region
$awsRegion = if ($env:AWS_REGION) { $env:AWS_REGION } else { "YOUR_AWS_REGION" }
Write-Host "AWS Region: $awsRegion" -ForegroundColor Yellow
Write-Host ""

# Check if secret already exists
try {
    aws secretsmanager describe-secret --secret-id $secretName --region $awsRegion 2>&1 | Out-Null
    $secretExists = $true
} catch {
    $secretExists = $false
}

if ($secretExists) {
    Write-Host "⚠️  Secret '$secretName' already exists!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to update it? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Please enter your OpenAI API key:" -ForegroundColor Cyan
    $secureKey = Read-Host -AsSecureString
    $openaiApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    )
    
    if ([string]::IsNullOrEmpty($openaiApiKey)) {
        Write-Host "❌ API key cannot be empty!" -ForegroundColor Red
        exit 1
    }
    
    # Create JSON format
    $secretJson = @{
        api_key = $openaiApiKey
    } | ConvertTo-Json -Compress
    
    Write-Host ""
    Write-Host "Updating secret..." -ForegroundColor Cyan
    aws secretsmanager update-secret `
        --secret-id $secretName `
        --secret-string $secretJson `
        --region $awsRegion `
        --description "OpenAI API key for GameQAI application"
    
    Write-Host ""
    Write-Host "✅ Secret updated successfully!" -ForegroundColor Green
} else {
    # Create new secret
    Write-Host "Please enter your OpenAI API key:" -ForegroundColor Cyan
    $secureKey = Read-Host -AsSecureString
    $openaiApiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    )
    
    if ([string]::IsNullOrEmpty($openaiApiKey)) {
        Write-Host "❌ API key cannot be empty!" -ForegroundColor Red
        exit 1
    }
    
    # Create JSON format
    $secretJson = @{
        api_key = $openaiApiKey
    } | ConvertTo-Json -Compress
    
    Write-Host ""
    Write-Host "Creating secret..." -ForegroundColor Cyan
    aws secretsmanager create-secret `
        --name $secretName `
        --secret-string $secretJson `
        --region $awsRegion `
        --description "OpenAI API key for GameQAI application"
    
    Write-Host ""
    Write-Host "✅ Secret created successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Set environment variables in your .env file:" -ForegroundColor Yellow
Write-Host "   USE_AWS_SECRETS=true"
Write-Host "   AWS_SECRET_OPENAI_KEY=$secretName"
Write-Host "   AWS_REGION=$awsRegion"
Write-Host ""
Write-Host "2. Or set them in PowerShell:" -ForegroundColor Yellow
Write-Host "   `$env:USE_AWS_SECRETS='true'"
Write-Host "   `$env:AWS_SECRET_OPENAI_KEY='$secretName'"
Write-Host "   `$env:AWS_REGION='$awsRegion'"
Write-Host ""
Write-Host "3. Test the setup:" -ForegroundColor Yellow
Write-Host "   npm run dev <game-url>"
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan

