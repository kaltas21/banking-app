import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromAccountId, toAccountNumber, amount, description } = body;

    // Validate input
    if (!fromAccountId || !toAccountNumber || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid transfer details' },
        { status: 400 }
      );
    }

    // Begin transaction by checking from account
    const { data: fromAccount, error: fromError } = await supabaseAdmin
      .from('accounts')
      .select('account_id, balance, account_number')
      .eq('account_id', fromAccountId)
      .eq('customer_id', session.user.id)
      .eq('status', 'Active')
      .single();

    if (fromError || !fromAccount) {
      return NextResponse.json(
        { error: 'Invalid source account' },
        { status: 400 }
      );
    }

    if (parseFloat(fromAccount.balance) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Find destination account
    const { data: toAccount, error: toError } = await supabaseAdmin
      .from('accounts')
      .select('account_id, customer_id')
      .eq('account_number', toAccountNumber)
      .eq('status', 'Active')
      .single();

    if (toError || !toAccount) {
      return NextResponse.json(
        { error: 'Recipient account not found' },
        { status: 400 }
      );
    }

    // Prevent transferring to the same account
    if (fromAccount.account_id === toAccount.account_id) {
      return NextResponse.json(
        { error: 'Cannot transfer to the same account' },
        { status: 400 }
      );
    }

    // Perform the transfer
    // Debit from account
    const { error: debitError } = await supabaseAdmin
      .from('accounts')
      .update({ balance: parseFloat(fromAccount.balance) - amount })
      .eq('account_id', fromAccountId);

    if (debitError) {
      throw debitError;
    }

    // Credit to account
    const { data: toAccountBalance } = await supabaseAdmin
      .from('accounts')
      .select('balance')
      .eq('account_id', toAccount.account_id)
      .single();

    const { error: creditError } = await supabaseAdmin
      .from('accounts')
      .update({ balance: parseFloat(toAccountBalance.balance) + amount })
      .eq('account_id', toAccount.account_id);

    if (creditError) {
      // Rollback debit
      await supabaseAdmin
        .from('accounts')
        .update({ balance: fromAccount.balance })
        .eq('account_id', fromAccountId);
      throw creditError;
    }

    // Get the next transaction_id
    const { data: maxTransactionId } = await supabaseAdmin
      .from('transactions')
      .select('transaction_id')
      .order('transaction_id', { ascending: false })
      .limit(1)
      .single();

    const nextTransactionId = (maxTransactionId?.transaction_id || 0) + 1;

    // Record transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        transaction_id: nextTransactionId,
        from_account_id: fromAccountId,
        to_account_id: toAccount.account_id,
        amount: amount,
        transaction_type: 'Transfer',
        description: description || `Transfer to ${toAccountNumber}`,
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Transaction record error:', transactionError);
    }

    return NextResponse.json({
      message: 'Transfer successful',
      transactionId: transaction?.transaction_id
    });

  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Transfer failed' },
      { status: 500 }
    );
  }
}