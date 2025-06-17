'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, DollarSign, FileText, TrendingUp, LogOut, UserCheck, BarChart3, Building2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
          <div className="flex justify-between items-center">
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.png"
                  alt="MK Bank Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400">Welcome, {session?.user?.name} ({session?.user?.role})</p>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white border border-slate-600/50 hover:border-slate-500/50 rounded-xl transition-all duration-300 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </motion.button>
            </motion.div>
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
          {/* Advanced Analytics Button */}
          <motion.div variants={itemVariants}>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
            >
              <BarChart3 className="h-5 w-5" />
              <span>View Advanced Analytics</span>
            </Link>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
          >
            <motion.div 
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
              }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Total Customers</p>
                  <p className="text-3xl font-bold text-white">{stats.totalCustomers}</p>
                </div>
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Users className="h-7 w-7 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
              }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-green-500/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Total Accounts</p>
                  <p className="text-3xl font-bold text-white">{stats.totalAccounts}</p>
                </div>
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-green-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <BarChart3 className="h-7 w-7 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
              }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Total Deposits</p>
                  <p className="text-3xl font-bold text-white">
                    ${(stats.totalDeposits || 0).toLocaleString()}
                  </p>
                </div>
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <DollarSign className="h-7 w-7 text-white" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
              }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-2">Pending Loans</p>
                  <p className="text-3xl font-bold text-white">{stats.pendingLoans}</p>
                </div>
                <motion.div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <FileText className="h-7 w-7 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <Link
                href="/admin/loans"
                className="block bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/30 transition-all duration-500 group"
              >
                <motion.div 
                  className="flex items-center space-x-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <UserCheck className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">Loan Approvals</h3>
                    <p className="text-sm text-slate-400">Review and approve loan applications</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link
                href="/admin/customers"
                className="block bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-green-500/30 transition-all duration-500 group"
              >
                <motion.div 
                  className="flex items-center space-x-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors duration-300">Customer Management</h3>
                    <p className="text-sm text-slate-400">View and manage customer accounts</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link
                href="/admin/reports"
                className="block bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/30 transition-all duration-500 group"
              >
                <motion.div 
                  className="flex items-center space-x-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors duration-300">Reports</h3>
                    <p className="text-sm text-slate-400">View detailed analytics and reports</p>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Transaction Volume */}
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
                  <TrendingUp className="h-4 w-4 text-white" />
                </motion.div>
                Monthly Transaction Volume
              </h2>
              {stats.monthlyTransactions.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyTransactions}>
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
                          const maxVolume = Math.max(...stats.monthlyTransactions.map(item => item.volume), 0);
                          const roundedMax = Math.ceil(maxVolume * 1.1 / 10000) * 10000; // Add 10% padding and round up to nearest 10k
                          return [0, roundedMax];
                        })()}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        ticks={(() => {
                          const maxVolume = Math.max(...stats.monthlyTransactions.map(item => item.volume), 0);
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
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-slate-400">
                  No transaction data available
                </div>
              )}
            </motion.div>

            {/* High-Value Customers */}
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
                  <DollarSign className="h-4 w-4 text-white" />
                </motion.div>
                High-Value Customers
              </h2>
              <div className="space-y-4">
                {stats.highValueCustomers.length > 0 ? (
                  stats.highValueCustomers.slice(0, 8).map((customer, index) => (
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
                        <div>
                          <span className="text-white font-medium">
                            {customer.first_name} {customer.last_name}
                          </span>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold">
                        ${parseFloat(customer.total_balance.toString()).toLocaleString()}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    No high-value customer data available
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}