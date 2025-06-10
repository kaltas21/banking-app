'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Send, FileText, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Account {
  account_id: number;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
}

interface Transaction {
  transaction_id: number;
  from_account_id: number;
  to_account_id: number;
  amount: number;
  transaction_type: string;
  description: string;
  transaction_date: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.id) {
      fetchDashboardData();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch accounts
      const accountsRes = await fetch('/api/accounts');
      const accountsData = await accountsRes.json();
      
      // Check if accountsData is an array, if not (error case), set empty array
      if (Array.isArray(accountsData)) {
        setAccounts(accountsData);
      } else {
        console.error('Invalid accounts data:', accountsData);
        setAccounts([]);
      }

      // Fetch recent transactions
      const transactionsRes = await fetch('/api/transactions?limit=5');
      const transactionsData = await transactionsRes.json();
      
      // Check if transactionsData is an array
      if (Array.isArray(transactionsData)) {
        setTransactions(transactionsData);
      } else {
        console.error('Invalid transactions data:', transactionsData);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setAccounts([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = Array.isArray(accounts) 
    ? accounts.reduce((sum, account) => sum + parseFloat(account.balance?.toString() || '0'), 0)
    : 0;

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {session?.user?.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Account Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.length === 0 ? (
              <div className="col-span-3 bg-white p-6 rounded-lg shadow text-center">
                <p className="text-gray-600">No accounts found. Please contact support.</p>
              </div>
            ) : (
              accounts.map((account) => (
              <Link
                key={account.account_id}
                href={`/accounts/${account.account_id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{account.account_type} Account</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    account.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {account.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{account.account_number}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(account.balance.toString()).toFixed(2)}
                </p>
              </Link>
            )))}
            
            {/* Total Balance Card */}
            {accounts.length > 0 && (
              <div className="bg-blue-600 text-white p-6 rounded-lg shadow">
                <h3 className="font-medium mb-2">Total Balance</h3>
                <p className="text-3xl font-bold">${totalBalance.toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/transfer"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center space-x-4"
            >
              <Send className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Transfer Money</h3>
                <p className="text-sm text-gray-600">Send money between accounts</p>
              </div>
            </Link>
            
            <Link
              href="/transfer?type=bill"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center space-x-4"
            >
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Pay Bills</h3>
                <p className="text-sm text-gray-600">Pay your bills online</p>
              </div>
            </Link>
            
            <Link
              href="/loans"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow flex items-center space-x-4"
            >
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium">Apply for Loan</h3>
                <p className="text-sm text-gray-600">Request a personal loan</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.transaction_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.transaction_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={transaction.to_account_id === accounts[0]?.account_id ? 'text-green-600' : 'text-red-600'}>
                        {transaction.to_account_id === accounts[0]?.account_id ? '+' : '-'}
                        ${parseFloat(transaction.amount.toString()).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}