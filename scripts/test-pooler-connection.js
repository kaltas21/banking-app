const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPoolerConnection() {
  console.log('🔍 Testing with transaction pooler URL...');
  console.log('📊 Database URL:', process.env.DATABASE_URL);

  // For Supabase pooler, we need to use specific SSL settings
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      // This is important for pooler connections
      sslmode: 'require'
    }
  });

  try {
    console.log('\n🔄 Attempting to connect to pooler...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, current_database() as db');
    console.log('✅ Database info:', result.rows[0]);
    
    // Test table access
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
      LIMIT 10
    `);
    console.log('\n📋 Available tables:');
    tableResult.rows.forEach(row => console.log('  -', row.table_name));
    
    // Test a simple count query
    const countResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log('\n📊 Customer count:', countResult.rows[0].count);
    
    console.log('\n🎉 All tests passed! The pooler connection is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    
    // Try alternative connection method
    console.log('\n🔄 Trying alternative connection method...');
    const altClient = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true // Simple SSL flag
    });
    
    try {
      await altClient.connect();
      console.log('✅ Alternative connection successful!');
      
      const result = await altClient.query('SELECT 1 as test');
      console.log('✅ Test query result:', result.rows[0]);
      
      await altClient.end();
    } catch (altError) {
      console.error('❌ Alternative connection also failed:', altError.message);
    }
    
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

testPoolerConnection();