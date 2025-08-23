import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Search, 
  Calendar,
  TrendingUp,
  Download,
  Filter,
  CreditCard,
  Building2,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt
} from 'lucide-react';

const PaymentsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [payments] = useState<any[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'Failed': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed': return CheckCircle;
      case 'Pending': return Clock;
      case 'Failed': return AlertCircle;
      default: return Clock;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Credit Card': return CreditCard;
      case 'Bank Transfer': return Building2;
      case 'Cash': return DollarSign;
      default: return DollarSign;
    }
  };

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const completedPayments = payments
    .filter(payment => payment.status === 'Completed')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingPayments = payments.filter(payment => payment.status === 'Pending').length;
  const failedPayments = payments.filter(payment => payment.status === 'Failed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary animate-float" />
            Payment Management
          </h2>
          <p className="text-muted-foreground">Track and manage all tenant payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="group hover:scale-105 transition-all duration-300">
            <Download className="h-4 w-4 mr-2 group-hover:animate-bounce-gentle" />
            Export
          </Button>
          <Button variant="outline" className="group hover:scale-105 transition-all duration-300">
            <Filter className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary animate-pulse-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${completedPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground animate-bounce-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Payment records</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedPayments}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tenant, unit, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {payments.map((payment, index) => {
                  const StatusIcon = getStatusIcon(payment.status);
                  const MethodIcon = getMethodIcon(payment.method);
                  
                  return (
                    <Card 
                      key={payment.id} 
                      className="hover:scale-102 transition-all duration-300 hover:shadow-lg animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <MethodIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Unit {payment.unit}</h3>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {payment.tenant}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {payment.reference}
                              </p>
                            </div>
                          </div>

                          <div className="w-full lg:w-auto">
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Amount</p>
                                  <p className="font-bold text-lg">${payment.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Method</p>
                                  <p className="font-semibold">{payment.method}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Date</p>
                                  <p className="font-semibold flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(payment.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <Badge className={`${getStatusColor(payment.status)} flex items-center gap-1`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {payment.status}
                                </Badge>
                                <Button variant="outline" size="sm" className="hover:scale-105 transition-all">
                                  View Receipt
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

        {/* Other tab contents would filter the payments array */}
        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Payments</CardTitle>
              <CardDescription>Successfully processed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success animate-float" />
                <h3 className="text-lg font-semibold mb-2">Completed Transactions</h3>
                <p className="mb-4">{payments.filter(p => p.status === 'Completed').length} successful payments</p>
                <p className="text-2xl font-bold text-success">${completedPayments.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Payments awaiting processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 text-warning animate-pulse-gentle" />
                <h3 className="text-lg font-semibold mb-2">Pending Processing</h3>
                <p className="mb-4">{pendingPayments} payments awaiting confirmation</p>
                <Button className="hover:scale-105 transition-all duration-300">
                  Review Pending
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Failed Payments</CardTitle>
              <CardDescription>Payments that require attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive animate-bounce-gentle" />
                <h3 className="text-lg font-semibold mb-2">Failed Transactions</h3>
                <p className="mb-4">{failedPayments} payments failed processing</p>
                <Button variant="destructive" className="hover:scale-105 transition-all duration-300">
                  Resolve Issues
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentsManagement;
