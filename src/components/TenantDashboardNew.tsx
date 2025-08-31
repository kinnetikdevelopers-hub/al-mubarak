import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, FileText, Phone, CreditCard, Receipt as ReceiptIcon } from 'lucide-react';
import { initiatePayment, mockPayment } from '@/pages/api/mpesa';
import ReceiptPDFGenerator from '@/components/ReceiptPDFGenerator';

interface TenantProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  unit_number: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
}

interface BillingMonth {
  id: string;
  month: string;
  year: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  amount: number;
}

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  mpesa_code?: string;
  mpesa_receipt_number?: string;
  phone_number?: string;
  full_name: string;
  unit_number: string;
}

interface PaymentReceipt {
  id: string;
  receipt_number: string;
  amount: number;
  unit_number: string;
  created_at: string;
  payment: {
    full_name: string;
    phone_number: string;
    mpesa_receipt_number: string;
    transaction_date: string;
  };
}

export default function TenantDashboardNew() {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [billingMonths, setBillingMonths] = useState<BillingMonth[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [paymentForm, setPaymentForm] = useState({
    full_name: '',
    amount: '',
    phone_number: '',
    unit_number: ''
  });
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenantData();
  }, []);

  // RESTORE YOUR ORIGINAL fetchTenantData function exactly as it was
  const fetchTenantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch from the correct 'profiles' table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setPaymentForm(prev => ({
          ...prev,
          full_name: profileData.full_name,
          unit_number: profileData.unit_number
        }));

        // Keep your original billing months fetch
        const { data: billingData } = await supabase
          .from('billing_months')
          .select('*')
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        setBillingMonths(billingData || []);

        // Keep your original payments fetch
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('tenant_id', profileData.id)
          .order('created_at', { ascending: false });

        setPayments(paymentsData || []);

        // NEW: Add receipts fetch from correct table
        const { data: receiptsData } = await supabase
          .from('receipts')
          .select(`
            *,
            payment:payments(full_name, phone_number, mpesa_receipt_number, transaction_date)
          `)
          .eq('tenant_id', profileData.id)
          .order('created_at', { ascending: false });

        setReceipts(receiptsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // RESTORE YOUR ORIGINAL submitPayment function
  const submitPayment = async (billingMonthId: string) => {
    if (!paymentForm.full_name || !paymentForm.amount || !paymentForm.phone_number || !paymentForm.unit_number) {
      toast({
        title: "Error",
        description: "Please fill in all fields including phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      const paymentData = {
        tenant_id: profile?.id!,
        billing_month_id: billingMonthId,
        full_name: paymentForm.full_name,
        unit_number: paymentForm.unit_number,
        phone_number: paymentForm.phone_number,
        amount: parseFloat(paymentForm.amount)
      };

      // CHANGE THIS LINE ONLY - switch from mockPayment to initiatePayment for real M-Pesa
      const data = await initiatePayment(paymentData);
      
      if (data.success) {
        toast({
          title: "Payment Request Sent!",
          description: "Please check your phone for M-Pesa STK push prompt",
        });
        setPaymentForm({ full_name: '', amount: '', phone_number: '', unit_number: '' });
        fetchTenantData(); // Refresh data
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center p-8">No tenant profile found.</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tenant Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {profile.full_name}</p>
      </div>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Unit:</strong> {profile.unit_number}</p>
            <p><strong>Email:</strong> {profile.email}</p>
          </div>
          <div>
            <p><strong>Monthly Rent:</strong> KES {profile.monthly_rent?.toLocaleString()}</p>
            <p><strong>Lease Period:</strong> {profile.lease_start} to {profile.lease_end}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pay Rent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Rent - M-Pesa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Full Name"
              value={paymentForm.full_name}
              onChange={(e) => setPaymentForm({...paymentForm, full_name: e.target.value})}
            />
            <Input
              placeholder="Unit Number"
              value={paymentForm.unit_number}
              onChange={(e) => setPaymentForm({...paymentForm, unit_number: e.target.value})}
            />
            <Input
              placeholder="Phone Number (254...)"
              value={paymentForm.phone_number}
              onChange={(e) => setPaymentForm({...paymentForm, phone_number: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Amount (KES)"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
            />
          </div>
          
          {billingMonths.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Select Billing Month:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {billingMonths.map((month) => (
                  <Button
                    key={month.id}
                    variant={month.status === 'paid' ? 'secondary' : 'outline'}
                    className="p-3 h-auto flex flex-col items-start"
                    onClick={() => {
                      setPaymentForm({...paymentForm, amount: month.amount.toString()});
                      submitPayment(month.id);
                    }}
                    disabled={month.status === 'paid'}
                  >
                    <span className="font-medium">{month.month} {month.year}</span>
                    <span className="text-sm">KES {month.amount.toLocaleString()}</span>
                    <Badge className={getStatusColor(month.status)}>
                      {month.status}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No payments found.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">KES {payment.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{new Date(payment.created_at).toLocaleDateString()}</p>
                    {payment.mpesa_receipt_number && (
                      <p className="text-xs text-green-600 font-mono">M-Pesa: {payment.mpesa_receipt_number}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipts Section - THIS IS THE ONLY NEW PART */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptIcon className="h-5 w-5" />
            Your Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receipts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No receipts available.</p>
          ) : (
            <div className="space-y-3">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Receipt #{receipt.receipt_number}</p>
                    <p className="text-sm text-gray-600">KES {receipt.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{new Date(receipt.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReceipt(receipt)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal - THIS IS ALSO NEW */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Receipt Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReceipt(null)}
              >
                ✕
              </Button>
            </div>
            <ReceiptPDFGenerator
              receiptData={{
                tenantName: selectedReceipt.payment.full_name,
                unitNumber: selectedReceipt.unit_number,
                amount: selectedReceipt.amount,
                receiptNumber: selectedReceipt.receipt_number,
                paymentMethod: selectedReceipt.payment.mpesa_receipt_number ? 'M-Pesa' : 'Other'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}