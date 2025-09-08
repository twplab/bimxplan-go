#!/usr/bin/env node

/**
 * Quick App Test Script
 * Tests basic functionality without full E2E setup
 */

const http = require('http');
const https = require('https');

console.log('🚀 Starting Quick App Test...\n');

// Test 1: Check if dev server is running
function testDevServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Dev server is running (http://localhost:8080)');
        resolve(true);
      } else {
        console.log('❌ Dev server returned status:', res.statusCode);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Dev server is not running. Please start it with: npm run dev');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Dev server timeout');
      resolve(false);
    });
  });
}

// Test 2: Check API connectivity
function testAPIs() {
  return Promise.all([
    testAPI('https://fcohkllemgyyhljoqrxe.supabase.co', 'Supabase API'),
    testAPI('https://agent.kith.build', 'BIMxPlan API')
  ]);
}

function testAPI(url, name) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${name} is reachable (status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${name} connection failed:`, err.code);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`❌ ${name} timeout`);
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('Testing connectivity...\n');
  
  const [devServerOk] = await Promise.all([
    testDevServer(),
    testAPIs()
  ]);
  
  console.log('\n📋 Test Results:');
  console.log('==================');
  
  if (devServerOk) {
    console.log('🎉 App is ready for testing!');
    console.log('\n🔗 Open your browser and visit:');
    console.log('   👉 http://localhost:8080');
    console.log('\n📋 Quick test checklist:');
    console.log('   1. Sign up/sign in with test credentials');
    console.log('   2. Create a new project');
    console.log('   3. Try the BEP form wizard');
    console.log('   4. Test the chatbot');
    console.log('   5. Toggle dark/light theme');
  } else {
    console.log('⚠️  Please start the dev server first:');
    console.log('   npm run dev');
  }
}

runTests().catch(console.error);