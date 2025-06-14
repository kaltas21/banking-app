const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testAuthDirect() {
  console.log('🔍 Testing authentication queries directly...');
  
  // Check if certificate exists
  const certPath = path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt');
  console.log('📁 Certificate path:', certPath);
  console.log('📁 Certificate exists:', fs.existsSync(certPath));
  
  let sslConfig = false;
  
  if (process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    if (fs.existsSync(certPath)) {
      sslConfig = {
        ca: fs.readFileSync(certPath).toString()
      };
      console.log('✅ Using CA certificate');
    } else {
      sslConfig = {
        rejectUnauthorized: false
      };
      console.log('⚠️  Using rejectUnauthorized: false');
    }
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  });

  try {
    console.log('\n🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test customer query
    console.log('\n📊 Testing customer query...');
    const customerQuery = `
      SELECT 
        customer_id,
        first_name,
        last_name,
        email,
        password
      FROM customers
      WHERE email = $1
    `;
    
    const customerResult = await client.query(customerQuery, ['john.doe@example.com']);
    if (customerResult.rows.length > 0) {
      const customer = customerResult.rows[0];
      console.log('✅ Found customer:', customer.email);
      console.log('  Password in DB:', customer.password);
      console.log('  Test with password123:', customer.password === 'password123' ? '✅ Match' : '❌ No match');
    } else {
      console.log('❌ Customer not found');
    }
    
    // Test employee query
    console.log('\n📊 Testing employee query...');
    const employeeQuery = `
      SELECT 
        employee_id,
        first_name,
        last_name,
        email,
        password,
        role
      FROM employees
      WHERE email = $1
    `;
    
    const employeeResult = await client.query(employeeQuery, ['admin@bank.com']);
    if (employeeResult.rows.length > 0) {
      const employee = employeeResult.rows[0];
      console.log('✅ Found employee:', employee.email);
      console.log('  Role:', employee.role);
      console.log('  Password in DB:', employee.password);
      console.log('  Test with admin123:', employee.password === 'admin123' ? '✅ Match' : '❌ No match');
    } else {
      console.log('❌ Employee not found');
    }
    
    console.log('\n🎉 Direct queries work fine!');
    console.log('If auth is still failing, the issue might be:');
    console.log('1. NextAuth is running in a different context');
    console.log('2. The certificate path is different when running via Next.js');
    console.log('3. Environment variables are not loaded in auth context');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

testAuthDirect();