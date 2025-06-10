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
    const { accountId, billerName, billerAccountNumber, amount, description } = body;

    // Validate input
    if (!accountId || !billerName || !billerAccountNumber || !amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid payment details' },
        { status: 400 }
      );
    }

    // Verify account belongs to user and has sufficient balance
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('account_id, balance, account_number')
      .eq('account_id', accountId)
      .eq('customer_id', session.user.id)
      .eq('status', 'Active')
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Invalid account' },
        { status: 400 }
      );
    }

    if (parseFloat(account.balance) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Debit from account
    const { error: debitError } = await supabaseAdmin
      .from('accounts')
      .update({ balance: parseFloat(account.balance) - amount })
      .eq('account_id', accountId);

    if (debitError) {
      throw debitError;
    }

    // Get the next payment_id
    const { data: maxPaymentId } = await supabaseAdmin
      .from('billpayments')
      .select('payment_id')
      .order('payment_id', { ascending: false })
      .limit(1)
      .single();

    const nextPaymentId = (maxPaymentId?.payment_id || 0) + 1;

    // Record bill payment
    const { data: billPayment, error: billError } = await supabaseAdmin
      .from('billpayments')
      .insert({
        payment_id: nextPaymentId,
        account_id: accountId,
        biller_name: billerName,
        biller_account_number: billerAccountNumber,
        amount: amount,
        payment_date: new Date().toISOString()
      })
      .select()
      .single();

    if (billError) {
      console.error('Bill payment error:', billError);
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
    const { error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        transaction_id: nextTransactionId,
        from_account_id: accountId,
        to_account_id: null,
        amount: amount,
        transaction_type: 'Bill Payment',
        description: description || `Bill payment to ${billerName}`,
        transaction_date: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Transaction record error:', transactionError);
    }

    return NextResponse.json({
      message: 'Bill payment successful',
      paymentId: billPayment?.payment_id
    });

  } catch (error) {
    console.error('Bill payment error:', error);
    return NextResponse.json(
      { error: 'Bill payment failed' },
      { status: 500 }
    );
  }
}