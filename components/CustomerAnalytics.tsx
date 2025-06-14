'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Analytics {
  accounts: Array<{
    account_id: number;
    account_number: string;
    account_type: string;
    balance: number;
    status: string;
  }>;
  monthlyTransactionVolume: Array<{
    month: string;
    sent_count: number;
    sent_amount: number;
    received_count: number;
    received_amount: number;
    total_count: number;
    total_amount: number;
  }>;
  billerSummary: Array<{
    biller_name: string;
    biller_account_number: string;
    payment_count: number;
    total_paid: number;
    average_payment: number;
    last_payment_date: string | null;
  }>;
  loanSummary: Array<{
    status: string;
    loan_count: number;
    total_amount: number;
    average_amount: number;
    loans: Array<{
      loan_id: number;
      loan_amount: number;
      interest_rate: number;
      term_months: number;
      application_date: string;
    }>;
  }>;
  recentTransactions: Array<{
    transaction_id: number;
    date: string;
    amount: number;
    type: string;
    description: string;
    direction: string;
    from_account: { account_number: string; account_type: string } | null;
    to_account: { account_number: string; account_type: string } | null;
  }>;
}

export default function CustomerAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/customer-analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8">Loading analytics...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Your active accounts and balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.accounts.map((account) => (
              <div key={account.account_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{account.account_type}</p>
                    <p className="text-sm text-gray-500">{account.account_number}</p>
                  </div>
                  <Badge variant={account.status === 'Active' ? 'default' : 'secondary'}>
                    {account.status}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">${account.balance.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-semibold">
              Total Balance: ${analytics.accounts.reduce((sum, acc) => sum + acc.balance, 0).toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Transaction Volume */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Transaction Volume</CardTitle>
          <CardDescription>Transaction activity over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyTransactionVolume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sent_amount" stroke="#ef4444" name="Sent" />
              <Line type="monotone" dataKey="received_amount" stroke="#10b981" name="Received" />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {analytics.monthlyTransactionVolume.slice(0, 3).map((month) => (
              <div key={month.month} className="text-center">
                <p className="text-sm text-gray-500">{month.month}</p>
                <p className="font-semibold">{month.total_count} transactions</p>
                <p className="text-sm">${month.total_amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bill Payments Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Bill Payment Summary</CardTitle>
          <CardDescription>Your recurring bill payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.billerSummary.map((biller) => (
              <div key={biller.biller_name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{biller.biller_name}</h4>
                    <p className="text-sm text-gray-500">Account: {biller.biller_account_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${biller.total_paid.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{biller.payment_count} payments</p>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <p>Average payment: ${biller.average_payment.toFixed(2)}</p>
                  {biller.last_payment_date && (
                    <p>Last payment: {new Date(biller.last_payment_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loan Summary */}
      {analytics.loanSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loan Summary</CardTitle>
            <CardDescription>Your loan applications and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.loanSummary.map((group) => (
                <div key={group.status} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">{group.status} Loans</h4>
                    <Badge>{group.loan_count} loans</Badge>
                  </div>
                  <p className="text-lg font-semibold">${group.total_amount.toFixed(2)} total</p>
                  <p className="text-sm text-gray-500">Average: ${group.average_amount.toFixed(2)}</p>
                  <div className="mt-2 space-y-1">
                    {group.loans.map((loan) => (
                      <div key={loan.loan_id} className="text-sm">
                        ${loan.loan_amount.toFixed(2)} at {loan.interest_rate}% for {loan.term_months} months
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your last 30 days of activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">Type</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentTransactions.slice(0, 10).map((tx) => (
                  <tr key={tx.transaction_id} className="border-b">
                    <td className="py-2">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-2">
                      {tx.description || `${tx.type} - ${tx.direction}`}
                    </td>
                    <td className="py-2">
                      <Badge variant={tx.direction === 'Received' ? 'default' : 'secondary'}>
                        {tx.direction}
                      </Badge>
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      tx.direction === 'Received' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.direction === 'Received' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}