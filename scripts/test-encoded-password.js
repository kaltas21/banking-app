const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testEncodedPassword() {
  console.log('🔍 Testing with different password encodings...');
  
  const baseUrl = 'postgresql://postgres.exyoucfdiggseoijblni:{PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
  
  // Different password formats to try
  const passwords = [
    { name: 'Original', value: 'linaks-306' },
    { name: 'URL encoded', value: encodeURIComponent('linaks-306') },
    { name: 'Without hyphen (in case it\'s causing issues)', value: 'linaks306' },
    { name: 'With escaped hyphen', value: 'linaks\\-306' },
  ];
  
  for (const pwd of passwords) {
    console.log(`\n🔄 Trying password format: ${pwd.name}...`);
    
    const connectionString = baseUrl.replace('{PASSWORD}', pwd.value);
    
    const client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await client.connect();
      console.log('✅ Connected successfully!');
      console.log(`✅ The correct password format is: ${pwd.name}`);
      
      const result = await client.query('SELECT current_database()');
      console.log('✅ Database:', result.rows[0].current_database);
      
      await client.end();
      
      console.log('\n🎉 Update your .env.local with this connection string:');
      console.log(`DATABASE_URL=${connectionString}`);
      
      return;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      try { await client.end(); } catch (e) {}
    }
  }
  
  console.log('\n❌ None of the password encodings worked.');
  console.log('\n📝 The issue is definitely authentication-related.');
  console.log('Please check your Supabase dashboard:');
  console.log('1. Go to Settings → Database');
  console.log('2. Look for "Connection string" or "Connection pooling"');
  console.log('3. Make sure you have the correct password');
  console.log('4. The pooler might use a different password than the direct connection');
  
  // Also test if we can at least reach the server
  console.log('\n🔍 Testing server connectivity...');
  const client = new Client({
    host: 'aws-0-eu-central-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.exyoucfdiggseoijblni',
    password: 'wrong-password-on-purpose',
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
  } catch (error) {
    if (error.message.includes('SCRAM')) {
      console.log('✅ Server is reachable, but authentication is failing');
      console.log('This confirms the password is incorrect');
    } else {
      console.log('❌ Different error:', error.message);
    }
  }
}

testEncodedPassword();