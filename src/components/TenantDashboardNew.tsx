import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import TenantSettings from './TenantSettings';
import PaymentStatusMessage from './PaymentStatusMessage';
import { 
  AlertCircle, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock,
  Bell,
  User,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  History,
  Zap
} from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

interface TenantDashboardNewProps {
  activeTab: string;
  onTabChange?: (tab: string) => void;
}

const TenantDashboardNew = ({ activeTab, onTabChange }: TenantDashboardNewProps) => {
  const { profile } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tenantUnit, setTenantUnit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentForm, setPaymentForm] = useState({
    full_name: '',
    amount: '',
    mpesa_code: '',
    unit_number: ''
  });
  const { toast } = useToast();

  const isPending = profile?.status === 'pending';
  const isSuspended = profile?.status === 'suspended';

  const fetchTenantData = async () => {
    if (!profile?.id) return;

    try {
      // Fetch tenant's unit
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('tenant_id', profile.id)
        .single();

      if (unitError && unitError.code !== 'PGRST116') {
        console.error('Error fetching unit:', unitError);
      } else {
        setTenantUnit(unitData);
      }

      // Fetch billing months
      const { data: billingData, error: billingError } = await supabase
        .from('billing_months')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (billingError) throw billingError;
      setBillingMonths(billingData || []);

      // Fetch tenant's payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*, billing_months(*)')
        .eq('tenant_id', profile.id)
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Notifications are now handled by useNotifications hook

    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantData();
  }, [profile?.id]);

  const submitPayment = async (billingMonthId: string) => {
    if (!paymentForm.full_name || !paymentForm.amount || !paymentForm.mpesa_code || !paymentForm.unit_number) {
      toast({
        title: "Error",
        description: "Please fill in all fields including unit number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .insert([{
          tenant_id: profile?.id,
          billing_month_id: billingMonthId,
          full_name: paymentForm.full_name,
          amount: parseFloat(paymentForm.amount),
          mpesa_code: paymentForm.mpesa_code,
          unit_number: paymentForm.unit_number,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your payment is waiting for admin approval. Kindly be patient.",
      });

      setPaymentForm({ full_name: '', amount: '', mpesa_code: '', unit_number: '' });
      fetchTenantData(); // Refresh data
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment",
        variant: "destructive",
      });
    }
  };

  // markNotificationAsRead is now handled by useNotifications hook

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getPaymentStatusMessage = (payment: any) => {
    switch (payment.status) {
      case 'paid':
        return {
          message: "Your payment has been approved by the admin ✅",
          color: "text-success",
          icon: CheckCircle,
          canDownload: true
        };
      case 'partial':
        return {
          message: "Your payment has been recorded as partial. Kindly pay the full rent amount.",
          color: "text-warning",
          icon: AlertTriangle,
          canDownload: false
        };
      case 'rejected':
        return {
          message: "Your payment has been rejected by the manager. Kindly contact the manager.",
          color: "text-destructive",
          icon: XCircle,
          canDownload: false
        };
      case 'pending':
        return {
          message: "Your payment is waiting for admin approval. Kindly be patient.",
          color: "text-blue-600",
          icon: Clock,
          canDownload: false
        };
      default:
        return {
          message: "Payment status unknown",
          color: "text-muted-foreground",
          icon: AlertCircle,
          canDownload: false
        };
    }
  };

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

  const renderTabContent = () => {
    // Show suspended message for all tabs if suspended
    if (isSuspended) {
      return (
        <div className="text-center py-16">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-4 text-destructive">Account Suspended</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your account has been suspended. Please contact the administrator for assistance.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {isPending && (
              <Alert className="border-warning bg-warning/10">
                <AlertCircle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  <strong>Account Pending Approval:</strong> Your account is being reviewed. 
                  You'll receive full access once approved by the property manager.
                </AlertDescription>
              </Alert>
            )}

            {!isPending && (
              <div className="mb-6">
                <Alert className="border-success bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success-foreground">
                    <strong>Account Approved:</strong> Welcome to your tenant portal! 
                    You now have full access to all features.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Monthly Rent Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Monthly Rent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  KES {tenantUnit?.rent_amount || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tenantUnit ? `Unit ${tenantUnit.unit_number}` : 'No unit assigned'}
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => onTabChange?.('pay-rent')}
                  disabled={isPending}
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Rent
                  {isPending && <span className="ml-auto text-xs">(Pending)</span>}
                </Button>
                <Button 
                  className="w-full justify-start gap-2" 
                  variant="outline"
                  onClick={() => onTabChange?.('history')}
                  disabled={isPending}
                >
                  <History className="h-4 w-4" />
                  Payment History
                  {isPending && <span className="ml-auto text-xs">(Pending)</span>}
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'pay-rent':
        if (isPending) {
          return (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
              <p className="text-muted-foreground">Your account is pending approval. You'll be able to make payments once your account is approved.</p>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {billingMonths.map((month) => {
                const existingPayment = payments.find(p => p.billing_month_id === month.id);
                const statusInfo = existingPayment ? getPaymentStatusMessage(existingPayment) : null;
                
                return (
                  <Card key={month.id} className="cursor-pointer hover:shadow-lg transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {getMonthName(month.month)} {month.year}
                      </CardTitle>
                      {month.payment_link && (
                        <a 
                          href={month.payment_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Payment Link
                        </a>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {existingPayment ? (
                        <PaymentStatusMessage 
                          status={existingPayment.status}
                          billingMonth={`${getMonthName(month.month)} ${month.year}`}
                          rentAmount={tenantUnit?.rent_amount}
                          paidAmount={existingPayment.amount}
                        />
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`name-${month.id}`}>Full Name</Label>
                            <Input
                              id={`name-${month.id}`}
                              value={paymentForm.full_name}
                              onChange={(e) => setPaymentForm({...paymentForm, full_name: e.target.value})}
                              placeholder="Enter your full name"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`unit-${month.id}`}>Unit Number *</Label>
                            <Input
                              id={`unit-${month.id}`}
                              value={paymentForm.unit_number}
                              onChange={(e) => setPaymentForm({...paymentForm, unit_number: e.target.value})}
                              placeholder="Enter your unit number"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`amount-${month.id}`}>Amount</Label>
                            <Input
                              id={`amount-${month.id}`}
                              type="number"
                              value={paymentForm.amount}
                              onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                              placeholder={`${tenantUnit?.rent_amount || 0}`}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`mpesa-${month.id}`}>M-Pesa Code</Label>
                            <Input
                              id={`mpesa-${month.id}`}
                              value={paymentForm.mpesa_code}
                              onChange={(e) => setPaymentForm({...paymentForm, mpesa_code: e.target.value})}
                              placeholder="Enter M-Pesa transaction code"
                            />
                          </div>
                          
                          <Button 
                            onClick={() => submitPayment(month.id)} 
                            className="w-full"
                          >
                            Submit Payment
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {billingMonths.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Billing Months Available</h3>
                  <p className="text-muted-foreground">The admin hasn't created any billing months yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'history':
        if (isPending) {
          return (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
              <p className="text-muted-foreground">Your account is pending approval. Payment history will be available once approved.</p>
            </div>
          );
        }

        return (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View your past payment submissions</CardDescription>
            </CardHeader>
            <CardContent>
      {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments
                    .sort((a, b) => {
                      // Sort by year first, then by month (chronological order)
                      if (a.billing_months.year !== b.billing_months.year) {
                        return a.billing_months.year - b.billing_months.year;
                      }
                      return a.billing_months.month - b.billing_months.month;
                    })
                    .map((payment) => {
                    const statusInfo = getPaymentStatusMessage(payment);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">
                            {getMonthName(payment.billing_months.month)} {payment.billing_months.year}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Amount: KES {payment.amount} • M-Pesa: {payment.mpesa_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <Badge variant="outline" className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No payment history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Messages and updates from property management</CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No notifications at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'settings':
        return <TenantSettings />;

      default:
        return null;
    }
  };

  return <div className="space-y-6">{renderTabContent()}</div>;
};

export default TenantDashboardNew;
