import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Eye
} from 'lucide-react';

const BillingManagementNew = () => {
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBillingMonth, setSelectedBillingMonth] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newBillingMonth, setNewBillingMonth] = useState({
    month: '',
    year: new Date().getFullYear(),
    payment_link: ''
  });
  const { toast } = useToast();

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
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayments = async (billingMonthId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles:tenant_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('billing_month_id', billingMonthId);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchBillingMonths();
  }, []);

  const createBillingMonth = async () => {
    try {
      // First create the billing month
      const { data: billingMonthData, error } = await supabase
        .from('billing_months')
        .insert([{
          ...newBillingMonth,
          month: parseInt(newBillingMonth.month)
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate invoices for all tenants with units
      const { data: tenantsWithUnits, error: tenantsError } = await supabase
        .from('units')
        .select(`
          tenant_id,
          unit_number,
          rent_amount,
          profiles:tenant_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .not('tenant_id', 'is', null);

      if (tenantsError) throw tenantsError;

      // Generate invoices for each tenant
      const invoices = tenantsWithUnits.map(unit => ({
        billing_month_id: billingMonthData.id,
        tenant_id: unit.tenant_id,
        invoice_number: `INV-${billingMonthData.year}-${String(billingMonthData.month).padStart(2, '0')}-${unit.unit_number}`,
        amount: unit.rent_amount,
        unit_number: unit.unit_number
      }));

      if (invoices.length > 0) {
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert(invoices);

        if (invoiceError) throw invoiceError;

        // Create notifications for each tenant about their invoice
        const getMonthName = (month: number) => {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          return months[month - 1];
        };

        const notifications = tenantsWithUnits.map(unit => ({
          tenant_id: unit.tenant_id,
          message: `Kindly, download your invoice for the month of ${getMonthName(billingMonthData.month)} ${billingMonthData.year} here.`,
          read: false
        }));

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notificationError) console.error('Error creating notifications:', notificationError);
      }

      toast({
        title: "Success",
        description: `Billing month created successfully with ${invoices.length} invoices generated`,
      });

      setIsCreateDialogOpen(false);
      setNewBillingMonth({
        month: '',
        year: new Date().getFullYear(),
        payment_link: ''
      });
      fetchBillingMonths();
    } catch (error) {
      console.error('Error creating billing month:', error);
      toast({
        title: "Error",
        description: "Failed to create billing month and generate invoices",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status })
        .eq('id', paymentId);

      if (error) throw error;

      // Generate receipt only when payment is marked as paid (full payment)
      if (status === 'paid') {
        const payment = pendingPayments.find(p => p.id === paymentId);
        if (payment) {
          // Get unit details to include rent amount in receipt
          const { data: unitData } = await supabase
            .from('units')
            .select('rent_amount, unit_number')
            .eq('tenant_id', payment.tenant_id)
            .single();

          const { error: receiptError } = await supabase
            .from('receipts')
            .insert({
              payment_id: paymentId,
              tenant_id: payment.tenant_id,
              receipt_number: `RCP-${Date.now()}-${payment.tenant_id.slice(0, 8)}`,
              amount: unitData?.rent_amount || payment.amount,
              unit_number: unitData?.unit_number || 'N/A'
            });

          if (receiptError) console.error('Error creating receipt:', receiptError);
        }
      }

      // Refresh payments
      if (selectedBillingMonth) {
        fetchPayments(selectedBillingMonth.id);
      }

      toast({
        title: "Success",
        description: `Payment marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedBillingMonth) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {getMonthName(selectedBillingMonth.month)} {selectedBillingMonth.year}
            </h2>
            <p className="text-muted-foreground">Billing month details</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedBillingMonth(null)}
          >
            Back to Billing
          </Button>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Payments ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Received ({paidPayments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Submissions</CardTitle>
                <CardDescription>Tenants who submitted payment details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingPayments.map((payment) => {
                    const profile = payment.profiles;
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile?.email || payment.full_name
                            }
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Amount: ${payment.amount} • M-Pesa: {payment.mpesa_code}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(status) => updatePaymentStatus(payment.id, status)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Set Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">✅ Paid</SelectItem>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="failed">❌ Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {pendingPayments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No pending payments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Processed Payments</CardTitle>
                <CardDescription>Payments marked as paid or pending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paidPayments.map((payment) => {
                    const StatusIcon = getStatusIcon(payment.status);
                    const profile = payment.profiles;
                    
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}`
                              : profile?.email || payment.full_name
                            }
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Amount: ${payment.amount} • M-Pesa: {payment.mpesa_code}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(payment.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                  
                  {paidPayments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No processed payments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            Billing Management
          </h2>
          <p className="text-muted-foreground">Create and manage billing months</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="group">
              <Plus className="h-4 w-4 mr-2" />
              Create Billing Month
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Billing Month</DialogTitle>
              <DialogDescription>
                Set up a new billing period for rent collection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="month">Month</Label>
                <Select onValueChange={(value) => setNewBillingMonth({...newBillingMonth, month: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {getMonthName(i + 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={newBillingMonth.year}
                  onChange={(e) => setNewBillingMonth({...newBillingMonth, year: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="payment_link">Payment Link (URL)</Label>
                <Input
                  id="payment_link"
                  placeholder="https://paypal.me/yourlink"
                  value={newBillingMonth.payment_link}
                  onChange={(e) => setNewBillingMonth({...newBillingMonth, payment_link: e.target.value})}
                />
              </div>
              
              <Button onClick={createBillingMonth} className="w-full">
                Create Billing Month
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Billing Months Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {billingMonths.map((month) => (
          <Card 
            key={month.id} 
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => {
              setSelectedBillingMonth(month);
              fetchPayments(month.id);
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {getMonthName(month.month)} {month.year}
              </CardTitle>
              <CardDescription>
                Click to manage payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(month.created_at).toLocaleDateString()}
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {billingMonths.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Billing Months Created</h3>
            <p className="text-muted-foreground mb-4">Create your first billing month to start collecting rent</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Billing Month
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BillingManagementNew;
