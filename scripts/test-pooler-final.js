const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testFinalConnection() {
  // Parse the connection string to check components
  const url = new URL(process.env.DATABASE_URL);
  console.log('🔍 Connection details:');
  console.log('  Protocol:', url.protocol);
  console.log('  Username:', url.username);
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port);
  console.log('  Database:', url.pathname.slice(1));

  // Try different SSL configurations
  const sslConfigs = [
    { name: 'No SSL', ssl: false },
    { name: 'SSL true', ssl: true },
    { name: 'SSL with rejectUnauthorized false', ssl: { rejectUnauthorized: false } },
    { name: 'SSL require mode', ssl: 'require' },
    { name: 'SSL no-verify mode', ssl: 'no-verify' }
  ];

  for (const config of sslConfigs) {
    console.log(`\n🔄 Trying: ${config.name}...`);
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: config.ssl
    });

    try {
      await client.connect();
      console.log(`✅ Success with ${config.name}!`);
      
      const result = await client.query('SELECT version()');
      console.log('  PostgreSQL version:', result.rows[0].version.split(' ')[1]);
      
      await client.end();
      
      // If successful, use this config for actual test
      console.log('\n🎉 Running full test with working configuration...');
      await runFullTest(config.ssl);
      break;
      
    } catch (error) {
      console.log(`❌ Failed with ${config.name}:`, error.message);
      try {
        await client.end();
      } catch (e) {
        // Ignore end errors
      }
    }
  }
}

async function runFullTest(sslConfig) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig
  });

  try {
    await client.connect();
    
    // Test basic query
    const timeResult = await client.query('SELECT NOW() as time');
    console.log('✅ Current time:', timeResult.rows[0].time);
    
    // Test parameterized query
    const paramResult = await client.query('SELECT $1::text as test', ['Hello from pooler!']);
    console.log('✅ Parameterized query:', paramResult.rows[0].test);
    
    // Test table query
    try {
      const customerResult = await client.query('SELECT COUNT(*) as count FROM customers');
      console.log('✅ Customer count:', customerResult.rows[0].count);
    } catch (e) {
      console.log('⚠️  Could not query customers table:', e.message);
    }
    
    console.log('\n🎉 Connection test successful! You can use this SSL configuration in your app.');
    
  } finally {
    await client.end();
  }
}

testFinalConnection().catch(console.error);