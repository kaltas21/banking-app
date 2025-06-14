const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testSupabasePooler() {
  console.log('🔍 Testing Supabase pooler connection...');
  
  // For Supabase pooler, we typically need SSL enabled
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: true
  });

  try {
    console.log('🔄 Connecting to Supabase pooler...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    // Run a simple test
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Test query successful:', result.rows[0]);
    
    // Try to get current time
    const timeResult = await client.query('SELECT NOW()::text as current_time');
    console.log('✅ Current time:', timeResult.rows[0].current_time);
    
    console.log('\n🎉 Pooler connection is working!');
    console.log('📝 Use this configuration in your code:');
    console.log(`
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});
`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // If SSL true doesn't work, try with process.env.NODE_ENV check
    if (error.message.includes('self-signed certificate')) {
      console.log('\n🔄 Retrying with SSL rejectUnauthorized: false...');
      
      const retryClient = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      try {
        await retryClient.connect();
        console.log('✅ Connected with rejectUnauthorized: false!');
        
        const result = await retryClient.query('SELECT 1 as test');
        console.log('✅ Test query successful:', result.rows[0]);
        
        console.log('\n🎉 Use this configuration instead:');
        console.log(`
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
`);
        
        await retryClient.end();
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
      }
    }
  } finally {
    await client.end();
  }
}

testSupabasePooler();