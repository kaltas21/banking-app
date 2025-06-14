const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Database URL:', process.env.DATABASE_URL);
  
  // Parse the connection string
  const match = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    console.log('📊 Connection details:');
    console.log('  User:', match[1]);
    console.log('  Host:', match[3]);
    console.log('  Port:', match[4]);
    console.log('  Database:', match[5]);
  }

  // Try with SSL disabled
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('\n🔄 Attempting to connect without SSL...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('✅ Current time from database:', result.rows[0].now);
    
  } catch (error) {
    console.log('❌ Failed without SSL:', error.message);
    
    // Try with SSL enabled
    const clientSSL = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      console.log('\n🔄 Attempting to connect with SSL...');
      await clientSSL.connect();
      console.log('✅ Connected successfully with SSL!');
      
      const result = await clientSSL.query('SELECT NOW()');
      console.log('✅ Current time from database:', result.rows[0].now);
      
      await clientSSL.end();
    } catch (sslError) {
      console.log('❌ Failed with SSL too:', sslError.message);
    }
  } finally {
    await client.end();
  }
}

testConnection();