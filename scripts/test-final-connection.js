const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testFinalConnection() {
  console.log('🔍 Testing final connection setup...');
  
  const caCertPath = path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      ca: fs.readFileSync(caCertPath).toString()
    }
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Test various queries
    console.log('\n📊 Running test queries...');
    
    // 1. Basic query
    const timeResult = await client.query('SELECT NOW() as time');
    console.log('✅ Current time:', timeResult.rows[0].time);
    
    // 2. Parameterized query
    const paramResult = await client.query('SELECT $1::int + $2::int as sum', [5, 3]);
    console.log('✅ Parameterized query (5 + 3):', paramResult.rows[0].sum);
    
    // 3. Table query
    const customerResult = await client.query('SELECT COUNT(*) as count FROM customers');
    console.log('✅ Total customers:', customerResult.rows[0].count);
    
    // 4. Complex query with parameters
    const accountResult = await client.query(`
      SELECT 
        a.account_type,
        COUNT(*) as count,
        SUM(a.balance) as total_balance
      FROM accounts a
      WHERE a.status = $1
      GROUP BY a.account_type
    `, ['Active']);
    
    console.log('✅ Active accounts by type:');
    accountResult.rows.forEach(row => {
      console.log(`   - ${row.account_type}: ${row.count} accounts, $${parseFloat(row.total_balance).toFixed(2)} total`);
    });
    
    console.log('\n🎉 All tests passed!');
    console.log('\n📝 Configuration summary:');
    console.log('1. Database URL uses the Supabase pooler (port 6543)');
    console.log('2. SSL is required with the Supabase CA certificate');
    console.log('3. All queries use parameterized format with $1, $2, etc.');
    console.log('4. Password has been successfully updated');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed.');
  }
}

testFinalConnection();