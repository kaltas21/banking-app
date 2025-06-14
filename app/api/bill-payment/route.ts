import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDbClient } from '@/lib/get-db-client';

export async function POST(request: Request) {
  const client = getDbClient();

  try {
    await client.connect();
    
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
    const accountsQuery = `
      SELECT account_id, balance, account_number
      FROM accounts
      WHERE account_id = $1
        AND customer_id = $2
        AND status = 'Active'
    `;
    const accountsResult = await client.query(accountsQuery, [accountId, session.user.id]);
    const accounts = accountsResult.rows;

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid account' },
        { status: 400 }
      );
    }

    const account = accounts[0];

    if (parseFloat(account.balance) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Start a transaction for atomicity
    await client.query('BEGIN');
    
    try {
      // Debit from account
      const debitQuery = `
        UPDATE accounts
        SET balance = balance - $1
        WHERE account_id = $2
      `;
      await client.query(debitQuery, [amount, accountId]);

      // Get the next payment_id
      const maxPaymentIdQuery = `
        SELECT COALESCE(MAX(payment_id), 0) + 1 as next_payment_id
        FROM billpayments
      `;
      const maxPaymentIdResult = await client.query(maxPaymentIdQuery);
      const nextPaymentId = maxPaymentIdResult.rows[0].next_payment_id;

      // Record bill payment
      const billPaymentQuery = `
        INSERT INTO billpayments (
          payment_id, account_id, biller_name, 
          biller_account_number, amount, payment_date
        )
        VALUES (
          $1, $2, $3,
          $4, $5, $6
        )
        RETURNING payment_id
      `;
      const billPaymentResult = await client.query(billPaymentQuery, [
        nextPaymentId, accountId, billerName,
        billerAccountNumber, amount, new Date().toISOString()
      ]);

      // Get the next transaction_id
      const maxTransactionIdQuery = `
        SELECT COALESCE(MAX(transaction_id), 0) + 1 as next_transaction_id
        FROM transactions
      `;
      const maxTransactionIdResult = await client.query(maxTransactionIdQuery);
      const nextTransactionId = maxTransactionIdResult.rows[0].next_transaction_id;

      // Record transaction
      const transactionQuery = `
        INSERT INTO transactions (
          transaction_id, from_account_id, to_account_id,
          amount, transaction_type, description, transaction_date
        )
        VALUES (
          $1, $2, NULL,
          $3, 'Bill Payment', 
          $4, 
          $5
        )
      `;
      await client.query(transactionQuery, [
        nextTransactionId, accountId,
        amount, 
        description || `Bill payment to ${billerName}`, 
        new Date().toISOString()
      ]);

      await client.query('COMMIT');
      
      return NextResponse.json({
        message: 'Bill payment successful',
        paymentId: billPaymentResult.rows[0].payment_id
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Bill payment error:', error);
    return NextResponse.json(
      { error: 'Bill payment failed' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}