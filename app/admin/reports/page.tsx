'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, DollarSign, Activity, Award, AlertCircle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportsData {
  highValueCustomers: Array<{
    customer_id: number;
    first_name: string;
    last_name: string;
    total_balance: number;
  }>;
  inactiveCustomers: Array<{
    customer_id: number;
    first_name: string;
    last_name: string;
    email: string;
    months_inactive: number;
  }>;
  loanPerformance: Array<{
    employee_id: number;
    first_name: string;
    last_name: string;
    approved_loans_count: number;
    total_approved_value: number;
  }>;
  customerAccountTypes: Array<{
    type: string;
    count: number;
  }>;
  monthlyTransactionVolume: Array<{
    month: string;
    total_volume: number;
    transaction_count: number;
  }>;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'overview' | 'customers' | 'loans' | 'transactions'>('overview');

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userType !== 'employee')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReports();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchReports, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/admin/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reports) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Advanced Reports</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Navigation */}
        <div className="bg-white rounded-lg shadow p-1 mb-8">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'customers', label: 'Customer Analysis', icon: Users },
              { id: 'loans', label: 'Loan Performance', icon: Award },
              { id: 'transactions', label: 'Transaction Volume', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedReport(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  selectedReport === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        {selectedReport === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* High-Value Customers Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                High-Value Customers (>$75k with Active Loans)
              </h2>
              <div className="space-y-3">
                {reports.highValueCustomers.slice(0, 5).map((customer) => (
                  <div key={customer.customer_id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">
                      {customer.first_name} {customer.last_name}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      ${parseFloat(customer.total_balance.toString()).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Account Types Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Customer Account Types Distribution
              </h2>
              <p className="text-3xl font-bold text-gray-900 mb-2">
                {reports.customerAccountTypes.find(t => t.type === 'Both Types')?.count || 0}
              </p>
              <p className="text-sm text-gray-600">
                Customers holding both Checking and Savings accounts
              </p>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={reports.customerAccountTypes.filter(t => t.count > 0)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={(entry) => `${entry.type}: ${entry.count}`}
                    >
                      {reports.customerAccountTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'customers' && (
          <div className="space-y-8">
            {/* High-Value Customers Detailed */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                High-Value Customers Analysis
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Balance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.highValueCustomers.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          ${parseFloat(customer.total_balance.toString()).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            VIP Customer
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inactive Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                Inactive Customers (No transactions in 6+ months)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Months Inactive
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.inactiveCustomers.map((customer) => (
                      <tr key={customer.customer_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-yellow-600">
                          {customer.months_inactive} months
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'loans' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Loan Officer Performance
            </h2>
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan Officer
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Approved Loans
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value Approved
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.loanPerformance.map((officer) => (
                      <tr key={officer.employee_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {officer.first_name} {officer.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {officer.approved_loans_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          ${parseFloat(officer.total_approved_value.toString()).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8">
                <h3 className="text-md font-medium text-gray-900 mb-4">Approval Volume by Officer</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reports.loanPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="first_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="approved_loans_count" fill="#3B82F6" name="Number of Loans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {selectedReport === 'transactions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Transaction Volume
            </h2>
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={reports.monthlyTransactionVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total_volume" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Total Volume ($)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="transaction_count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Transaction Count"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Average Monthly Volume</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${(reports.monthlyTransactionVolume.reduce((sum, m) => sum + parseFloat(m.total_volume.toString()), 0) / reports.monthlyTransactionVolume.length).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {reports.monthlyTransactionVolume.reduce((sum, m) => sum + m.transaction_count, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600">Average Transaction Size</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ${(reports.monthlyTransactionVolume.reduce((sum, m) => sum + parseFloat(m.total_volume.toString()), 0) / 
                       reports.monthlyTransactionVolume.reduce((sum, m) => sum + m.transaction_count, 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}