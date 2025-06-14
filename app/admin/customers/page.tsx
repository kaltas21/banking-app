'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, User, DollarSign, Calendar, Activity, TrendingUp, AlertCircle } from 'lucide-react';

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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showDetail ? (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="all">All Customers</option>
                  <option value="high-value">High-Value Customers (&gt;$75k)</option>
                  <option value="inactive">Inactive Customers (6+ months)</option>
                  <option value="multiple-accounts">Multiple Account Holders</option>
                </select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accounts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loans
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const isInactive = customer.last_transaction_date 
                      ? Math.floor((new Date().getTime() - new Date(customer.last_transaction_date).getTime()) / (1000 * 3600 * 24)) > 180
                      : true;

                    return (
                      <tr key={customer.customer_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.first_name} {customer.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            ${parseFloat(customer.total_balance.toString()).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.accounts_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.loans_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isInactive && (
                              <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                            )}
                            <span className={`text-sm ${isInactive ? 'text-yellow-600' : 'text-gray-500'}`}>
                              {customer.last_transaction_date 
                                ? new Date(customer.last_transaction_date).toLocaleDateString()
                                : 'No activity'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => fetchCustomerDetail(customer.customer_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : selectedCustomer && (
          /* Customer Detail View */
          <div>
            <button
              onClick={() => setShowDetail(false)}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
              <ArrowLeft className="h-5 w-5 mr-1" />
              Back to List
            </button>

            {/* Customer Info Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name}
                  </h2>
                  <p className="text-gray-600">{selectedCustomer.customer.email}</p>
                  {selectedCustomer.customer.phone_number && (
                    <p className="text-gray-600">{selectedCustomer.customer.phone_number}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Customer for {selectedCustomer.customer.account_age_months} months
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ${parseFloat(selectedCustomer.customer.total_balance.toString()).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Accounts Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCustomer.accounts.map((account) => (
                  <div key={account.account_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{account.account_type} Account</p>
                        <p className="text-sm text-gray-500">{account.account_number}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                    <p className="text-xl font-semibold mt-2">
                      ${parseFloat(account.balance.toString()).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Cash Flow</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Month</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Money In</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Money Out</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-700">Net Flow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCustomer.monthlyActivity.map((month) => {
                      const netFlow = month.total_in - month.total_out;
                      return (
                        <tr key={month.month} className="border-b">
                          <td className="py-2 text-sm text-gray-900">{month.month}</td>
                          <td className="py-2 text-sm text-right text-green-600">
                            +${month.total_in.toLocaleString()}
                          </td>
                          <td className="py-2 text-sm text-right text-red-600">
                            -${month.total_out.toLocaleString()}
                          </td>
                          <td className={`py-2 text-sm text-right font-medium ${
                            netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Loans Section */}
            {selectedCustomer.loans.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Loans</h3>
                <div className="space-y-4">
                  {selectedCustomer.loans.map((loan) => (
                    <div key={loan.loan_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            ${parseFloat(loan.loan_amount.toString()).toLocaleString()} Loan
                          </p>
                          <p className="text-sm text-gray-500">
                            {loan.term_months} months @ {loan.interest_rate}%
                          </p>
                          <p className="text-sm text-gray-500">
                            Applied: {new Date(loan.application_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          loan.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          loan.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          loan.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}