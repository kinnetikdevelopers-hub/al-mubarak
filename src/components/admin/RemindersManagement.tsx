import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell,
  Send,
  Users,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

const RemindersManagement = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [billingMonths, setBillingMonths] = useState<any[]>([]);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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
    }
  };

  const fetchTenants = async () => {
    try {
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('profiles')
        .select(`
          *,
          units!tenant_id (
            unit_number,
            rent_amount
          )
        `)
        .eq('role', 'tenant')
        .eq('status', 'approved');

      if (tenantsError) throw tenantsError;

      // Get payment statuses for filtering with month-specific data
      const tenantsWithPaymentStatus = await Promise.all(
        (tenantsData || []).map(async (tenant) => {
          let paymentQuery = supabase
            .from('payments')
            .select('status, billing_month_id, billing_months(month, year)')
            .eq('tenant_id', tenant.id);

          if (selectedMonth !== 'all') {
            paymentQuery = paymentQuery.eq('billing_month_id', selectedMonth);
          }

          const { data: payments } = await paymentQuery
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...tenant,
            latestPaymentStatus: payments?.[0]?.status || 'no_payment',
            paymentMonth: payments?.[0]?.billing_months
          };
        })
      );

      setTenants(tenantsWithPaymentStatus);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingMonths();
    fetchTenants();
  }, [selectedMonth]);

  useEffect(() => {
    fetchTenants();
  }, [selectedMonth]);

  const sendReminders = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    if (selectedTenants.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one tenant",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Create notifications for selected tenants
      const notifications = selectedTenants.map(tenantId => ({
        tenant_id: tenantId,
        message: message.trim(),
        read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Reminders sent to ${selectedTenants.length} tenant(s)`,
      });

      setMessage('');
      setSelectedTenants([]);
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send reminders",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleTenantSelection = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const selectAllTenants = () => {
    const filteredTenantIds = getFilteredTenants().map(t => t.id);
    setSelectedTenants(filteredTenantIds);
  };

  const clearSelection = () => {
    setSelectedTenants([]);
  };

  const getFilteredTenants = () => {
    let filtered = tenants;
    
    // Filter by payment status
    switch (filterStatus) {
      case 'rejected':
        filtered = filtered.filter(t => t.latestPaymentStatus === 'rejected');
        break;
      case 'partial':
        filtered = filtered.filter(t => t.latestPaymentStatus === 'partial');
        break;
      case 'pending':
        filtered = filtered.filter(t => t.latestPaymentStatus === 'pending');
        break;
      case 'no_payment':
        filtered = filtered.filter(t => t.latestPaymentStatus === 'no_payment');
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="outline">No Payment</Badge>;
    }
  };

  const filteredTenants = getFilteredTenants();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            Tenant Reminders
          </h2>
          <p className="text-muted-foreground">Send notifications and reminders to tenants</p>
        </div>
      </div>

      {/* Compose Message */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Reminder</CardTitle>
          <CardDescription>Send custom messages to selected tenants</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your reminder message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTenants.length} tenant(s) selected
            </div>
            
            <Button 
              onClick={sendReminders} 
              disabled={!message.trim() || selectedTenants.length === 0 || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Sending...' : 'Send Reminders'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Recipients</CardTitle>
          <CardDescription>Choose which tenants to send reminders to</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter and Selection Controls */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Months</option>
                {billingMonths
                  .sort((a, b) => {
                    if (a.year !== b.year) return b.year - a.year;
                    return b.month - a.month;
                  })
                  .map((month) => (
                    <option key={month.id} value={month.id}>
                      {getMonthName(month.month)} {month.year}
                    </option>
                  ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="rejected">Rejected Payments</option>
                <option value="partial">Partial Payments</option>
                <option value="no_payment">No Payment</option>
              </select>
            </div>
            
            <Button variant="outline" size="sm" onClick={selectAllTenants}>
              Select All ({filteredTenants.length})
            </Button>
            
            <Button variant="outline" size="sm" onClick={clearSelection}>
              Clear Selection
            </Button>
          </div>

          {/* Tenant List */}
          <div className="space-y-4">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  selectedTenants.includes(tenant.id) ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedTenants.includes(tenant.id)}
                    onCheckedChange={() => toggleTenantSelection(tenant.id)}
                  />
                  
                  <div className="w-8 h-8 bg-gradient-to-br from-tenant to-tenant/80 rounded-full flex items-center justify-center text-tenant-foreground text-sm font-medium">
                    {(tenant.first_name?.[0] || tenant.email[0]).toUpperCase()}
                  </div>
                  
                  <div>
                    <h4 className="font-medium">
                      {tenant.first_name && tenant.last_name 
                        ? `${tenant.first_name} ${tenant.last_name}`
                        : tenant.email
                      }
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {tenant.units?.[0] ? `Unit ${tenant.units[0].unit_number}` : 'No unit assigned'} • {tenant.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusBadge(tenant.latestPaymentStatus)}
                  
                  <div className="text-right text-sm">
                    <p className="font-medium">
                      KES {tenant.units?.[0]?.rent_amount || 0}
                    </p>
                    <p className="text-muted-foreground">Monthly rent</p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredTenants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  {filterStatus === 'all' ? 'No tenants found' : `No tenants with ${filterStatus} status`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersManagement;
