import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function GET(request: Request) {
  const client = getDbClient();

  try {
    await client.connect();
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // Get transactions for a specific account
      const transactionsQuery = `
        SELECT 
          t.*,
          fa.account_number AS from_account_number,
          ta.account_number AS to_account_number
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
        LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
        WHERE t.from_account_id = $1 OR t.to_account_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT $2
      `;
      const transactionsResult = await client.query(transactionsQuery, [accountId, limit]);
      const transactions = transactionsResult.rows;

      return NextResponse.json(transactions);
    } else {
      // Get all transactions for the customer's accounts
      // First get customer's account IDs
      const accountsQuery = `
        SELECT account_id
        FROM accounts
        WHERE customer_id = $1
      `;
      const accountsResult = await client.query(accountsQuery, [session.user.id]);
      const accounts = accountsResult.rows;

      const accountIds = accounts.map(a => a.account_id);

      if (accountIds.length === 0) {
        return NextResponse.json([]);
      }

      // Then get transactions for those accounts
      const transactionsQuery = `
        SELECT 
          t.*,
          fa.account_number AS from_account_number,
          ta.account_number AS to_account_number
        FROM transactions t
        LEFT JOIN accounts fa ON t.from_account_id = fa.account_id
        LEFT JOIN accounts ta ON t.to_account_id = ta.account_id
        WHERE t.from_account_id = ANY($1) OR t.to_account_id = ANY($1)
        ORDER BY t.transaction_date DESC
        LIMIT $2
      `;
      const transactionsResult = await client.query(transactionsQuery, [accountIds, limit]);
      const transactions = transactionsResult.rows;

      return NextResponse.json(transactions);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Return empty array instead of error object to match expected format
    return NextResponse.json([], { status: 500 }
    );
  } finally {
    await client.end();
  }
}