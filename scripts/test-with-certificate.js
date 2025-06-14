const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function testWithCertificate() {
  console.log('🔍 Testing connection with Supabase CA certificate...');
  
  const caCertPath = path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt');
  const caCert = fs.readFileSync(caCertPath).toString();
  
  console.log('✅ Certificate loaded successfully');
  console.log('📊 Certificate details:');
  console.log('  - Issuer: Supabase Root 2021 CA');
  console.log('  - Valid until: 2031');
  
  // Test configurations with the certificate
  const configs = [
    {
      name: 'With CA certificate only',
      connectionString: process.env.DATABASE_URL,
      ssl: {
        ca: caCert
      }
    },
    {
      name: 'With CA certificate and rejectUnauthorized false',
      connectionString: process.env.DATABASE_URL,
      ssl: {
        ca: caCert,
        rejectUnauthorized: false
      }
    },
    {
      name: 'With CA certificate and require mode',
      connectionString: process.env.DATABASE_URL,
      ssl: {
        ca: caCert,
        mode: 'require'
      }
    },
    {
      name: 'With CA certificate and sslmode in URL',
      connectionString: process.env.DATABASE_URL + '?sslmode=require',
      ssl: {
        ca: caCert
      }
    }
  ];
  
  for (const config of configs) {
    console.log(`\n🔄 Trying: ${config.name}...`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Connected successfully!');
      
      // Test basic query
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ Query successful!');
      console.log('  - Time:', result.rows[0].current_time);
      console.log('  - PostgreSQL:', result.rows[0].pg_version.split(' ')[1]);
      
      // Test table access
      const tableResult = await client.query('SELECT COUNT(*) as count FROM customers');
      console.log('  - Customer count:', tableResult.rows[0].count);
      
      await client.end();
      
      console.log('\n🎉 SUCCESS! Use this configuration in your code:');
      console.log('```javascript');
      console.log('const { Client } = require("pg");');
      console.log('const fs = require("fs");');
      console.log('');
      console.log('const client = new Client({');
      console.log('  connectionString: process.env.DATABASE_URL,');
      console.log('  ssl: {');
      if (config.ssl.ca) console.log('    ca: fs.readFileSync("./certs/supabase-ca-2021.crt").toString(),');
      if (config.ssl.rejectUnauthorized !== undefined) console.log(`    rejectUnauthorized: ${config.ssl.rejectUnauthorized}`);
      console.log('  }');
      console.log('});');
      console.log('```');
      
      return;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      if (error.message.includes('SCRAM')) {
        console.log('  ℹ️  Still getting authentication error - password might be incorrect');
      }
      try { await client.end(); } catch (e) {}
    }
  }
  
  console.log('\n📝 Certificate didn\'t resolve the authentication issue.');
  console.log('The SASL/SCRAM error suggests the password might be incorrect.');
  console.log('\n💡 Suggestions:');
  console.log('1. Double-check the password in Supabase dashboard');
  console.log('2. Try resetting the database password');
  console.log('3. Make sure you\'re using the pooler-specific password if there is one');
}

testWithCertificate();