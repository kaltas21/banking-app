import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET() {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    console.log('Session in accounts API:', session);
    
    if (!session || !session.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json([], { status: 401 });
    }
    
    // Only allow customers to access this endpoint
    if (session.user.userType !== 'customer') {
      console.log('User is not a customer:', session.user.userType);
      return NextResponse.json([], { status: 403 });
    }

    const queryString = `
      SELECT 
        account_id, 
        account_number, 
        account_type, 
        balance, 
        status
      FROM accounts
      WHERE customer_id = $1
      ORDER BY account_type
    `;
    const result = await client.query(queryString, [session.user.id]);
    const data = result.rows;

    console.log('Accounts data:', data);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in accounts API:', error);
    // Return empty array instead of error object to match expected format
    return NextResponse.json([], { status: 500 });
  } finally {
    await client.end();
  }
}