const fetch = require('node-fetch');

async function testAuthAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Testing authentication API...\n');
  
  try {
    // Test customer login
    console.log('1. Testing customer login:');
    const customerResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kblase0@dyndns.org',
        password: 'dE6>GY*7Q\\r/=',
        userType: 'customer',
        redirect: false,
        json: true
      })
    });
    
    console.log('Customer login response status:', customerResponse.status);
    const customerData = await customerResponse.text();
    console.log('Customer login response:', customerData);
    
    // Test employee login
    console.log('\n2. Testing employee login:');
    const employeeResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'thaisell0@youtu.be',
        password: 'zI7|=+>++b,.R',
        userType: 'employee',
        redirect: false,
        json: true
      })
    });
    
    console.log('Employee login response status:', employeeResponse.status);
    const employeeData = await employeeResponse.text();
    console.log('Employee login response:', employeeData);
    
  } catch (error) {
    console.error('Error testing auth API:', error);
  }
}

testAuthAPI();