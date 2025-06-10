import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
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
    const { data: existingUser } = await supabaseAdmin
      .from('customers')
      .select('customer_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Get the next customer_id
    const { data: maxIdResult } = await supabaseAdmin
      .from('customers')
      .select('customer_id')
      .order('customer_id', { ascending: false })
      .limit(1)
      .single();

    const nextCustomerId = (maxIdResult?.customer_id || 0) + 1;

    // Insert new customer with plain text password
    const { data: newCustomer, error: insertError } = await supabaseAdmin
      .from('customers')
      .insert({
        customer_id: nextCustomerId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        password: password, // Using plain text password
        phone_number: phoneNumber || null,
        address: address || null,
        date_of_birth: dateOfBirth || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const customerId = newCustomer.customer_id;

    // Generate account numbers
    const checkingAccountNumber = `CHK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const savingsAccountNumber = `SAV${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Get the next account_id for checking account
    const { data: maxCheckingId } = await supabaseAdmin
      .from('accounts')
      .select('account_id')
      .order('account_id', { ascending: false })
      .limit(1)
      .single();

    const nextCheckingAccountId = (maxCheckingId?.account_id || 0) + 1;

    // Create checking account
    const { error: checkingError } = await supabaseAdmin
      .from('accounts')
      .insert({
        account_id: nextCheckingAccountId,
        customer_id: customerId,
        account_number: checkingAccountNumber,
        account_type: 'Checking',
        balance: 0.00,
        status: 'Active'
      });

    if (checkingError) {
      console.error('Checking account error:', checkingError);
      throw checkingError;
    }

    // Get the next account_id for savings account
    const { data: maxSavingsId } = await supabaseAdmin
      .from('accounts')
      .select('account_id')
      .order('account_id', { ascending: false })
      .limit(1)
      .single();

    const nextSavingsAccountId = (maxSavingsId?.account_id || 0) + 1;

    // Create savings account
    const { error: savingsError } = await supabaseAdmin
      .from('accounts')
      .insert({
        account_id: nextSavingsAccountId,
        customer_id: customerId,
        account_number: savingsAccountNumber,
        account_type: 'Savings',
        balance: 0.00,
        status: 'Active'
      });

    if (savingsError) {
      console.error('Savings account error:', savingsError);
      throw savingsError;
    }

    return NextResponse.json(
      { message: 'Registration successful', customerId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}