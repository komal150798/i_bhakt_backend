/**
 * Test Script for Registration API
 * Tests: POST /api/v1/auth/register
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const ENDPOINT = `${API_BASE_URL}/auth/register`;

// Sample test data
const testCases = [
  {
    name: 'Registration with Email',
    data: {
      name: 'Test User',
      email: `testuser${Date.now()}@example.com`,
      password: 'TestPassword123!',
    },
  },
  {
    name: 'Registration with Phone',
    data: {
      name: 'Test User Phone',
      phone_number: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'TestPassword123!',
    },
  },
  {
    name: 'Registration with Email and Phone',
    data: {
      name: 'Test User Full',
      email: `testuserfull${Date.now()}@example.com`,
      phone_number: `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      password: 'TestPassword123!',
    },
  },
  {
    name: 'Registration with Name Only (Optional)',
    data: {
      email: `testusermin${Date.now()}@example.com`,
      password: 'TestPassword123!',
    },
  },
];

// Test function
async function testRegistration() {
  console.log('🧪 Testing Registration API');
  console.log('='.repeat(60));
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Endpoint: ${ENDPOINT}\n`);

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Test: ${testCase.name}`);
      console.log(`Request Data:`, JSON.stringify(testCase.data, null, 2));

      const response = await axios.post(ENDPOINT, testCase.data, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status
      });

      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));

      if (response.status === 201) {
        console.log('✅ SUCCESS');
        results.push({
          test: testCase.name,
          status: 'SUCCESS',
          statusCode: response.status,
          hasToken: !!response.data?.data?.access_token,
          hasUser: !!response.data?.data?.user,
        });
      } else {
        console.log('❌ FAILED');
        results.push({
          test: testCase.name,
          status: 'FAILED',
          statusCode: response.status,
          error: response.data?.message || 'Unknown error',
        });
      }
    } catch (error) {
      console.log('❌ ERROR:', error.message);
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Response:`, JSON.stringify(error.response.data, null, 2));
      }
      results.push({
        test: testCase.name,
        status: 'ERROR',
        error: error.message,
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  results.forEach((result) => {
    const icon = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} ${result.test}: ${result.status}`);
    if (result.statusCode) console.log(`   Status Code: ${result.statusCode}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });

  const successCount = results.filter((r) => r.status === 'SUCCESS').length;
  console.log(`\n✅ Passed: ${successCount}/${results.length}`);
  console.log(`❌ Failed: ${results.length - successCount}/${results.length}`);
}

// Run tests
testRegistration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


