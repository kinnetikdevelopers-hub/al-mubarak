import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Clock,
  Bell,
  MessageCircle,
  User,
  Phone,
  Home,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TenantDashboardProps {
  activeTab: string;
}

const TenantDashboard = ({ activeTab }: TenantDashboardProps) => {
  const { profile } = useAuth();

  const isPending = profile?.status === 'pending';
  const isSuspended = profile?.status === 'suspended';

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

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0.00</div>
                  <p className="text-xs text-muted-foreground">Outstanding amount</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0.00</div>
                  <p className="text-xs text-muted-foreground">Base rent amount</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Payment due</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Overview</CardTitle>
                  <CardDescription>Current billing information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Base Rent</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Security Deposit</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Water</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Electricity</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">Waste Management</span>
                      <span className="font-medium">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center py-2 pt-3 border-t-2">
                      <span className="font-semibold">Total Monthly</span>
                      <span className="font-bold text-lg">$0.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant={isPending ? "outline" : "default"}
                    disabled={isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Rent
                    {isPending && <span className="ml-auto text-xs">(Pending)</span>}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={isPending}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View History
                    {isPending && <span className="ml-auto text-xs">(Pending)</span>}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={isPending}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Feedback
                    {isPending && <span className="ml-auto text-xs">(Pending)</span>}
                  </Button>
                </CardContent>
              </Card>
            </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Pay Rent</CardTitle>
              <CardDescription>Make your monthly payment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Payment system coming soon</p>
              </div>
            </CardContent>
          </Card>
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
              <CardDescription>View your past payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No payment history available</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Important updates and messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No notifications at this time</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'feedback':
        if (isPending) {
          return (
            <div className="text-center py-16">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Feature Not Available</h2>
              <p className="text-muted-foreground">Your account is pending approval. Feedback system will be available once approved.</p>
            </div>
          );
        }
        return (
          <Card>
            <CardHeader>
              <CardTitle>Send Feedback</CardTitle>
              <CardDescription>Share your thoughts with property management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Feedback system coming soon</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'account':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your profile and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Account Status</label>
                  <p className={`text-sm font-medium ${
                    profile?.status === 'approved' ? 'text-success' :
                    profile?.status === 'pending' ? 'text-warning' :
                    'text-destructive'
                  }`}>
                    {profile?.status?.charAt(0).toUpperCase() + profile?.status?.slice(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'contact':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Contact Property Management</CardTitle>
              <CardDescription>Get in touch with the property manager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Contact information coming soon</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return <div className="space-y-6">{renderTabContent()}</div>;
};

export default TenantDashboard;
