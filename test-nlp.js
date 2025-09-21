#!/usr/bin/env node

/**
 * Simple test script for NLP functionality
 * This script tests the NLP API endpoints with sample inputs
 */

const API_BASE_URL = 'http://localhost:3000/api/nlp';

// Test samples
const testSamples = [
  {
    name: 'Simple Fitness App',
    text: 'I want to create a fitness tracking app that allows users to log workouts, track progress, and share achievements on social media.',
    expectedIntent: 'create_app'
  },
  {
    name: 'E-commerce App',
    text: 'Build a mobile shopping app with product catalog, shopping cart, payment integration, and user reviews.',
    expectedIntent: 'create_app'
  },
  {
    name: 'Feature Addition',
    text: 'Add push notifications and offline mode to my existing weather application.',
    expectedIntent: 'add_feature'
  }
];

// Test functions
async function testEndpoint(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting NLP API Tests...\n');

  for (const sample of testSamples) {
    console.log(`📝 Testing: ${sample.name}`);
    console.log(`📄 Input: "${sample.text}"`);

    // Test complete pipeline
    console.log('🔄 Testing complete pipeline...');
    const pipelineResult = await testEndpoint('complete-pipeline', {
      input: sample.text,
      type: 'text',
      options: { format: 'json' }
    });

    if (pipelineResult && pipelineResult.success) {
      console.log('✅ Complete pipeline test passed');
      
      // Check intent
      if (pipelineResult.data?.intent?.intent) {
        const detectedIntent = pipelineResult.data.intent.intent;
        console.log(`🎯 Detected intent: ${detectedIntent}`);
        
        if (detectedIntent === sample.expectedIntent) {
          console.log('✅ Intent recognition correct');
        } else {
          console.log(`⚠️  Expected ${sample.expectedIntent}, got ${detectedIntent}`);
        }
      }

      // Check entities
      if (pipelineResult.data?.entities?.entities) {
        console.log(`🏷️  Found ${pipelineResult.data.entities.entities.length} entities`);
      }

      // Check requirements
      if (pipelineResult.data?.requirements?.requirements) {
        console.log(`📋 Found ${pipelineResult.data.requirements.requirements.length} requirements`);
      }

      // Check specs
      if (pipelineResult.data?.specifications?.specifications) {
        console.log('📄 Generated specifications available');
      }
    } else {
      console.log('❌ Complete pipeline test failed');
    }

    console.log('---\n');
  }

  // Test individual endpoints
  console.log('🔧 Testing individual endpoints...\n');

  const testText = testSamples[0].text;

  // Test text processing
  console.log('📝 Testing text processing...');
  const processingResult = await testEndpoint('process-text', {
    text: testText,
    options: { includeSentiment: true, includeKeywords: true }
  });
  
  if (processingResult && processingResult.success) {
    console.log('✅ Text processing test passed');
  } else {
    console.log('❌ Text processing test failed');
  }

  // Test intent recognition
  console.log('🎯 Testing intent recognition...');
  const intentResult = await testEndpoint('recognize-intent', {
    text: testText,
    context: {}
  });
  
  if (intentResult && intentResult.success) {
    console.log('✅ Intent recognition test passed');
  } else {
    console.log('❌ Intent recognition test failed');
  }

  // Test entity extraction
  console.log('🏷️  Testing entity extraction...');
  const entityResult = await testEndpoint('extract-entities', {
    text: testText,
    domain: 'mobile-app'
  });
  
  if (entityResult && entityResult.success) {
    console.log('✅ Entity extraction test passed');
  } else {
    console.log('❌ Entity extraction test failed');
  }

  // Test requirement analysis
  console.log('📋 Testing requirement analysis...');
  const requirementResult = await testEndpoint('analyze-requirements', {
    description: testText,
    projectType: 'mobile-app'
  });
  
  if (requirementResult && requirementResult.success) {
    console.log('✅ Requirement analysis test passed');
  } else {
    console.log('❌ Requirement analysis test failed');
  }

  // Test spec generation
  console.log('📄 Testing specification generation...');
  if (requirementResult && requirementResult.success) {
    const specResult = await testEndpoint('generate-specs', {
      requirements: requirementResult.data,
      format: 'json'
    });
    
    if (specResult && specResult.success) {
      console.log('✅ Specification generation test passed');
    } else {
      console.log('❌ Specification generation test failed');
    }
  } else {
    console.log('⚠️  Skipping spec generation test (requirement analysis failed)');
  }

  console.log('\n🎉 NLP API Tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testEndpoint };