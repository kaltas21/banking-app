'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  BarChart3,
  Target,
  AlertCircle,
  Activity
} from 'lucide-react';

interface AdvancedAnalyticsData {
  aboveAverageCustomers: any[];
  monthlyPatterns: any[];
  topAccounts: any[];
  loanRiskAnalysis: any[];
  customerSegmentation: any[];
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/advanced-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-20 bg-gray-200" />
            <CardContent className="h-32 bg-gray-100" />
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return <div>Failed to load analytics</div>;
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'bg-green-100 text-green-800';
      case 'Medium Risk': return 'bg-yellow-100 text-yellow-800';
      case 'High Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSegmentIcon = (segment: string) => {
    if (segment.includes('Premium')) return <TrendingUp className="h-5 w-5 text-purple-600" />;
    if (segment.includes('High')) return <DollarSign className="h-5 w-5 text-green-600" />;
    if (segment.includes('Regular')) return <Users className="h-5 w-5 text-blue-600" />;
    if (segment.includes('Inactive')) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Activity className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        Advanced Banking Analytics
      </h2>

      {/* Above Average Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            High-Value Customers (Above Average Balance)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Total Balance</th>
                  <th className="text-right py-2">Accounts</th>
                </tr>
              </thead>
              <tbody>
                {analytics.aboveAverageCustomers.slice(0, 10).map((customer, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2">
                      <div>
                        <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                    </td>
                    <td className="text-right py-2 font-bold">
                      ${parseFloat(customer.total_balance).toFixed(2)}
                    </td>
                    <td className="text-right py-2">
                      {customer.account_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Transaction Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Monthly Transaction Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(
              analytics.monthlyPatterns.reduce((acc: any, item: any) => {
                if (!acc[item.month]) acc[item.month] = [];
                acc[item.month].push(item);
                return acc;
              }, {})
            ).slice(0, 6).map(([month, patterns]: [string, any]) => (
              <div key={month} className="border-b pb-3 last:border-0">
                <h4 className="font-medium mb-2">{month}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {patterns.map((pattern: any, idx: number) => (
                    <div key={idx}>
                      <p className="text-gray-600">{pattern.transaction_type}</p>
                      <p className="font-medium">{pattern.transaction_count} txns</p>
                      <p className="text-xs">${parseFloat(pattern.total_amount).toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Active Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Most Active Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topAccounts.slice(0, 5).map((account, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{account.first_name} {account.last_name}</p>
                    <p className="text-sm text-gray-600">{account.account_number}</p>
                    <Badge variant="outline" className="mt-1">
                      {account.account_type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${parseFloat(account.balance).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{account.transaction_count} transactions</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Net Flow:</span>
                  <span className={parseFloat(account.net_flow) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${parseFloat(account.net_flow).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loan Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Loan Portfolio Risk Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.loanRiskAnalysis.map((analysis, idx) => (
              <div key={idx} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="font-medium">{analysis.loan_status}</p>
                    <Badge className={getRiskColor(analysis.risk_category)}>
                      {analysis.risk_category}
                    </Badge>
                  </div>
                  <p className="font-bold text-lg">${parseFloat(analysis.total_amount).toFixed(0)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Loans: </span>
                    <span className="font-medium">{analysis.total_loans}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Customers: </span>
                    <span className="font-medium">{analysis.unique_customers}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Amount: </span>
                    <span className="font-medium">${parseFloat(analysis.avg_loan_amount).toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Rate: </span>
                    <span className="font-medium">{parseFloat(analysis.avg_interest_rate).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Segmentation */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Segmentation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.customerSegmentation.map((segment, idx) => {
              const maxCount = Math.max(...analytics.customerSegmentation.map(s => s.customer_count));
              const percentage = (segment.customer_count / maxCount) * 100;
              
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSegmentIcon(segment.customer_segment)}
                      <span className="font-medium">{segment.customer_segment}</span>
                    </div>
                    <span className="text-sm font-bold">{segment.customer_count} customers</span>
                  </div>
                  <Progress value={percentage} className="h-2 mb-2" />
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Avg Balance: </span>
                      <span className="font-medium">${parseFloat(segment.avg_balance || '0').toFixed(0)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Accounts: </span>
                      <span className="font-medium">{parseFloat(segment.avg_accounts || '0').toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Loans: </span>
                      <span className="font-medium">{parseFloat(segment.avg_loans || '0').toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Loans: </span>
                      <span className="font-medium">${parseFloat(segment.total_loans_value || '0').toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}