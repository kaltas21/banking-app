'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, DollarSign, Activity, Award, AlertCircle, Building2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

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
  customerLoanDistribution: Array<{
    customer_id: number;
    first_name: string;
    last_name: string;
    total_loans: number;
    pending_loans: number;
    approved_loans: number;
    rejected_loans: number;
    paid_off_loans: number;
    total_approved_amount: number;
    avg_interest_rate: number;
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
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const tabData = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
    { id: 'customers', label: 'Customer Analysis', icon: Users, color: 'from-green-500 to-green-600' },
    { id: 'loans', label: 'Loan Performance', icon: Award, color: 'from-purple-500 to-purple-600' },
    { id: 'transactions', label: 'Transaction Volume', icon: Activity, color: 'from-amber-500 to-amber-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/admin"
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-blue-300 border border-slate-600 hover:border-blue-500/50 rounded-lg transition-all duration-300"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Dashboard
                </Link>
              </motion.div>
              <motion.div 
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <BarChart3 className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Advanced Reports</h1>
                  <p className="text-slate-400">Comprehensive business analytics and insights</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Report Navigation */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-2"
          >
            <nav className="flex flex-wrap gap-2">
              {tabData.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-xl transition-all duration-300 font-semibold ${
                    selectedReport === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </motion.button>
              ))}
            </nav>
          </motion.div>

          {/* Report Content */}
          {selectedReport === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* High-Value Customers Summary */}
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 w-8 h-8 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <DollarSign className="h-4 w-4 text-white" />
                  </motion.div>
                  High-Value Customers (&gt;$75k Balance)
                </h2>
                <div className="space-y-4">
                  {reports.highValueCustomers.slice(0, 5).map((customer, index) => (
                    <motion.div
                      key={customer.customer_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex justify-between items-center p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          {customer.first_name} {customer.last_name}
                        </span>
                      </div>
                      <span className="text-green-400 font-bold">
                        ${parseFloat(customer.total_balance.toString()).toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Customer Account Types Distribution */}
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 w-8 h-8 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="h-4 w-4 text-white" />
                  </motion.div>
                  Account Types Distribution
                </h2>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-white mb-2">
                    {reports.customerAccountTypes.find(t => t.type === 'Both Types')?.count || 0}
                  </p>
                  <p className="text-slate-400">
                    Customers with both account types
                  </p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
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
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          color: '#F8FAFC'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {selectedReport === 'customers' && (
            <div className="space-y-8">
              {/* Customer Loan Distribution Analysis */}
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Award className="h-4 w-4 text-white" />
                  </motion.div>
                  Customer Loan Distribution Analysis
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-700/30 border-b border-slate-600/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Customer</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Total Loans</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Approved</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Pending</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Total Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-300">Avg Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {reports.customerLoanDistribution.slice(0, 10).map((customer, index) => (
                        <motion.tr 
                          key={customer.customer_id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-slate-700/20 transition-all duration-300"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-semibold text-xs">
                                  {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                                </span>
                              </div>
                              <span className="text-white font-medium">
                                {customer.first_name} {customer.last_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-white font-medium">{customer.total_loans}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-green-400 font-medium">{customer.approved_loans}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-amber-400 font-medium">{customer.pending_loans}</span>
                          </td>
                          <td className="px-4 py-3 text-right text-white font-bold">
                            ${parseFloat(customer.total_approved_amount.toString()).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-300">
                            {parseFloat(customer.avg_interest_rate.toString()).toFixed(1)}%
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Inactive Customers */}
              <motion.div 
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-red-600 w-8 h-8 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <AlertCircle className="h-4 w-4 text-white" />
                  </motion.div>
                  Inactive Customers (6+ months)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reports.inactiveCustomers.slice(0, 9).map((customer, index) => (
                    <motion.div
                      key={customer.customer_id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30 hover:border-red-500/30 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {customer.first_name} {customer.last_name}
                          </h4>
                          <p className="text-slate-400 text-sm">{customer.email}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-red-400 font-bold text-lg">
                          {customer.months_inactive} months
                        </span>
                        <p className="text-slate-500 text-xs">inactive</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {selectedReport === 'loans' && (
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 w-8 h-8 rounded-xl flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Award className="h-4 w-4 text-white" />
                </motion.div>
                Employee Loan Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.loanPerformance.map((employee, index) => (
                  <motion.div
                    key={employee.employee_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-700/30 p-6 rounded-2xl border border-slate-600/30 hover:border-purple-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold">
                          {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">
                          {employee.first_name} {employee.last_name}
                        </h3>
                        <p className="text-slate-400 text-sm">Loan Officer</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Approved Loans:</span>
                        <span className="text-green-400 font-bold">{employee.approved_loans_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total Value:</span>
                        <span className="text-white font-bold">
                          ${parseFloat(employee.total_approved_value.toString()).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {selectedReport === 'transactions' && (
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <motion.div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 w-8 h-8 rounded-xl flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Activity className="h-4 w-4 text-white" />
                </motion.div>
                Monthly Transaction Volume
              </h2>
                             <div className="h-96 mb-6">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={reports.monthlyTransactionVolume}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                     <XAxis 
                       dataKey="month" 
                       stroke="#9CA3AF"
                       fontSize={12}
                     />
                     <YAxis 
                       stroke="#9CA3AF"
                       fontSize={12}
                       domain={(() => {
                         const maxVolume = Math.max(...reports.monthlyTransactionVolume.map(item => item.total_volume), 0);
                         const roundedMax = Math.ceil(maxVolume * 1.1 / 10000) * 10000; // Add 10% padding and round up to nearest 10k
                         return [0, roundedMax];
                       })()}
                       tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                       ticks={(() => {
                         const maxVolume = Math.max(...reports.monthlyTransactionVolume.map(item => item.total_volume), 0);
                         const roundedMax = Math.ceil(maxVolume * 1.1 / 10000) * 10000;
                         const tickStep = roundedMax / 5;
                         return Array.from({length: 6}, (_, i) => Math.round(i * tickStep));
                       })()}
                     />
                     <Tooltip 
                       contentStyle={{
                         backgroundColor: '#1E293B',
                         border: '1px solid #334155',
                         borderRadius: '12px',
                         color: '#F8FAFC'
                       }}
                       formatter={(value: any) => [`$${value.toLocaleString()}`, 'Volume']}
                     />
                     <Legend />
                     <Bar 
                       dataKey="total_volume" 
                       fill="#3B82F6" 
                       name="Transaction Volume ($)"
                       radius={[4, 4, 0, 0]}
                     />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
              
              {/* Transaction Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reports.monthlyTransactionVolume.slice(-3).map((month, index) => (
                  <motion.div
                    key={month.month}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
                  >
                    <h4 className="text-white font-semibold mb-2">{month.month}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Volume:</span>
                        <span className="text-amber-400 font-bold">
                          ${month.total_volume.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Count:</span>
                        <span className="text-white font-medium">{month.transaction_count}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}