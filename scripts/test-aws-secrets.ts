/**
 * Test AWS Secrets Manager Integration
 * 
 * Tests fetching OpenAI API keys from AWS Secrets Manager
 */

import { getSecretsManager } from '../src/utils/SecretsManager.js';
import { getConfig } from '../src/core/ConfigManager.js';
import { AIEvaluator } from '../src/evaluation/AIEvaluator.js';

async function testAWSSecrets() {
  console.log('==========================================');
  console.log('Testing AWS Secrets Manager Integration');
  console.log('==========================================\n');

  try {
    // Test 1: Check if AWS Secrets Manager is enabled
    const useAWSSecrets = process.env.USE_AWS_SECRETS === 'true' || !!process.env.AWS_SECRET_OPENAI_KEY;
    console.log('1. AWS Secrets Manager Status:');
    console.log(`   Enabled: ${useAWSSecrets ? '✅ Yes' : '❌ No'}`);
    const secretName = process.env.AWS_SECRET_OPENAI_KEY || 'openai/api-key (default)';
    const region = process.env.AWS_REGION || 'us-east-1 (default)';
    console.log(`   Secret Name: ${secretName}`);
    console.log(`   Region: ${region}`);
    console.log('');

    if (!useAWSSecrets) {
      console.log('⚠️  AWS Secrets Manager is not enabled.');
      console.log('   Set environment variables:');
      console.log('   USE_AWS_SECRETS=true');
      console.log('   AWS_SECRET_OPENAI_KEY=openai/api-key');
      console.log('   AWS_REGION=us-east-1');
      return;
    }

    // Test 2: Fetch individual keys
    console.log('2. Testing Individual Key Fetch:');
    const secretsManager = getSecretsManager();
    const testSecretName = process.env.AWS_SECRET_OPENAI_KEY || 'openai/api-key';

    try {
      const key1 = await secretsManager.getOpenAIKey(testSecretName, 1, false);
      console.log(`   ✅ Key1 (api_key1): ${key1 ? key1.substring(0, 20) + '...' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Key1 (api_key1): Failed - ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const key2 = await secretsManager.getOpenAIKey(testSecretName, 2, false);
      console.log(`   ✅ Key2 (api_key2): ${key2 ? key2.substring(0, 20) + '...' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Key2 (api_key2): Failed - ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      const key3 = await secretsManager.getOpenAIKey(testSecretName, 3, false);
      console.log(`   ✅ Key3 (api_key3): ${key3 ? key3.substring(0, 20) + '...' : 'Not found'}`);
    } catch (error) {
      console.log(`   ⚠️  Key3 (api_key3): Not found (optional)`);
    }

    console.log('');

    // Test 3: Fetch all keys
    console.log('3. Testing GetAllKeys:');
    try {
      const allKeys = await secretsManager.getAllOpenAIKeys(testSecretName, false);
      console.log(`   ✅ Found ${allKeys.length} key(s)`);
      allKeys.forEach((key, index) => {
        console.log(`      Key${index + 1}: ${key.substring(0, 20)}...`);
      });
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');

    // Test 4: Automatic fallback (tries all keys in order)
    console.log('4. Testing Automatic Fallback:');
    try {
      const autoKey = await secretsManager.getOpenAIKey(testSecretName, undefined, false);
      console.log(`   ✅ Auto-selected key: ${autoKey ? autoKey.substring(0, 20) + '...' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');

    // Test 5: Config Manager integration
    console.log('5. Testing ConfigManager Integration:');
    try {
      const config = await getConfig();
      console.log(`   ✅ Config loaded`);
      console.log(`   OpenAI API Key: ${config.openai.api_key ? config.openai.api_key.substring(0, 20) + '...' : 'Not set'}`);
      console.log(`   Model: ${config.openai.model}`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');

    // Test 6: AIEvaluator integration
    console.log('6. Testing AIEvaluator Integration:');
    try {
      const evaluator = new AIEvaluator();
      const evaluatorKeys = await evaluator.getAllApiKeys();
      console.log(`   ✅ AIEvaluator initialized`);
      console.log(`   Available keys: ${evaluatorKeys.length}`);
      console.log(`   Keys will be used in order: api_key1 → api_key2 → api_key3`);
    } catch (error) {
      console.log(`   ❌ Failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    console.log('');
    console.log('==========================================');
    console.log('✅ All tests completed!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAWSSecrets().catch(console.error);

