#!/bin/bash

# Setup AWS Secret for OpenAI API Key
# This script creates an AWS Secrets Manager secret for the OpenAI API key

set -e

echo "=========================================="
echo "AWS Secrets Manager Setup for OpenAI API Key"
echo "=========================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "✅ AWS CLI found"
echo ""

# Get secret name
SECRET_NAME="${AWS_SECRET_OPENAI_KEY:-YOUR_SECRET_NAME}"
echo "Secret name: $SECRET_NAME"
echo ""

# Get AWS region
AWS_REGION="${AWS_REGION:-YOUR_AWS_REGION}"
echo "AWS Region: $AWS_REGION"
echo ""

# Check if secret already exists
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo "⚠️  Secret '$SECRET_NAME' already exists!"
    echo ""
    read -p "Do you want to update it? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    
    # Update existing secret
    echo ""
    echo "Please enter your OpenAI API key:"
    read -s OPENAI_API_KEY
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ API key cannot be empty!"
        exit 1
    fi
    
    # Create JSON format
    SECRET_JSON="{\"api_key\":\"$OPENAI_API_KEY\"}"
    
    echo ""
    echo "Updating secret..."
    aws secretsmanager update-secret \
        --secret-id "$SECRET_NAME" \
        --secret-string "$SECRET_JSON" \
        --region "$AWS_REGION" \
        --description "OpenAI API key for GameQAI application"
    
    echo ""
    echo "✅ Secret updated successfully!"
else
    # Create new secret
    echo "Please enter your OpenAI API key:"
    read -s OPENAI_API_KEY
    
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "❌ API key cannot be empty!"
        exit 1
    fi
    
    # Create JSON format
    SECRET_JSON="{\"api_key\":\"$OPENAI_API_KEY\"}"
    
    echo ""
    echo "Creating secret..."
    aws secretsmanager create-secret \
        --name "$SECRET_NAME" \
        --secret-string "$SECRET_JSON" \
        --region "$AWS_REGION" \
        --description "OpenAI API key for GameQAI application"
    
    echo ""
    echo "✅ Secret created successfully!"
fi

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Set environment variables in your .env file:"
echo "   USE_AWS_SECRETS=true"
echo "   AWS_SECRET_OPENAI_KEY=$SECRET_NAME"
echo "   AWS_REGION=$AWS_REGION"
echo ""
echo "2. Or export them in your shell:"
echo "   export USE_AWS_SECRETS=true"
echo "   export AWS_SECRET_OPENAI_KEY=$SECRET_NAME"
echo "   export AWS_REGION=$AWS_REGION"
echo ""
echo "3. Test the setup:"
echo "   npm run dev <game-url>"
echo ""
echo "=========================================="

