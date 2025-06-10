import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabaseAdmin } from '@/lib/supabase';

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

        try {
          let user;
          let table = credentials.userType === 'employee' ? 'employees' : 'customers';
          
          // Query user from Supabase
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !data) {
            console.log('User not found');
            return null;
          }

          user = data;

          // Plain text password comparison
          const isPasswordValid = user.password === credentials.password;

          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }

          return {
            id: credentials.userType === 'employee' 
              ? user.employee_id.toString() 
              : user.customer_id.toString(),
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            userType: credentials.userType,
            role: user.role || 'customer'
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };