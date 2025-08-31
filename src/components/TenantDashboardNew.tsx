import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, Download, Phone, Calendar, DollarSign, Home, User, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReceiptPDFGenerator from '@/components/ReceiptPDFGenerator';

const TenantDashboardNew = () => {
  const [tenantData, setTenantData] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user");
        setLoading(false);
        return;
      }

      console.log("Fetching data for user:", user.id);

      // Fetch profile from profiles table using id column
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile fetch error:', profileError);
        toast({
          title: "Error",
          description: "Could not fetch tenant profile",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log("Profile data:", profile);
      setTenantData(profile);

      // Fetch unit data where tenant_id matches profile.id
      const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', profile.id)
        .single();

      if (unit && !unitError) {
        console.log("Unit data:", unit);
        setUnitData(unit);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          billing_months(month, year)
        `)
        .eq('tenant_id', profile.id)
        .order('created_at', { ascending: false });

      if (!paymentsError && paymentsData) {
        setPayments(paymentsData);
      }

    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    if (!phoneNumber || !amount || !tenantData) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setPaymentLoading(true);

    try {
      const response = await fetch('/api/mpesa-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          amount: parseFloat(amount),
          tenantId: tenantData.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Payment Initiated",
          description: "Please check your phone for M-Pesa prompt",
        });
        setPhoneNumber('');
        setAmount('');
        // Refresh payments after successful initiation
        setTimeout(fetchTenantData, 3000);
      } else {
        toast({
          title: "Payment Error",
          description: result.error || "Failed to initiate payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleViewReceipt = (payment) => {
    const receiptData = {
      receiptNumber: `ALM-${payment.id.slice(0, 8)}`,
      tenantName: `${tenantData?.first_name || ''} ${tenantData?.last_name || ''}`.trim(),
      unitNumber: unitData?.unit_number || 'N/A',
      amount: payment.amount,
      paymentDate: payment.created_at,
      paymentMethod: 'M-Pesa',
      mpesaCode: payment.mpesa_receipt_number || payment.mpesa_code || 'N/A',
      monthYear: payment.billing_months ? 
        `${getMonthName(payment.billing_months.month)} ${payment.billing_months.year}` : 
        'N/A'
    };
    setSelectedReceipt(receiptData);
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="text-center p-6">
            <p className="text-red-600">No tenant profile found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {tenantData.first_name} {tenantData.last_name}
          </h1>
          <p className="text-gray-600 mt-2">Tenant Dashboard</p>
        </div>

        {/* Tenant Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{tenantData.first_name} {tenantData.last_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{tenantData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{tenantData.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Home className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Unit</p>
                  <p className="font-medium">{unitData?.unit_number || 'Not assigned'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unit Details Card */}
        {unitData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Unit Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Unit Number</p>
                  <p className="font-medium">{unitData.unit_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="font-medium">{unitData.floor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bedrooms</p>
                  <p className="font-medium">{unitData.bedrooms}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Rent</p>
                  <p className="font-medium text-green-600">
                    KSh {unitData.rent_amount?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Make Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="254712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (KSh)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={initiatePayment}
                  disabled={paymentLoading}
                  className="w-full"
                >
                  {paymentLoading ? 'Processing...' : 'Pay with M-Pesa'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payments found</p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          KSh {payment.amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.billing_months ? 
                            `${getMonthName(payment.billing_months.month)} ${payment.billing_months.year}` : 
                            'Payment'
                          }
                        </p>
                      </div>
                      <div>
                        <Badge variant={payment.status === 'completed' ? 'success' : 'secondary'}>
                          {payment.status || 'pending'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                      {payment.status === 'completed' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReceipt(payment)}
                            >
                              <Receipt className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Payment Receipt</DialogTitle>
                            </DialogHeader>
                            {selectedReceipt && (
                              <ReceiptPDFGenerator receiptData={selectedReceipt} />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantDashboardNew;