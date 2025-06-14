import { ClientConfig } from 'pg';
import fs from 'fs';
import path from 'path';

export function getDbConfig(): ClientConfig {
  const config: ClientConfig = {
    connectionString: process.env.DATABASE_URL
  };

  // For Supabase pooler connections, we need SSL with CA certificate
  if (process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    const caCertPath = path.join(process.cwd(), 'certs', 'supabase-ca-2021.crt');
    
    config.ssl = {
      ca: fs.readFileSync(caCertPath).toString()
    };
  }

  return config;
}