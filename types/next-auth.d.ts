import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    userType?: string;
    role?: string;
  }

  interface Session {
    user: {
      id?: string;
      userType?: string;
      role?: string;
    } & DefaultSession['user'];
  }
}