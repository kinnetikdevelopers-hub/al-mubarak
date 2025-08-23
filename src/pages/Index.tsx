import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Shield, Users, CreditCard, BarChart3, Bell } from 'lucide-react';

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto text-center space-y-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary-light rounded-3xl flex items-center justify-center shadow-xl">
            <Building2 className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Property Manager
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your rental management with our comprehensive platform
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="admin" onClick={() => navigate('/auth')}>
              <Shield className="h-5 w-5 mr-2" />
              Admin Access
            </Button>
            <Button size="lg" variant="tenant" onClick={() => navigate('/auth')}>
              <Users className="h-5 w-5 mr-2" />
              Tenant Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Complete Rental Management</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to manage properties and tenants efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-admin/10 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-admin" />
                </div>
                <CardTitle>Unit Management</CardTitle>
                <CardDescription>
                  Add, edit, and organize rental units with detailed information and pricing
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-tenant/10 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-tenant" />
                </div>
                <CardTitle>Tenant Portal</CardTitle>
                <CardDescription>
                  Secure tenant access for payments, history, and communication
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Payment Processing</CardTitle>
                <CardDescription>
                  Integrated payment system with Pesapal for easy rent collection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Comprehensive analytics and reporting for informed decision making
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-warning" />
                </div>
                <CardTitle>Automated Reminders</CardTitle>
                <CardDescription>
                  Send payment reminders and notifications to tenants automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle>Secure Access</CardTitle>
                <CardDescription>
                  Role-based security ensuring data privacy and proper access control
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-card/80 backdrop-blur">
            <CardHeader className="pb-8">
              <CardTitle className="text-3xl">Get Started Today</CardTitle>
              <CardDescription className="text-lg">
                Join our rental management platform and streamline your property operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" variant="default" onClick={() => navigate('/auth')} className="shadow-lg">
                Access Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30 backdrop-blur px-4 py-8">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Property Manager. Professional rental management solution.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
