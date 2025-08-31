import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import FileUpload from './FileUpload';
import { 
  User, 
  Mail, 
  Phone, 
  IdCard, 
  Calendar,
  Save,
  Building2,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  id_number?: string;
  id_number_full?: string;
  role: 'admin' | 'tenant';
  status: 'pending' | 'approved' | 'suspended';
  created_at: string;
  updated_at: string;
  lease_document_url?: string;
  lease_document_name?: string;
  lease_document_size?: number;
  lease_document_uploaded_at?: string;
}

interface TenantDetailsModalProps {
  tenant: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdate?: () => void;
}

const TenantDetailsModal = ({ tenant, isOpen, onClose, onTenantUpdate }: TenantDetailsModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !tenant?.id) return;

    setIsUploading(true);
    try {
      // For demo purposes, store file info in database
      // In production, upload to storage first
      const { error } = await supabase
        .from('profiles')
        .update({
          lease_document_name: selectedFile.name,
          lease_document_size: selectedFile.size,
          lease_document_uploaded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lease document uploaded successfully!",
      });

      onTenantUpdate?.();
      setSelectedFile(null);

    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload lease document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tenant Details
          </DialogTitle>
          <DialogDescription>
            View and manage tenant account information and lease details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
              <CardDescription>Basic tenant account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    {tenant.first_name && tenant.last_name 
                      ? `${tenant.first_name} ${tenant.last_name}`
                      : 'Not provided'
                    }
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <div className="p-3 bg-muted rounded-md">{tenant.email}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    {tenant.phone || 'Not provided'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <IdCard className="h-4 w-4" />
                    ID Number
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    {tenant.id_number || tenant.id_number_full || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div className="p-3 bg-muted rounded-md">
                    {getStatusBadge(tenant.status)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member Since
                  </Label>
                  <div className="p-3 bg-muted rounded-md">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lease Document Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Lease Document Management
              </CardTitle>
              <CardDescription>Upload and manage tenant lease documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant?.lease_document_name && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Document</h4>
                  <p className="text-sm text-muted-foreground">
                    {tenant.lease_document_name}
                  </p>
                  {tenant.lease_document_size && (
                    <p className="text-xs text-muted-foreground">
                      Size: {(tenant.lease_document_size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                  {tenant.lease_document_uploaded_at && (
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(tenant.lease_document_uploaded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              
              <FileUpload
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
                currentFile={tenant?.lease_document_name}
                isUploading={isUploading}
              />
              
              {selectedFile && (
                <Button 
                  onClick={handleUploadDocument}
                  disabled={isUploading}
                  className="w-full"
                >
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TenantDetailsModal;
