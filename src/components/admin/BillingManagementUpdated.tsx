import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  Eye,
  Edit,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const BillingManagementUpdated = () => {
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedBillingMonth, setSelectedBillingMonth] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState<any>(null);
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
      const { error } = await supabase
        .from('billing_months')
        .insert([{
          ...newBillingMonth,
          month: parseInt(newBillingMonth.month)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing month created successfully",
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
        description: "Failed to create billing month",
        variant: "destructive",
      });
    }
  };

  const updateBillingMonth = async () => {
    if (!editingMonth) return;
    
    try {
      const { error } = await supabase
        .from('billing_months')
        .update({
          month: parseInt(editingMonth.month.toString()),
          year: editingMonth.year,
          payment_link: editingMonth.payment_link
        })
        .eq('id', editingMonth.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing month updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingMonth(null);
      fetchBillingMonths();
    } catch (error) {
      console.error('Error updating billing month:', error);
      toast({
        title: "Error",
        description: "Failed to update billing month",
        variant: "destructive",
      });
    }
  };

  const deleteBillingMonth = async (monthId: string) => {
    try {
      const { error } = await supabase
        .from('billing_months')
        .delete()
        .eq('id', monthId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing month deleted successfully",
      });

      fetchBillingMonths();
    } catch (error) {
      console.error('Error deleting billing month:', error);
      toast({
        title: "Error",
        description: "Failed to delete billing month",
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
      case 'partial': return 'bg-warning text-warning-foreground'; 
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'partial': return AlertTriangle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
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
  const processedPayments = payments.filter(p => ['paid', 'partial', 'rejected'].includes(p.status));

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
            <TabsTrigger value="processed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Processed ({processedPayments.length})
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
                            Amount: KES {payment.amount} • M-Pesa: {payment.mpesa_code}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                           <Select onValueChange={(status) => updatePaymentStatus(payment.id, status)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Set Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">✅ Paid</SelectItem>
                              <SelectItem value="partial">⚠️ Partial</SelectItem>
                              <SelectItem value="rejected">❌ Rejected</SelectItem>
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

          <TabsContent value="processed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Processed Payments</CardTitle>
                <CardDescription>Payments that have been reviewed and assigned status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processedPayments.map((payment) => {
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
                            Amount: KES {payment.amount} • M-Pesa: {payment.mpesa_code}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(payment.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                          
                          {/* Allow editing status in processed tab */}
                          <Select onValueChange={(status) => updatePaymentStatus(payment.id, status)} value={payment.status}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">✅ Paid</SelectItem>
                              <SelectItem value="partial">⚠️ Partial</SelectItem>
                              <SelectItem value="rejected">❌ Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                  
                  {processedPayments.length === 0 && (
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
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-muted-foreground">
                  Created {new Date(month.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedBillingMonth(month);
                    fetchPayments(month.id);
                  }}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingMonth(month);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Billing Month</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {getMonthName(month.month)} {month.year}? 
                        This will also delete all associated payments. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteBillingMonth(month.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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

      {/* Edit Billing Month Dialog */}
      {editingMonth && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Billing Month</DialogTitle>
              <DialogDescription>
                Update billing month information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-month">Month</Label>
                <Select 
                  value={editingMonth.month.toString()} 
                  onValueChange={(value) => setEditingMonth({...editingMonth, month: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="edit-year">Year</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editingMonth.year}
                  onChange={(e) => setEditingMonth({...editingMonth, year: parseInt(e.target.value)})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-payment_link">Payment Link (URL)</Label>
                <Input
                  id="edit-payment_link"
                  value={editingMonth.payment_link || ''}
                  onChange={(e) => setEditingMonth({...editingMonth, payment_link: e.target.value})}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={updateBillingMonth} className="flex-1">
                  Update
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BillingManagementUpdated;