'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, AlertCircle, Users, DollarSign, Building2, CreditCard, Calendar, TrendingUp, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface Customer {
  customer_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  total_balance: number;
  accounts_count: number;
  loans_count: number;
  last_transaction_date: string;
  account_age_months: number;
}

interface CustomerDetail {
  customer: Customer;
  accounts: Array<{
    account_id: number;
    account_number: string;
    account_type: string;
    balance: number;
    status: string;
  }>;
  loans: Array<{
    loan_id: number;
    loan_amount: number;
    interest_rate: number;
    term_months: number;
    status: string;
    application_date: string;
  }>;
  monthlyActivity: Array<{
    month: string;
    total_in: number;
    total_out: number;
  }>;
}

export default function CustomerManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high-value' | 'inactive' | 'multiple-accounts'>('all');
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.userType !== 'employee')) {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCustomers();
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchCustomers, 30000);
      return () => clearInterval(interval);
    }
  }, [status, session, router]);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, filterType, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetail = async (customerId: number) => {
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setSelectedCustomer(data);
      setShowDetail(true);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'high-value':
        filtered = filtered.filter(c => c.total_balance > 75000);
        break;
      case 'inactive':
        filtered = filtered.filter(c => {
          const daysSinceLastTransaction = c.last_transaction_date 
            ? Math.floor((new Date().getTime() - new Date(c.last_transaction_date).getTime()) / (1000 * 3600 * 24))
            : Infinity;
          return daysSinceLastTransaction > 180;
        });
        break;
      case 'multiple-accounts':
        filtered = filtered.filter(c => c.accounts_count > 2);
        break;
    }

    setFilteredCustomers(filtered);
  };

  if (loading) {
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
        staggerChildren: 0.05
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
                  className="bg-gradient-to-r from-green-500 to-green-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Users className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Customer Management</h1>
                  <p className="text-slate-400">Monitor and manage customer accounts</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showDetail ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Filters */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <Filter className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Search & Filter</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 backdrop-blur-sm transition-all duration-300"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white backdrop-blur-sm transition-all duration-300"
                >
                  <option value="all" className="bg-slate-800">All Customers</option>
                  <option value="high-value" className="bg-slate-800">High-Value Customers (&gt;$75k)</option>
                  <option value="inactive" className="bg-slate-800">Inactive Customers (6+ months)</option>
                  <option value="multiple-accounts" className="bg-slate-800">Multiple Account Holders</option>
                </select>
              </div>
              <div className="mt-4 text-sm text-slate-400">
                Showing {filteredCustomers.length} of {customers.length} customers
              </div>
            </motion.div>

            {/* Customers Table */}
            <motion.div 
              variants={itemVariants}
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-700/30 border-b border-slate-600/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Total Balance</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Accounts</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Loans</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Last Activity</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredCustomers.map((customer, index) => (
                      <motion.tr 
                        key={customer.customer_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-700/20 transition-all duration-300"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {customer.first_name} {customer.last_name}
                              </p>
                              <p className="text-slate-400 text-sm">{customer.email}</p>
                              <p className="text-slate-500 text-xs">{customer.phone_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-lg font-bold ${
                            customer.total_balance > 75000 
                              ? 'text-green-400' 
                              : customer.total_balance > 25000 
                                ? 'text-blue-400' 
                                : 'text-slate-300'
                          }`}>
                            ${customer.total_balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Building2 className="h-4 w-4 text-blue-400" />
                            <span className="text-white font-medium">{customer.accounts_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <CreditCard className="h-4 w-4 text-purple-400" />
                            <span className="text-white font-medium">{customer.loans_count}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {customer.last_transaction_date ? (
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Calendar className="h-4 w-4 text-amber-400" />
                                <span className="text-slate-300 text-sm">
                                  {new Date(customer.last_transaction_date).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500">
                                {Math.floor((new Date().getTime() - new Date(customer.last_transaction_date).getTime()) / (1000 * 3600 * 24))} days ago
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">No activity</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <motion.button
                            onClick={() => fetchCustomerDetail(customer.customer_id)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-blue-500/25"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Details
                          </motion.button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-400 mb-2">No customers found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          /* Customer Detail View */
          selectedCustomer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Back Button and Customer Header */}
              <div className="flex items-center justify-between">
                <motion.button
                  onClick={() => setShowDetail(false)}
                  className="flex items-center px-4 py-2 text-blue-400 hover:text-blue-300 border border-slate-600 hover:border-blue-500/50 rounded-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Customers
                </motion.button>
                <div className="text-right">
                  <h1 className="text-2xl font-bold text-white">
                    {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}
                  </h1>
                  <p className="text-slate-400">{selectedCustomer.customer.email}</p>
                </div>
              </div>

              {/* Customer Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div 
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="h-8 w-8 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Total Balance</h3>
                      <p className="text-slate-400 text-sm">Across all accounts</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-green-400">
                    ${selectedCustomer.customer.total_balance.toLocaleString()}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-8 w-8 text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Accounts</h3>
                      <p className="text-slate-400 text-sm">Active accounts</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-blue-400">
                    {selectedCustomer.customer.accounts_count}
                  </p>
                </motion.div>

                <motion.div 
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="h-8 w-8 text-purple-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">Loans</h3>
                      <p className="text-slate-400 text-sm">Active loans</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {selectedCustomer.customer.loans_count}
                  </p>
                </motion.div>
              </div>

              {/* Accounts Section */}
              <motion.div 
                className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-blue-400" />
                  Customer Accounts
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCustomer.accounts.map((account, index) => (
                    <motion.div 
                      key={account.account_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{account.account_type}</h4>
                          <p className="text-slate-400 text-sm font-mono">{account.account_number}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          account.status === 'Active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        }`}>
                          {account.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        ${account.balance.toLocaleString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Loans Section */}
              {selectedCustomer.loans.length > 0 && (
                <motion.div 
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-purple-400" />
                    Customer Loans
                  </h2>
                  <div className="space-y-4">
                    {selectedCustomer.loans.map((loan, index) => (
                      <motion.div 
                        key={loan.loan_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-white">
                              ${loan.loan_amount.toLocaleString()} Loan
                            </h4>
                            <p className="text-slate-400 text-sm">
                              {loan.term_months} months @ {loan.interest_rate}%
                            </p>
                            <p className="text-slate-500 text-xs">
                              Applied: {new Date(loan.application_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            loan.status === 'Approved' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : loan.status === 'Pending'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Monthly Activity Chart */}
              {selectedCustomer.monthlyActivity.length > 0 && (
                <motion.div 
                  className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-amber-400" />
                    Monthly Activity
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedCustomer.monthlyActivity.map((activity, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/30"
                      >
                        <h4 className="font-semibold text-white mb-2">{activity.month}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Inflow:</span>
                            <span className="text-green-400 font-medium">
                              ${activity.total_in.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400 text-sm">Outflow:</span>
                            <span className="text-red-400 font-medium">
                              ${activity.total_out.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        )}
      </main>
    </div>
  );
}