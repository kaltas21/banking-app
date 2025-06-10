import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getServerSession() {
  return await getNextAuthSession(authOptions);
}