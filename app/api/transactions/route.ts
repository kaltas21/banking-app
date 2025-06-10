import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const accountId = searchParams.get('accountId');

    if (accountId) {
      // Get transactions for a specific account
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          from_account:accounts!from_account_id(account_number),
          to_account:accounts!to_account_id(account_number)
        `)
        .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      // Transform the data to match expected format
      const transformedData = transactions?.map(t => ({
        ...t,
        from_account_number: t.from_account?.account_number,
        to_account_number: t.to_account?.account_number
      })) || [];

      return NextResponse.json(transformedData);
    } else {
      // Get all transactions for the customer's accounts
      // First get customer's account IDs
      const { data: accounts, error: accountError } = await supabaseAdmin
        .from('accounts')
        .select('account_id')
        .eq('customer_id', session.user.id);

      if (accountError) {
        console.error('Error fetching accounts:', accountError);
        throw accountError;
      }

      const accountIds = accounts?.map(a => a.account_id) || [];

      if (accountIds.length === 0) {
        return NextResponse.json([]);
      }

      // Then get transactions for those accounts
      const { data: transactions, error } = await supabaseAdmin
        .from('transactions')
        .select(`
          *,
          from_account:accounts!from_account_id(account_number),
          to_account:accounts!to_account_id(account_number)
        `)
        .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`)
        .order('transaction_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      // Transform the data to match expected format
      const transformedData = transactions?.map(t => ({
        ...t,
        from_account_number: t.from_account?.account_number,
        to_account_number: t.to_account?.account_number
      })) || [];

      return NextResponse.json(transformedData);
    }
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}