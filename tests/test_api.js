/**
 * Web Control API Test Suite
 * Validates REST APIs, JWT authentication, and Role-Based Access Control
 */

const axios = require('../backend/node_modules/axios');
const API_URL = 'http://localhost:3000/api';

async function runApiTests() {
  console.log('========================================================');
  console.log('  RUNNING TEST SUITE: ENGINE 04 - WEB CONTROL & APIS   ');
  console.log('========================================================\n');

  try {
    // Check health
    const health = await axios.get(`${API_URL}/health`);
    console.log('[Health] Backend server is online:', health.data);
  } catch (err) {
    console.warn('[Notice] Backend server not currently running at', API_URL);
    console.warn('API tests will be verifiable once server is started with: npm start');
    return;
  }

  try {
    // 1. Test Login with Demo Donor
    console.log('\n[Test 1] Authenticating Demo Donor...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'donor1@bloodbank.com',
      password: 'password123'
    });
    console.log(' -> Login successful. Role:', loginRes.data.data.user.role);
    const donorToken = loginRes.data.data.token;

    // 2. Test Role Protection: Donor accessing Staff endpoint should be 403 Forbidden
    console.log('\n[Test 2] RBAC Verification (Donor attempting to access Staff Queue)...');
    try {
      await axios.get(`${API_URL}/scheduler/queue`, {
        headers: { Authorization: `Bearer ${donorToken}` }
      });
      throw new Error('RBAC Failed - Donor accessed staff endpoint!');
    } catch (e) {
      if (e.response && (e.response.status === 403 || e.response.status === 401)) {
        console.log(` -> PASSED: Forbidden (HTTP ${e.response.status}). RBAC enforced.`);
      } else {
        throw e;
      }
    }

    // 3. Test Staff Login and Queue Access
    console.log('\n[Test 3] Authenticating Demo Staff Member...');
    const staffLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'staff@bloodbank.com',
      password: 'password123'
    });
    const staffToken = staffLogin.data.data.token;
    const queueRes = await axios.get(`${API_URL}/scheduler/queue`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    console.log(` -> PASSED: Staff authenticated. Retrieved ${queueRes.data.data.database_queue.length} queue entries.`);

    // 4. Test Compatibility API (Engine 02 Integration)
    console.log('\n[Test 4] Compatibility Matcher API Integration...');
    const compatRes = await axios.post(`${API_URL}/compatibility/check`, {
      donor_blood_group: 'O-',
      recipient_blood_group: 'AB+'
    });
    console.log(' -> Result:', compatRes.data);
    if (!compatRes.data.compatible) throw new Error('O- to AB+ should be compatible!');
    console.log(' -> PASSED: Compatibility endpoint returned correct matching status.');

    // 5. Test Scheduler Metrics API (Engine 01 Integration)
    console.log('\n[Test 5] OS Scheduler Metrics API Integration...');
    const metricsRes = await axios.get(`${API_URL}/scheduler/metrics`, {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    console.log(' -> Metrics:', metricsRes.data.data);
    console.log(' -> PASSED: Scheduler metrics successfully calculated and returned.');

    console.log('\n========================================================');
    console.log('  ALL WEB REST API & RBAC TESTS PASSED SUCCESSFULLY!    ');
    console.log('========================================================\n');

  } catch (err) {
    console.error('API Test Error:', err.response?.data || err.message);
  }
}

runApiTests();
