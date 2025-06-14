import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await params;

    // Verify that the account belongs to the logged-in customer
    const accountsQuery = `
      SELECT account_id, account_number, account_type, balance, status
      FROM accounts
      WHERE account_id = $1
        AND customer_id = $2
    `;
    const accountsResult = await client.query(accountsQuery, [accountId, session.user.id]);
    const accounts = accountsResult.rows;

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(accounts[0]);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}