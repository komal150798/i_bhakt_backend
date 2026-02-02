/**
 * Test Script for Update Profile API
 * Tests: PUT /api/v1/app/users/profile
 * 
 * Note: Requires authentication token from registration/login
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const REGISTER_ENDPOINT = `${API_BASE_URL}/auth/register`;
const LOGIN_ENDPOINT = `${API_BASE_URL}/auth/login`;
const UPDATE_ENDPOINT = `${API_BASE_URL}/app/users/profile`;

// Helper: Register a test user and get token
async function registerAndGetToken() {
  const timestamp = Date.now();
  const testEmail = `testupdate${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  try {
    // Register
    const registerResponse = await axios.post(REGISTER_ENDPOINT, {
      name: 'Test Update User',
      email: testEmail,
      password: testPassword,
    });

    if (registerResponse.status === 201 && registerResponse.data?.data?.access_token) {
      return {
        token: registerResponse.data.data.access_token,
        user: registerResponse.data.data.user,
        email: testEmail,
        password: testPassword,
      };
    }

    // If registration fails, try login
    const loginResponse = await axios.post(LOGIN_ENDPOINT, {
      email: testEmail,
      password: testPassword,
    });

    if (loginResponse.status === 200 && loginResponse.data?.data?.access_token) {
      return {
        token: loginResponse.data.data.access_token,
        user: loginResponse.data.data.user,
        email: testEmail,
        password: testPassword,
      };
    }

    throw new Error('Failed to get authentication token');
  } catch (error) {
    if (error.response?.status === 409) {
      // User exists, try login
      const loginResponse = await axios.post(LOGIN_ENDPOINT, {
        email: testEmail,
        password: testPassword,
      });

      if (loginResponse.status === 200 && loginResponse.data?.data?.access_token) {
        return {
          token: loginResponse.data.data.access_token,
          user: loginResponse.data.data.user,
          email: testEmail,
          password: testPassword,
        };
      }
    }
    throw error;
  }
}

// Sample update test cases
const updateTestCases = [
  {
    name: 'Update Basic Profile (Name)',
    data: {
      first_name: 'Updated',
      last_name: 'Name',
    },
  },
  {
    name: 'Update with Birth Data',
    data: {
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-15',
      time_of_birth: '10:30:00',
      place_name: 'Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
      timezone: 'Asia/Kolkata',
    },
  },
  {
    name: 'Update Email Only',
    data: {
      email: `updated${Date.now()}@example.com`,
    },
  },
  {
    name: 'Update Gender',
    data: {
      gender: 'male',
    },
  },
  {
    name: 'Update Avatar URL',
    data: {
      avatar_url: 'https://example.com/avatar.jpg',
    },
  },
  {
    name: 'Update Multiple Fields',
    data: {
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: '1995-05-20',
      time_of_birth: '14:45:00',
      place_name: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      timezone: 'Asia/Kolkata',
      gender: 'female',
    },
  },
];

// Test function
async function testUpdateProfile() {
  console.log('🧪 Testing Update Profile API');
  console.log('='.repeat(60));
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Update Endpoint: ${UPDATE_ENDPOINT}\n`);

  // Get authentication token
  console.log('🔐 Getting authentication token...');
  let authData;
  try {
    authData = await registerAndGetToken();
    console.log('✅ Token obtained');
    console.log(`User ID: ${authData.user?.id || authData.user?.unique_id}`);
    console.log(`Email: ${authData.email}\n`);
  } catch (error) {
    console.error('❌ Failed to get authentication token:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }

  const results = [];

  for (const testCase of updateTestCases) {
    try {
      console.log(`\n📝 Test: ${testCase.name}`);
      console.log(`Request Data:`, JSON.stringify(testCase.data, null, 2));

      const response = await axios.put(
        UPDATE_ENDPOINT,
        testCase.data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authData.token}`,
          },
          validateStatus: () => true, // Don't throw on any status
        }
      );

      console.log(`Status: ${response.status}`);
      console.log(`Response:`, JSON.stringify(response.data, null, 2));

      if (response.status === 200) {
        console.log('✅ SUCCESS');
        results.push({
          test: testCase.name,
          status: 'SUCCESS',
          statusCode: response.status,
          hasData: !!response.data?.data,
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
testUpdateProfile().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


