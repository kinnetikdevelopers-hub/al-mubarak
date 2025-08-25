import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp,
  PieChart as PieChartIcon,
  Calendar,
  Download
} from 'lucide-react';
import { PieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie } from 'recharts';
import { Button } from '@/components/ui/button';
import PDFGenerator from '../PDFGenerator';
import { useRef } from 'react';

const ReportsManagementUpdated = () => {
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [payments, setPayments] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
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

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('status', 'occupied');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
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

      // Calculate stats based on occupied units
      const totalExpected = units.reduce((sum, unit) => sum + (unit.rent_amount || 0), 0);
      const paidPayments = payments.filter(p => p.status === 'paid');
      const partialPayments = payments.filter(p => p.status === 'partial');
      const pendingPayments = payments.filter(p => p.status === 'pending');
      
      const totalCollected = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + 
                           partialPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedMonth && units.length > 0) {
      fetchPaymentStats(selectedMonth);
    }
  }, [selectedMonth, units]);

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Enhanced pie chart data with proper colors
  const pieData = [
    { 
      name: 'Expected Rent', 
      value: stats.totalExpected, 
      color: '#3b82f6',
      percentage: 100
    },
    { 
      name: 'Collected Rent', 
      value: stats.totalCollected, 
      color: '#10b981',
      percentage: stats.totalExpected > 0 ? (stats.totalCollected / stats.totalExpected) * 100 : 0
    },
    { 
      name: 'Pending Rent', 
      value: stats.totalExpected - stats.totalCollected, 
      color: '#f59e0b',
      percentage: stats.totalExpected > 0 ? ((stats.totalExpected - stats.totalCollected) / stats.totalExpected) * 100 : 0
    }
  ];

  // Custom label function for pie chart
  const renderLabel = (entry: any) => {
    return `${entry.name}: KES ${entry.value.toLocaleString()} (${entry.percentage.toFixed(1)}%)`;
  };

  // Bar chart data
  const barData = [
    {
      name: 'Expected',
      amount: stats.totalExpected,
      color: '#3b82f6'
    },
    {
      name: 'Collected',
      amount: stats.totalCollected,
      color: '#10b981'
    },
    {
      name: 'Pending',
      amount: stats.totalPending,
      color: '#f59e0b'
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
        <PDFGenerator 
          contentRef={pdfContentRef}
          fileName="financial-report"
          disabled={!selectedMonth}
        />
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
        <div ref={pdfContentRef} className="space-y-6">
          {/* PDF Header for export */}
          <div className="print:block hidden mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">Financial Report</h1>
            <p className="text-center text-muted-foreground">
              {billingMonths.find(m => m.id === selectedMonth) && 
                `${getMonthName(billingMonths.find(m => m.id === selectedMonth)?.month)} ${billingMonths.find(m => m.id === selectedMonth)?.year}`
              }
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Rent</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">KES {stats.totalExpected.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total rental income target</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collected Rent</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">KES {stats.totalCollected.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Successfully collected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Rent</CardTitle>
                <Calendar className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  KES {(stats.totalExpected - stats.totalCollected).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding amount</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
                <PieChartIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.collectionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Performance metric</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Enhanced Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Rent Collection Breakdown</CardTitle>
                <CardDescription>Expected vs Collected vs Pending Rent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData.filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Amount']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="flex justify-center gap-4 mt-4">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison</CardTitle>
                <CardDescription>Expected vs collected rent amounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Amount']} />
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
              <CardDescription>Detailed breakdown of all payments for this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments.map((payment) => {
                  const statusColor = payment.status === 'paid' ? 'text-success' :
                                    payment.status === 'partial' ? 'text-warning' :
                                    payment.status === 'pending' ? 'text-muted-foreground' :
                                    'text-destructive';
                  
                  return (
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
                        <p className="font-bold">KES {payment.amount.toLocaleString()}</p>
                        <p className={`text-sm ${statusColor}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {payments.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No payment data available for this month</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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

export default ReportsManagementUpdated;
