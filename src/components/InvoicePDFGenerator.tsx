import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface InvoiceData {
  tenantName: string;
  unitNumber: string;
  amount: number;
  billingMonth: string;
  billingYear: number;
  dateCreated: string;
}

interface InvoicePDFGeneratorProps {
  invoiceData: InvoiceData;
  disabled?: boolean;
}

const InvoicePDFGenerator = ({ invoiceData, disabled = false }: InvoicePDFGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generateInvoicePDF = async () => {
    if (!invoiceRef.current) return;

    setIsGenerating(true);
    try {
      const element = invoiceRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`invoice-${invoiceData.unitNumber}-${invoiceData.billingMonth}-${invoiceData.billingYear}.pdf`);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={generateInvoicePDF} 
        disabled={disabled || isGenerating}
        variant="outline"
        className="w-full"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isGenerating ? 'Generating Invoice...' : 'Download Invoice'}
      </Button>

      {/* Hidden invoice template */}
      <div 
        ref={invoiceRef} 
        className="fixed -left-[9999px] w-[210mm] bg-white text-black"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full border-2 border-amber-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-bold">MY</div>
                  <div className="text-xs font-bold">PROPERTY</div>
                  <div className="text-xs font-bold">MANAGER</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-purple-700 mb-2">INVOICE</h1>
              <p className="text-sm">{invoiceData.dateCreated}</p>
              <p className="text-sm">Unit Number: {invoiceData.unitNumber}</p>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="mb-8">
            <div className="bg-purple-700 text-white grid grid-cols-3 gap-4 p-4 font-bold">
              <div>ITEM DESCRIPTION</div>
              <div className="text-center">AMOUNT</div>
              <div className="text-right">TOTAL</div>
            </div>
            <div className="border-l-2 border-r-2 border-b-2 border-gray-300 grid grid-cols-3 gap-4 p-4">
              <div>Monthly Rent</div>
              <div className="text-center">KES {invoiceData.amount.toLocaleString()}</div>
              <div className="text-right">KES {invoiceData.amount.toLocaleString()}</div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-2">Payment Method</h3>
              
              <div className="mb-4">
                <h4 className="font-bold mb-2">Bank Details</h4>
                <p>Bank Name: Cooperative Bank</p>
                <p>Account Name: My Property Manager</p>
                <p>Account Number: 642XXXXXX</p>
              </div>

              <div className="mb-4">
                <h4 className="font-bold mb-2">MPESA</h4>
                <p>Paybill: 542XXX</p>
                <p>Account Number: 642XXXXXX</p>
                <p>Account Name: My Property Manager</p>
              </div>

              <div className="w-32 h-8 bg-purple-700 mb-4"></div>
              
              <p className="font-bold">By Management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePDFGenerator;
