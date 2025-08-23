import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/AdminDashboard';
import TenantDashboardNew from '@/components/TenantDashboardNew';
import DashboardLayout from '@/components/DashboardLayout';

const Dashboard = () => {
  const { profile, isAdmin, isTenant, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/auth');
    }
  }, [profile, isLoading, navigate]);

  if (isLoading || !profile) {
    return null;
  }

  // Check if tenant is pending approval
  if (profile.role === 'tenant' && profile.status === 'pending') {
    return (
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <TenantDashboardNew activeTab={activeTab} onTabChange={setActiveTab} />
      </DashboardLayout>
    );
  }

  // Check if tenant is suspended
  if (profile.role === 'tenant' && profile.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been suspended. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  // Role-based dashboard rendering
  if (isAdmin) {
    return (
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <AdminDashboard activeTab={activeTab} onTabChange={setActiveTab} />
      </DashboardLayout>
    );
  }

  if (isTenant) {
    return (
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        <TenantDashboardNew activeTab={activeTab} onTabChange={setActiveTab} />
      </DashboardLayout>
    );
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Pending</h1>
        <p className="text-muted-foreground">
          Your account is being processed. Please contact the administrator.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;