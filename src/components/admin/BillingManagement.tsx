import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Plus, 
  Search, 
  Calendar,
  Receipt,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const BillingManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [billingCycles] = useState<any[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'Overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return CheckCircle;
      case 'Pending': return Clock;
      case 'Overdue': return AlertCircle;
      default: return Clock;
    }
  };

  const calculateTotal = (bill: any) => {
    return bill.rent + bill.water + bill.electricity + bill.waste + bill.security;
  };

  const totalRevenue = billingCycles.reduce((sum, bill) => sum + calculateTotal(bill), 0);
  const paidAmount = billingCycles
    .filter(bill => bill.status === 'Paid')
    .reduce((sum, bill) => sum + calculateTotal(bill), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary animate-float" />
            Billing Management
          </h2>
          <p className="text-muted-foreground">Set up and manage billing for all units</p>
        </div>
        <Button className="group hover:scale-105 transition-all duration-300">
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          Create Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary animate-pulse-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-success animate-bounce-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${paidAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((paidAmount / totalRevenue) * 100)}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {billingCycles.filter(b => b.status === 'Pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {billingCycles.filter(b => b.status === 'Overdue').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Tabs */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Current Bills
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Bill
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Billing Cycle</CardTitle>
              <CardDescription>January 2024 billing statements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by unit or tenant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {billingCycles.map((bill, index) => {
                  const StatusIcon = getStatusIcon(bill.status);
                  const total = calculateTotal(bill);
                  
                  return (
                    <Card 
                      key={bill.id} 
                      className="hover:scale-102 transition-all duration-300 hover:shadow-lg animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Unit {bill.unit}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {bill.tenant}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Due: {new Date(bill.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="w-full lg:w-auto">
                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-muted-foreground">Rent</p>
                                <p className="font-semibold">${bill.rent}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Water</p>
                                <p className="font-semibold">${bill.water}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Electricity</p>
                                <p className="font-semibold">${bill.electricity}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Waste</p>
                                <p className="font-semibold">${bill.waste}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Security</p>
                                <p className="font-semibold">${bill.security}</p>
                              </div>
                            </div>

                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                              <div className="text-right">
                                <p className="text-2xl font-bold">${total.toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Badge className={`${getStatusColor(bill.status)} flex items-center gap-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {bill.status}
                                </Badge>
                                <Button variant="outline" size="sm" className="hover:scale-105 transition-all">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bill</CardTitle>
              <CardDescription>Generate billing statements for tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-16 w-16 mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-semibold mb-2">Bill Creation Tool</h3>
                <p className="mb-4">Create detailed billing statements with customizable line items</p>
                <Button className="hover:scale-105 transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Templates</CardTitle>
              <CardDescription>Pre-configured billing templates for different unit types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="h-16 w-16 mx-auto mb-4 animate-float" />
                <h3 className="text-lg font-semibold mb-2">Template Library</h3>
                <p className="mb-4">Save time with reusable billing templates</p>
                <Button className="hover:scale-105 transition-all duration-300">
                  <Plus className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingManagement;