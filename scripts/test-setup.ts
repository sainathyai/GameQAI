/**
 * Test Setup Script
 * 
 * Verifies that all modules can be imported and initialized
 * without requiring actual API keys
 */

import { getConfig } from '../src/core/ConfigManager.js';
import { GameQATestRunner } from '../src/core/GameQATestRunner.js';
import { log } from '../src/utils/logger.js';

async function testSetup() {
  console.log('🧪 Testing GameQAI Setup...\n');

  try {
    // Test 1: Config Manager
    console.log('✅ Test 1: Config Manager');
    try {
      const config = getConfig();
      console.log('   - Config loaded successfully');
      console.log(`   - OpenAI Model: ${config.openai.model}`);
      console.log(`   - Output Dir: ${config.output.dir}`);
      console.log(`   - Log Level: ${config.logging.level}`);
    } catch (error) {
      console.error('   ❌ Config Manager failed:', error instanceof Error ? error.message : error);
      console.log('   ⚠️  This is expected if API keys are not set');
    }

    // Test 2: Logger
    console.log('\n✅ Test 2: Logger');
    log.info('Logger test - info level');
    log.warn('Logger test - warn level');
    console.log('   - Logger initialized successfully');

    // Test 3: Type Imports
    console.log('\n✅ Test 3: Type Imports');
    import('../src/core/types.js').then((types) => {
      console.log('   - Types imported successfully');
      console.log(`   - TestStatus type: ${typeof types.TestStatus}`);
    }).catch((err) => {
      console.error('   ❌ Type imports failed:', err);
    });

    // Test 4: Test Runner (without API keys)
    console.log('\n✅ Test 4: Test Runner');
    try {
      const runner = new GameQATestRunner();
      console.log('   - Test Runner instantiated successfully');
      console.log('   ⚠️  Note: Full execution requires API keys');
    } catch (error) {
      if (error instanceof Error && error.message.includes('API key')) {
        console.log('   ⚠️  API key required (expected)');
      } else {
        console.error('   ❌ Test Runner failed:', error instanceof Error ? error.message : error);
      }
    }

    console.log('\n✅ Setup test completed!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Set BROWSERBASE_API_KEY in .env file');
    console.log('   2. Set OPENAI_API_KEY in .env file');
    console.log('   3. Run: npm run dev <game-url>');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error);
    process.exit(1);
  }
}

testSetup();

