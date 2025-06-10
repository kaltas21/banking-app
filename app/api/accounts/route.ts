import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session in accounts API:', session);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('account_id, account_number, account_type, balance, status')
      .eq('customer_id', session.user.id)
      .order('account_type');

    if (error) {
      console.error('Error fetching accounts:', error);
      throw error;
    }

    console.log('Accounts data:', data);
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in accounts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}