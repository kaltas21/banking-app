import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/get-db-client';

export async function POST(request: Request) {
  const client = getDbClient();

  try {
    await client.connect();
    
    const body = await request.json();
    const { firstName, lastName, email, password, phoneNumber, address, dateOfBirth } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsersQuery = `
      SELECT customer_id
      FROM customers
      WHERE email = $1
    `;
    const existingUsersResult = await client.query(existingUsersQuery, [email]);
    const existingUsers = existingUsersResult.rows;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Use a transaction to ensure data consistency
    await client.query('BEGIN');
    
    try {
      // Get the next customer_id
      const maxIdQuery = `
        SELECT COALESCE(MAX(customer_id), 0) + 1 as next_customer_id
        FROM customers
      `;
      const maxIdResult = await client.query(maxIdQuery);
      const nextCustomerId = maxIdResult.rows[0].next_customer_id;

      // Insert new customer with plain text password
      const newCustomerQuery = `
        INSERT INTO customers (
          customer_id, first_name, last_name, email,
          password, phone_number, address, date_of_birth
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )
        RETURNING customer_id
      `;
      const newCustomerResult = await client.query(newCustomerQuery, [
        nextCustomerId, firstName, lastName, email,
        password, phoneNumber || null, address || null, dateOfBirth || null
      ]);

      const customerId = newCustomerResult.rows[0].customer_id;

      // Generate account numbers
      const checkingAccountNumber = `CHK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const savingsAccountNumber = `SAV${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Get the next account_id for checking account
      const maxCheckingIdQuery = `
        SELECT COALESCE(MAX(account_id), 0) + 1 as next_account_id
        FROM accounts
      `;
      const maxCheckingIdResult = await client.query(maxCheckingIdQuery);
      const nextCheckingAccountId = maxCheckingIdResult.rows[0].next_account_id;

      // Create checking account
      const createCheckingQuery = `
        INSERT INTO accounts (
          account_id, customer_id, account_number,
          account_type, balance, status
        )
        VALUES (
          $1, $2, $3,
          'Checking', 0.00, 'Active'
        )
      `;
      await client.query(createCheckingQuery, [
        nextCheckingAccountId, customerId, checkingAccountNumber
      ]);

      // Get the next account_id for savings account
      const nextSavingsAccountId = nextCheckingAccountId + 1;

      // Create savings account
      const createSavingsQuery = `
        INSERT INTO accounts (
          account_id, customer_id, account_number,
          account_type, balance, status
        )
        VALUES (
          $1, $2, $3,
          'Savings', 0.00, 'Active'
        )
      `;
      await client.query(createSavingsQuery, [
        nextSavingsAccountId, customerId, savingsAccountNumber
      ]);

      await client.query('COMMIT');
      
      return NextResponse.json(
        { message: 'Registration successful', customerId },
        { status: 201 }
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}