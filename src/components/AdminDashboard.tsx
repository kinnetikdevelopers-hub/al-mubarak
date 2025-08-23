import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import TenantManagement from './TenantManagement';
import UnitsManagementUpdated from './admin/UnitsManagementUpdated';
import BillingManagementUpdated from './admin/BillingManagementUpdated';
import ReportsManagementUpdated from './admin/ReportsManagementUpdated';
import RemindersManagement from './admin/RemindersManagement';
import SettingsManagement from './admin/SettingsManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertCircle, 
  BarChart3,
  Bell,
  Settings,
  Home,
  DollarSign,
  UserCheck,
  Calendar
} from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminDashboard = ({ activeTab, onTabChange }: AdminDashboardProps) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUnits: 0,
    activeTenants: 0,
    monthlyRevenue: 0,
    pendingApprovals: 0,
    pendingPayments: 0
  });

  const fetchStats = async () => {
    try {
      // Fetch pending tenants count
      const { data: pendingTenants, error: pendingError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'tenant')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Fetch approved tenants count
      const { data: approvedTenants, error: approvedError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'tenant')
        .eq('status', 'approved');

      if (approvedError) throw approvedError;

      setStats({
        totalUnits: 0, // TODO: Implement units table
        activeTenants: approvedTenants?.length || 0,
        monthlyRevenue: 0, // TODO: Implement billing
        pendingApprovals: pendingTenants?.length || 0,
        pendingPayments: 0 // TODO: Implement payments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card className="shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground animate-float" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUnits}</div>
                  <p className="text-xs text-muted-foreground">Property units</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                  <UserCheck className="h-4 w-4 text-success animate-bounce-gentle" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeTenants}</div>
                  <p className="text-xs text-muted-foreground">Approved tenants</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary animate-pulse-gentle" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {stats.monthlyRevenue}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <AlertCircle className="h-4 w-4 text-warning animate-bounce-gentle" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingApprovals > 0 ? 'Awaiting approval' : 'All caught up!'}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:scale-105 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                  <DollarSign className="h-4 w-4 text-warning animate-float" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-warning">{stats.pendingPayments}</div>
                  <p className="text-xs text-muted-foreground">Payment approval needed</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Property Manager</CardTitle>
                  <CardDescription>
                    Your comprehensive rental management system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Manage your property efficiently with our integrated tenant and payment management system.
                  </p>
                   {stats.pendingApprovals > 0 && (
                    <div className="flex space-x-3">
                      <Button 
                        variant="outline" 
                        className="border-warning text-warning hover:bg-warning/10"
                        onClick={() => onTabChange('tenants')}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {stats.pendingApprovals} Tenants Waiting Approval
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'units':
        return <UnitsManagementUpdated />;

      case 'tenants':
        return <TenantManagement />;

      case 'billing':
        return <BillingManagementUpdated />;

      case 'reports':
        return <ReportsManagementUpdated />;

      case 'reminders':
        return <RemindersManagement />;

      case 'settings':
        return <SettingsManagement />;

      default:
        return null;
    }
  };

  return <div className="space-y-6">{renderTabContent()}</div>;
};

export default AdminDashboard;