import { Client, ClientConfig } from 'pg';
import fs from 'fs';
import path from 'path';

export function createClient(): Client {
  const config: ClientConfig = {
    connectionString: process.env.DATABASE_URL
  };

  // For Supabase pooler connections, we need SSL with CA certificate
  // Check if it's a pooler URL (contains 'pooler.supabase.com')
  if (process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    const caCertPath = path.join(process.cwd(), 'certs', 'supabase-ca-2021.crt');
    
    config.ssl = {
      ca: fs.readFileSync(caCertPath).toString()
    };
  }

  return new Client(config);
}