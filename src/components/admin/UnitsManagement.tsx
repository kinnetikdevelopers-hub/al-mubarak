import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Bed, 
  Bath, 
  Square,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Users,
  Filter
} from 'lucide-react';

interface Unit {
  id: string;
  unit_number: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const UnitsManagement = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const { toast } = useToast();

  const [newUnit, setNewUnit] = useState({
    unit_number: '',
    floor: '',
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: '',
    status: 'vacant' as 'vacant' | 'occupied' | 'maintenance'
  });

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          profiles:tenant_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('floor', { ascending: true })
        .order('unit_number', { ascending: true });

      if (error) throw error;
      setUnits(data as Unit[] || []);
      setFilteredUnits(data as Unit[] || []);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast({
        title: "Error",
        description: "Failed to load units",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    let filtered = units.filter(unit =>
      unit.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.floor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      filtered = filtered.filter(unit => unit.status === statusFilter);
    }

    setFilteredUnits(filtered);
  }, [searchTerm, statusFilter, units]);

  const handleAddUnit = async () => {
    if (!newUnit.floor || !newUnit.unit_number || !newUnit.rent_amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .insert([{
          ...newUnit,
          rent_amount: parseFloat(newUnit.rent_amount)
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit added successfully",
      });

      setIsAddDialogOpen(false);
      setNewUnit({
        unit_number: '',
        floor: '',
        bedrooms: 1,
        bathrooms: 1,
        rent_amount: '',
        status: 'vacant'
      });
      fetchUnits();
    } catch (error) {
      console.error('Error adding unit:', error);
      toast({
        title: "Error",
        description: "Failed to add unit",
        variant: "destructive",
      });
    }
  };

  const handleEditUnit = async () => {
    if (!editingUnit) return;

    try {
      const { error } = await supabase
        .from('units')
        .update({
          unit_number: editingUnit.unit_number,
          floor: editingUnit.floor,
          bedrooms: editingUnit.bedrooms,
          bathrooms: editingUnit.bathrooms,
          rent_amount: editingUnit.rent_amount,
          status: editingUnit.status
        })
        .eq('id', editingUnit.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit updated successfully",
      });

      setEditingUnit(null);
      fetchUnits();
    } catch (error) {
      console.error('Error updating unit:', error);
      toast({
        title: "Error",
        description: "Failed to update unit",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Unit deleted successfully",
      });

      fetchUnits();
    } catch (error) {
      console.error('Error deleting unit:', error);
      toast({
        title: "Error",
        description: "Failed to delete unit",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-success text-success-foreground';
      case 'vacant': return 'bg-warning text-warning-foreground';
      case 'maintenance': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const organizeUnitsByFloor = () => {
    const floorOrder = ['Ground floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];
    
    return filteredUnits.sort((a, b) => {
      const aIndex = floorOrder.indexOf(a.floor);
      const bIndex = floorOrder.indexOf(b.floor);
      if (aIndex !== bIndex) {
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }
      return a.unit_number.localeCompare(b.unit_number);
    });
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

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const vacantUnits = units.filter(u => u.status === 'vacant').length;
  const maintenanceUnits = units.filter(u => u.status === 'maintenance').length;
  const totalRevenue = units.filter(u => u.status === 'occupied').reduce((sum, u) => sum + u.rent_amount, 0);
  const organizedUnits = organizeUnitsByFloor();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            Property Units
          </h2>
          <p className="text-muted-foreground">Manage your rental units and properties</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="group">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Unit</DialogTitle>
              <DialogDescription>
                Create a new rental unit with all details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Select onValueChange={(value) => setNewUnit({...newUnit, floor: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="Ground floor">Ground floor</SelectItem>
                    <SelectItem value="1st Floor">1st Floor</SelectItem>
                    <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                    <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                    <SelectItem value="4th Floor">4th Floor</SelectItem>
                    <SelectItem value="5th Floor">5th Floor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="unit_number">Apartment Number</Label>
                <Input
                  id="unit_number"
                  placeholder="e.g., A101, B205"
                  value={newUnit.unit_number}
                  onChange={(e) => setNewUnit({...newUnit, unit_number: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select onValueChange={(value) => setNewUnit({...newUnit, bedrooms: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select onValueChange={(value) => setNewUnit({...newUnit, bathrooms: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="3">3 Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="rent_amount">Rent Amount ($)</Label>
                <Input
                  id="rent_amount"
                  type="number"
                  placeholder="Enter monthly rent"
                  value={newUnit.rent_amount}
                  onChange={(e) => setNewUnit({...newUnit, rent_amount: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select onValueChange={(value) => setNewUnit({...newUnit, status: value as 'vacant' | 'occupied' | 'maintenance'})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAddUnit} className="w-full">
                Add Unit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-xs text-muted-foreground">Properties managed</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied</CardTitle>
            <Users className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{occupiedUnits}</div>
            <p className="text-xs text-muted-foreground">
              {totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}% occupancy
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacant</CardTitle>
            <Square className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{vacantUnits}</div>
            <p className="text-xs text-muted-foreground">Available for rent</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From occupied units</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Unit Directory</CardTitle>
          <CardDescription>Search and manage all property units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search units by number or floor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Units Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizedUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Unit {unit.unit_number}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {unit.floor}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(unit.status)}>
                      {unit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.bedrooms} bedroom{unit.bedrooms > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{unit.bathrooms} bathroom{unit.bathrooms > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span className="font-semibold text-lg">${unit.rent_amount}/mo</span>
                  </div>

                  {unit.profiles && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Tenant:</strong> {unit.profiles.first_name} {unit.profiles.last_name}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setEditingUnit(unit)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Unit</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete Unit {unit.unit_number}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteUnit(unit.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {organizedUnits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' ? 'No units found matching your criteria' : 'No units added yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Unit Dialog */}
      {editingUnit && (
        <Dialog open={!!editingUnit} onOpenChange={() => setEditingUnit(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Unit {editingUnit.unit_number}</DialogTitle>
              <DialogDescription>
                Update unit details and status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={editingUnit.status} 
                  onValueChange={(value) => setEditingUnit({...editingUnit, status: value as 'vacant' | 'occupied' | 'maintenance'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    <SelectItem value="vacant">Vacant</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-rent">Rent Amount ($)</Label>
                <Input
                  id="edit-rent"
                  type="number"
                  value={editingUnit.rent_amount}
                  onChange={(e) => setEditingUnit({...editingUnit, rent_amount: parseFloat(e.target.value)})}
                />
              </div>
              
              <Button onClick={handleEditUnit} className="w-full">
                Update Unit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UnitsManagement;
