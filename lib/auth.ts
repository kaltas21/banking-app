import { getServerSession as getNextAuthSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        userType: { label: 'User Type', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let sslConfig: any = false;
        
        // Check if we're using Supabase pooler
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
                sslConfig = {
                  ca: fs.readFileSync(certPath).toString()
                };
                certFound = true;
                break;
              }
            }
            
            if (!certFound) {
              // Fallback if certificate file is not found
              console.warn('Certificate file not found in any path, using rejectUnauthorized: false');
              sslConfig = {
                rejectUnauthorized: false
              };
            }
          } catch (err) {
            console.error('Error loading certificate:', err);
            sslConfig = {
              rejectUnauthorized: false
            };
          }
        }
        
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: sslConfig
        });

        try {
          await client.connect();
          
          let user;
          
          if (credentials.userType === 'employee') {
            // Query employee from database
            const employeeQuery = `
              SELECT 
                employee_id,
                first_name,
                last_name,
                email,
                password,
                role
              FROM employees
              WHERE email = $1
            `;
            const employeeResult = await client.query(employeeQuery, [credentials.email]);
            const employees = employeeResult.rows;
            
            if (employees.length === 0) {
              console.log('Employee not found');
              return null;
            }
            
            user = employees[0];
            
            // Plain text password comparison
            const isPasswordValid = user.password === credentials.password;

            if (!isPasswordValid) {
              console.log('Invalid password');
              return null;
            }

            return {
              id: user.employee_id.toString(),
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              userType: 'employee',
              role: user.role
            };
          } else {
            // Query customer from database
            const customerQuery = `
              SELECT 
                customer_id,
                first_name,
                last_name,
                email,
                password
              FROM customers
              WHERE email = $1
            `;
            const customerResult = await client.query(customerQuery, [credentials.email]);
            const customers = customerResult.rows;
            
            if (customers.length === 0) {
              console.log('Customer not found');
              return null;
            }
            
            user = customers[0];
            
            // Plain text password comparison
            const isPasswordValid = user.password === credentials.password;

            if (!isPasswordValid) {
              console.log('Invalid password');
              return null;
            }

            return {
              id: user.customer_id.toString(),
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              userType: 'customer',
              role: 'customer'
            };
          }
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        } finally {
          await client.end();
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.userType = token.userType as string;
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
};

export async function getServerSession() {
  return await getNextAuthSession(authOptions);
}