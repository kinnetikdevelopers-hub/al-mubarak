import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Check, 
  X, 
  Eye,
  UserCheck,
  UserX,
  Clock,
  Building2,
  Home
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  id_number?: string;
  role: 'admin' | 'tenant';
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
  updated_at: string;
}

const TenantManagement = () => {
  const [tenants, setTenants] = useState<Profile[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [tenantsWithUnits, setTenantsWithUnits] = useState<any[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approve');
  const { toast } = useToast();

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tenant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
      setFilteredTenants(data || []);
      
      // Fetch tenants with their allocated units
      await fetchTenantsWithUnits();
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

  const fetchTenantsWithUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          units!tenant_id (
            id,
            unit_number,
            rent_amount,
            floor,
            bedrooms,
            bathrooms
          )
        `)
        .eq('role', 'tenant')
        .eq('status', 'approved');

      if (error) throw error;
      setTenantsWithUnits(data || []);
    } catch (error) {
      console.error('Error fetching tenants with units:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('status', 'vacant')
        .order('unit_number');

      if (error) throw error;
      setUnits(data || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchUnits();
  }, []);

  useEffect(() => {
    const filtered = tenants.filter((tenant) =>
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.first_name && tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tenant.last_name && tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredTenants(filtered);
  }, [searchTerm, tenants]);

  const updateTenantStatus = async (tenantId: string, newStatus: 'approved' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      // Update local state
      setTenants(prev => prev.map(tenant => 
        tenant.id === tenantId ? { ...tenant, status: newStatus } : tenant
      ));

      toast({
        title: "Success",
        description: `Tenant ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error updating tenant status:', error);
      toast({
        title: "Error",
        description: "Failed to update tenant status",
        variant: "destructive",
      });
    }
  };

  const allocateUnit = async (tenantId: string, unitId: string) => {
    try {
      // Check if tenant already has a unit allocated
      const existingAllocation = tenantsWithUnits.find(t => t.id === tenantId && t.units.length > 0);
      if (existingAllocation) {
        toast({
          title: "Error",
          description: "This tenant already has a unit allocated",
          variant: "destructive",
        });
        return;
      }

      // Update unit with tenant_id and status to occupied
      const { error: unitError } = await supabase
        .from('units')
        .update({ tenant_id: tenantId, status: 'occupied' })
        .eq('id', unitId);

      if (unitError) throw unitError;

      // Refresh data
      fetchUnits();
      fetchTenantsWithUnits();
      
      toast({
        title: "Success",
        description: "Unit allocated successfully",
      });
    } catch (error) {
      console.error('Error allocating unit:', error);
      toast({
        title: "Error",
        description: "Failed to allocate unit",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
          <UserCheck className="h-3 w-3 mr-1" />
          Approved
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>;
      case 'suspended':
        return <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20">
          <UserX className="h-3 w-3 mr-1" />
          Suspended
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingTenants = tenants.filter(t => t.status === 'pending');
  const approvedTenants = tenants.filter(t => t.status === 'approved');
  const suspendedTenants = tenants.filter(t => t.status === 'suspended');
  
  const pendingCount = pendingTenants.length;
  const approvedCount = approvedTenants.length;
  const suspendedCount = suspendedTenants.length;

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

  const renderTenantList = (tenantList: Profile[], showActions = true) => (
    <div className="space-y-4">
      {tenantList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">No tenants in this category</p>
        </div>
      ) : (
        tenantList.map((tenant) => (
          <div
            key={tenant.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
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
                  <p className="text-sm text-muted-foreground">{tenant.email}</p>
                  {tenant.phone && (
                    <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right text-xs text-muted-foreground">
                <p>Joined {new Date(tenant.created_at).toLocaleDateString()}</p>
              </div>
              
              {getStatusBadge(tenant.status)}
              
              {showActions && (
                <div className="flex items-center space-x-2">
                  {tenant.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTenantStatus(tenant.id, 'approved')}
                        className="text-success border-success/20 hover:bg-success/10"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTenantStatus(tenant.id, 'suspended')}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {tenant.status === 'approved' && activeTab === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTenantStatus(tenant.id, 'suspended')}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      <UserX className="h-3 w-3 mr-1" />
                      Suspend
                    </Button>
                  )}

                  {tenant.status === 'approved' && activeTab === 'allocate' && (() => {
                    const tenantWithUnit = tenantsWithUnits.find(t => t.id === tenant.id);
                    const hasUnit = tenantWithUnit?.units && tenantWithUnit.units.length > 0;
                    
                    if (hasUnit) {
                      const unit = tenantWithUnit.units[0];
                      return (
                        <div className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success border border-success/20 rounded-md">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Unit {unit.unit_number}</span>
                        </div>
                      );
                    }
                    
                    return (
                      <Select onValueChange={(unitId) => allocateUnit(tenant.id, unitId)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Allocate Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              Unit {unit.unit_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                  
                  {tenant.status === 'suspended' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTenantStatus(tenant.id, 'approved')}
                      className="text-success border-success/20 hover:bg-success/10"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Reactivate
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingCount}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{approvedCount}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspendedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tenant Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approve" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Approve ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Confirmed ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="allocate" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Allocate
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approve" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Tenants waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTenantList(pendingTenants)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Tenants</CardTitle>
              <CardDescription>Approved tenants - manage their status</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTenantList(approvedTenants)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unit Allocation</CardTitle>
              <CardDescription>View and manage tenant unit allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="text-muted-foreground">
                    Available vacant units: <span className="font-bold text-primary">{units.length}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Allocated units: <span className="font-bold text-success">{tenantsWithUnits.filter(t => t.units?.length > 0).length}</span>
                  </p>
                </div>
              </div>
              {renderTenantList(approvedTenants)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantManagement;