const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function testPoolerWithCorrectSSL() {
  console.log('🔍 Testing pooler with proper SSL configuration...');
  
  // The pooler connection requires SSL but in a specific way
  // Let's try different Node.js TLS options
  const configs = [
    {
      name: 'Default SSL for pooler',
      client: new Client({
        connectionString: process.env.DATABASE_URL,
      })
    },
    {
      name: 'SSL with rejectUnauthorized false',
      client: new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      })
    },
    {
      name: 'SSL with require mode via connection string',
      client: new Client({
        connectionString: process.env.DATABASE_URL + '?sslmode=require',
      })
    },
    {
      name: 'Force SSL via Node.js TLS',
      client: new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
          // Force TLS 1.2 which Supabase uses
          minVersion: 'TLSv1.2'
        }
      })
    }
  ];

  // Also try modifying Node.js TLS behavior globally
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  configs.push({
    name: 'With NODE_TLS_REJECT_UNAUTHORIZED=0',
    client: new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: true
    })
  });

  for (const config of configs) {
    console.log(`\n🔄 Trying: ${config.name}...`);
    
    try {
      await config.client.connect();
      console.log('✅ Connected successfully!');
      
      const result = await config.client.query('SELECT current_database()');
      console.log('✅ Database:', result.rows[0].current_database);
      
      await config.client.end();
      
      console.log('\n🎉 SUCCESS! Use this configuration:');
      console.log(config.name);
      return;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      try { await config.client.end(); } catch (e) {}
    }
  }
  
  // Reset the environment variable
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  
  console.log('\n🤔 The issue persists. Let me check one more thing...');
  
  // Sometimes the pooler needs a specific format
  // Let's try with explicit parameters
  const url = new URL(process.env.DATABASE_URL);
  console.log('\n📊 Connection components:');
  console.log('Host:', url.hostname);
  console.log('Port:', url.port);
  console.log('Username:', url.username);
  console.log('Database:', url.pathname.substring(1));
  
  const explicitClient = new Client({
    host: url.hostname,
    port: parseInt(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    console.log('\n🔄 Trying with explicit parameters...');
    await explicitClient.connect();
    console.log('✅ Connected with explicit parameters!');
    
    const result = await explicitClient.query('SELECT 1');
    console.log('✅ Query successful!');
    
    await explicitClient.end();
    
    console.log('\n🎉 Use explicit parameters instead of connection string!');
    
  } catch (error) {
    console.log('❌ Explicit parameters also failed:', error.message);
  }
}

testPoolerWithCorrectSSL();