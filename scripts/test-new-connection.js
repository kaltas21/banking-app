const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testNewConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔄 Testing new connection pattern...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test a simple query
    console.log('\n📊 Testing simple query...');
    const queryString = 'SELECT COUNT(*) as count FROM customers';
    const result = await client.query(queryString);
    console.log('✅ Customer count:', result.rows[0].count);

    // Test a parameterized query
    console.log('\n🔍 Testing parameterized query...');
    const paramQuery = 'SELECT customer_id, first_name, last_name FROM customers WHERE customer_id = $1';
    const paramResult = await client.query(paramQuery, [1]);
    if (paramResult.rows.length > 0) {
      console.log('✅ Found customer:', paramResult.rows[0]);
    } else {
      console.log('⚠️  No customer found with ID 1');
    }

    // Test transaction
    console.log('\n💱 Testing transaction...');
    await client.query('BEGIN');
    
    const accountQuery = 'SELECT account_id, balance FROM accounts WHERE customer_id = $1 LIMIT 1';
    const accountResult = await client.query(accountQuery, [1]);
    
    if (accountResult.rows.length > 0) {
      console.log('✅ Found account:', accountResult.rows[0]);
    }
    
    await client.query('ROLLBACK');
    console.log('✅ Transaction rolled back successfully');

    console.log('\n🎉 All tests passed! The new connection pattern is working correctly.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

testNewConnection();