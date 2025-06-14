'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, DollarSign, FileText, TrendingUp, LogOut, UserCheck, BarChart3 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalCustomers: number;
  totalAccounts: number;
  totalDeposits: number;
  pendingLoans: number;
  monthlyTransactions: Array<{
    month: string;
    volume: number;
  }>;
  highValueCustomers: Array<{
    customer_id: number;
    first_name: string;
    last_name: string;
    total_balance: number;
  }>;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userType !== 'employee')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardStats();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchDashboardStats, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      const data = await response.json();
      
      if (response.ok && !data.error) {
        setStats(data);
      } else {
        console.error('Error response:', data);
        // Set default values if error
        setStats({
          totalCustomers: 0,
          totalAccounts: 0,
          totalDeposits: 0,
          pendingLoans: 0,
          monthlyTransactions: [],
          highValueCustomers: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setStats({
        totalCustomers: 0,
        totalAccounts: 0,
        totalDeposits: 0,
        pendingLoans: 0,
        monthlyTransactions: [],
        highValueCustomers: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {session?.user?.name} ({session?.user?.role})</p>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Advanced Analytics Button */}
        <div className="mb-6">
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>View Advanced Analytics</span>
          </Link>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Accounts</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalAccounts}</p>
              </div>
              <BarChart3 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deposits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.totalDeposits || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Loans</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingLoans}</p>
              </div>
              <FileText className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/loans"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Loan Approvals</h3>
                <p className="text-sm text-gray-600">Review and approve loan applications</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/customers"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900">Customer Management</h3>
                <p className="text-sm text-gray-600">View and manage customer accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Reports</h3>
                <p className="text-sm text-gray-600">View detailed analytics and reports</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Monthly Transaction Volume Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Monthly Transaction Volume
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyTransactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Transaction Volume ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* High-Value Customers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              High-Value Customers
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-right py-2 text-sm font-medium text-gray-700">Total Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.highValueCustomers.map((customer) => (
                    <tr key={customer.customer_id} className="border-b">
                      <td className="py-2 text-sm text-gray-900">
                        {customer.first_name} {customer.last_name}
                      </td>
                      <td className="py-2 text-sm text-right font-medium text-gray-900">
                        ${(customer.total_balance || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}