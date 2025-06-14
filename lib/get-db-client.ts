import { Client, ClientConfig } from 'pg';
import fs from 'fs';
import path from 'path';

export function getDbClient(): Client {
  const config: ClientConfig = {
    connectionString: process.env.DATABASE_URL
  };

  // For Supabase pooler connections, we need SSL
  if (process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    try {
      // Try multiple paths for the certificate
      const possiblePaths = [
        path.join(process.cwd(), 'certs', 'supabase-ca-2021.crt'),
        path.join(process.cwd(), 'banking-app', 'certs', 'supabase-ca-2021.crt'),
        path.join(__dirname, '..', 'certs', 'supabase-ca-2021.crt'),
      ];
      
      let certFound = false;
      for (const certPath of possiblePaths) {
        if (fs.existsSync(certPath)) {
          config.ssl = {
            ca: fs.readFileSync(certPath).toString()
          };
          certFound = true;
          break;
        }
      }
      
      if (!certFound) {
        // Fallback to rejectUnauthorized: false
        console.warn('Certificate not found, using rejectUnauthorized: false');
        config.ssl = {
          rejectUnauthorized: false
        };
      }
    } catch (err) {
      console.error('Error configuring SSL:', err);
      config.ssl = {
        rejectUnauthorized: false
      };
    }
  }

  return new Client(config);
}