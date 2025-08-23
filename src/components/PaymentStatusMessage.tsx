import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface PaymentStatusMessageProps {
  status: string;
  billingMonth?: string;
  rentAmount?: number;
  paidAmount?: number;
}

const PaymentStatusMessage = ({ 
  status, 
  billingMonth, 
  rentAmount = 0, 
  paidAmount = 0 
}: PaymentStatusMessageProps) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'paid':
        return {
          icon: CheckCircle,
          message: "Your payment has been approved by the admin ✅",
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/20"
        };
      case 'partial':
        return {
          icon: AlertTriangle,
          message: "Your payment has been recorded as partial. Kindly pay the full rent amount.",
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/20"
        };
      case 'rejected':
        return {
          icon: XCircle,
          message: "Your payment has been rejected by the manager. Kindly contact the manager.",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20"
        };
      case 'pending':
        return {
          icon: Clock,
          message: "Your payment is waiting for admin approval. Kindly be patient.",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200"
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();
  
  if (!statusInfo) return null;

  const { icon: Icon, message, color, bgColor, borderColor } = statusInfo;

  return (
    <Card className={`${bgColor} ${borderColor} border-2`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${color} mt-0.5 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`font-medium ${color}`}>
              {message}
            </p>
            {billingMonth && (
              <p className="text-sm text-muted-foreground mt-1">
                For billing month: {billingMonth}
              </p>
            )}
            {status === 'partial' && rentAmount > 0 && paidAmount > 0 && (
              <div className="mt-2 text-sm">
                <p className="text-muted-foreground">
                  Monthly Rent: <span className="font-medium">KES {rentAmount}</span>
                </p>
                <p className="text-muted-foreground">
                  Amount Paid: <span className="font-medium">KES {paidAmount}</span>
                </p>
                <p className={`font-medium ${color}`}>
                  Remaining: <span>KES {rentAmount - paidAmount}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentStatusMessage;