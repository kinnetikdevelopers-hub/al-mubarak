import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp,
  PieChart,
  Calendar,
  Download
} from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';

const ReportsManagement = () => {
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    collectionRate: 0
  });

  const fetchBillingMonths = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_months')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setBillingMonths(data || []);
    } catch (error) {
      console.error('Error fetching billing months:', error);
    }
  };

  const fetchPaymentStats = async (billingMonthId: string) => {
    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('billing_month_id', billingMonthId);

      if (paymentsError) throw paymentsError;

      const payments = paymentsData || [];
      setPayments(payments);

      // Calculate stats
      const totalExpected = payments.length * 1000; // Assuming base rent of $1000
      const paidPayments = payments.filter(p => p.status === 'paid');
      const pendingPayments = payments.filter(p => p.status === 'pending');
      
      const totalCollected = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      setStats({
        totalExpected,
        totalCollected,
        totalPending,
        collectionRate
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  useEffect(() => {
    fetchBillingMonths();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchPaymentStats(selectedMonth);
    }
  }, [selectedMonth]);

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Pie chart data
  const pieData = [
    { name: 'Collected', value: stats.totalCollected, color: '#22c55e' },
    { name: 'Pending', value: stats.totalPending, color: '#f59e0b' },
    { name: 'Outstanding', value: stats.totalExpected - stats.totalCollected - stats.totalPending, color: '#ef4444' }
  ];

  // Bar chart data
  const barData = [
    {
      name: 'Expected',
      amount: stats.totalExpected
    },
    {
      name: 'Collected',
      amount: stats.totalCollected
    },
    {
      name: 'Pending',
      amount: stats.totalPending
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            Financial Reports
          </h2>
          <p className="text-muted-foreground">View detailed financial analytics and reports</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Month Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Billing Month</CardTitle>
          <CardDescription>Choose a billing period to view detailed reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select billing month" />
            </SelectTrigger>
            <SelectContent>
              {billingMonths.map((month) => (
                <SelectItem key={month.id} value={month.id}>
                  {getMonthName(month.month)} {month.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedMonth && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalExpected.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Rental income target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">${stats.totalCollected.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Successfully collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
                <Calendar className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">${stats.totalPending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <PieChart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.collectionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Performance metric</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Breakdown</CardTitle>
                <CardDescription>Distribution of rent payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <defs>
                        <filter id="shadow">
                          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      {pieData.map((entry, index) => (
                        <circle
                          key={`pie-${index}`}
                          r={index === 0 ? 80 : index === 1 ? 60 : 40}
                          fill={entry.color}
                          cx="50%"
                          cy="50%"
                        />
                      ))}
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison</CardTitle>
                <CardDescription>Expected vs actual collections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Summary</CardTitle>
              <CardDescription>Detailed breakdown of all payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{payment.full_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        M-Pesa: {payment.mpesa_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${payment.amount}</p>
                      <p className={`text-sm ${
                        payment.status === 'paid' ? 'text-success' :
                        payment.status === 'pending' ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}

                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No payment data available for this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedMonth && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Select a Billing Month</h3>
            <p className="text-muted-foreground">Choose a billing period to view detailed financial reports and analytics</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsManagement;
