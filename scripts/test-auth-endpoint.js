const fetch = require('node-fetch');

async function testAuthEndpoint() {
  console.log('🔍 Testing authentication endpoint...');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test credentials
  const testCases = [
    {
      name: 'Customer login',
      credentials: {
        email: 'john.doe@example.com',
        password: 'password123',
        userType: 'customer'
      }
    },
    {
      name: 'Employee login',
      credentials: {
        email: 'admin@bank.com',
        password: 'admin123',
        userType: 'employee'
      }
    }
  ];
  
  for (const test of testCases) {
    console.log(`\n🔄 Testing: ${test.name}...`);
    console.log(`  Email: ${test.credentials.email}`);
    console.log(`  User Type: ${test.credentials.userType}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: test.credentials.email,
          password: test.credentials.password,
          userType: test.credentials.userType,
          json: true
        })
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Authentication successful!');
        console.log('  Response:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log('❌ Authentication failed');
        console.log('  Response:', text);
      }
      
    } catch (error) {
      console.error('❌ Request error:', error.message);
    }
  }
  
  console.log('\n📝 Note: Make sure the Next.js dev server is running on port 3000');
}

// Check if fetch is available
if (!fetch) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch@2', { stdio: 'inherit' });
  console.log('Please run the script again.');
} else {
  testAuthEndpoint();
}