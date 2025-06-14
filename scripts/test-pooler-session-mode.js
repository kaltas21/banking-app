const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPoolerSessionMode() {
  console.log('🔍 Testing Supabase pooler with session mode...');
  
  // Supabase pooler might need specific parameters
  // Try appending ?pgbouncer=true or ?sslmode=require
  const connectionStrings = [
    process.env.DATABASE_URL,
    process.env.DATABASE_URL + '?sslmode=require',
    process.env.DATABASE_URL + '?pgbouncer=true',
    process.env.DATABASE_URL + '?sslmode=require&pgbouncer=true'
  ];
  
  for (let i = 0; i < connectionStrings.length; i++) {
    console.log(`\n🔄 Attempt ${i + 1}/${connectionStrings.length}...`);
    
    const client = new Client({
      connectionString: connectionStrings[i]
    });
    
    try {
      await client.connect();
      console.log('✅ Connected successfully!');
      
      const result = await client.query('SELECT 1');
      console.log('✅ Query successful!');
      
      console.log('\n🎉 Working connection string format:');
      if (i === 0) {
        console.log('Standard connection string works!');
      } else {
        console.log('Add these parameters to your connection string:', connectionStrings[i].split('?')[1]);
      }
      
      await client.end();
      return;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      try { await client.end(); } catch (e) {}
    }
  }
  
  // If none work, try checking if we need to use a different format
  console.log('\n📝 None of the standard approaches worked.');
  console.log('The error "SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing" suggests:');
  console.log('1. The password might be incorrect');
  console.log('2. The connection string format might need adjustment');
  console.log('3. The pooler might require a specific connection mode');
  
  // Let's also verify the connection string format
  console.log('\n🔍 Current connection string analysis:');
  const url = process.env.DATABASE_URL;
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    console.log('Username:', match[1]);
    console.log('Password length:', match[2].length, 'characters');
    console.log('Host:', match[3]);
    console.log('Port:', match[4]);
    console.log('Database:', match[5]);
  }
}

testPoolerSessionMode();