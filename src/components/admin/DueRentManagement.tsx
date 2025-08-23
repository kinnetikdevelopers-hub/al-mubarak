import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  Send,
  Eye
} from 'lucide-react';

const DueRentManagement = () => {
  const [overdueRents] = useState<any[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Grace Period': return 'bg-warning text-warning-foreground';
      case 'First Notice': return 'bg-orange-500 text-white';
      case 'Final Notice': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyLevel = (daysOverdue: number) => {
    if (daysOverdue <= 7) return { level: 'Low', color: 'text-warning' };
    if (daysOverdue <= 30) return { level: 'Medium', color: 'text-orange-500' };
    return { level: 'High', color: 'text-destructive' };
  };

  const totalOverdue = overdueRents.reduce((sum, rent) => sum + rent.amount, 0);
  const averageDaysOverdue = Math.round(
    overdueRents.reduce((sum, rent) => sum + rent.daysOverdue, 0) / overdueRents.length
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive animate-bounce-gentle" />
            Due Rent Tracking
          </h2>
          <p className="text-muted-foreground">Monitor and manage overdue rental payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="group hover:scale-105 transition-all duration-300">
            <Send className="h-4 w-4 mr-2 group-hover:animate-bounce-gentle" />
            Send Reminders
          </Button>
          <Button className="group hover:scale-105 transition-all duration-300">
            <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <DollarSign className="h-4 w-4 text-destructive animate-pulse-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${totalOverdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Units</CardTitle>
            <Building2 className="h-4 w-4 text-warning animate-float" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{overdueRents.length}</div>
            <p className="text-xs text-muted-foreground">Units requiring attention</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Days</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{averageDaysOverdue}</div>
            <p className="text-xs text-muted-foreground">Days overdue</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overdueRents.filter(rent => rent.daysOverdue > 30).length}
            </div>
            <p className="text-xs text-muted-foreground">Need immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Rent List */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Payments</CardTitle>
          <CardDescription>Tenants with outstanding rent payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overdueRents.map((rent, index) => {
              const urgency = getUrgencyLevel(rent.daysOverdue);
              
              return (
                <Card 
                  key={rent.id} 
                  className="hover:scale-102 transition-all duration-300 hover:shadow-lg animate-fade-in border-l-4 border-l-destructive"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">Unit {rent.unit}</h3>
                            <Badge className={getStatusColor(rent.status)}>
                              {rent.status}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground flex items-center gap-1 mb-1">
                            <User className="h-3 w-3" />
                            {rent.tenant}
                          </p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {rent.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {rent.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground">Amount Due</p>
                            <p className="font-bold text-lg text-destructive">${rent.amount.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-semibold flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(rent.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Overdue</p>
                            <p className={`font-bold text-lg ${urgency.color}`}>
                              {rent.daysOverdue}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Payment</p>
                            <p className="font-semibold">
                              {new Date(rent.lastPayment).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:scale-105 transition-all group"
                          >
                            <Phone className="h-3 w-3 mr-1 group-hover:animate-bounce-gentle" />
                            Call
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:scale-105 transition-all group"
                          >
                            <Mail className="h-3 w-3 mr-1 group-hover:animate-pulse-gentle" />
                            Email
                          </Button>
                          <Button 
                            size="sm" 
                            className="hover:scale-105 transition-all group"
                          >
                            <Send className="h-3 w-3 mr-1 group-hover:rotate-12 transition-transform" />
                            Send Notice
                          </Button>
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6 text-center">
            <Phone className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce-gentle" />
            <h3 className="font-semibold mb-2">Bulk Call Campaign</h3>
            <p className="text-sm text-muted-foreground mb-4">Call all overdue tenants at once</p>
            <Button variant="outline" className="w-full">
              Start Calling
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse-gentle" />
            <h3 className="font-semibold mb-2">Email Reminders</h3>
            <p className="text-sm text-muted-foreground mb-4">Send automated payment reminders</p>
            <Button variant="outline" className="w-full">
              Send Emails
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive animate-float" />
            <h3 className="font-semibold mb-2">Legal Notices</h3>
            <p className="text-sm text-muted-foreground mb-4">Generate formal notice documents</p>
            <Button variant="destructive" className="w-full">
              Generate Notices
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DueRentManagement;