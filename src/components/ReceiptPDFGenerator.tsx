import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ReceiptData {
  tenantName: string;
  unitNumber: string;
  amount: number;
  receiptNumber: string;
  paymentMethod: string;
}

interface ReceiptPDFGeneratorProps {
  receiptData: ReceiptData;
  disabled?: boolean;
}

const ReceiptPDFGenerator = ({ receiptData, disabled = false }: ReceiptPDFGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const generateReceiptPDF = async () => {
    if (!receiptRef.current) return;

    setIsGenerating(true);
    try {
      const element = receiptRef.current;
      
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
      pdf.save(`receipt-${receiptData.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={generateReceiptPDF} 
        disabled={disabled || isGenerating}
        variant="outline"
        size="sm"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        {isGenerating ? 'Generating...' : 'Download Receipt'}
      </Button>

      {/* Hidden receipt template */}
      <div 
        ref={receiptRef} 
        className="fixed -left-[9999px] w-[210mm] bg-white text-black"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        <div className="flex">
          {/* Left purple bar with "RECEIPT" */}
          <div className="w-20 bg-purple-700 flex items-center justify-center">
            <div className="text-white font-bold text-2xl transform -rotate-90 whitespace-nowrap">
              RECEIPT
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-8">
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
                <h1 className="text-4xl font-bold text-purple-700 mb-2">RECEIPT</h1>
                <p className="text-sm">Unit Number: {receiptData.unitNumber}</p>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-4 mb-8">
              <div className="border-b border-dotted border-gray-400 pb-2">
                <span className="inline-block w-48">Received with thanks from</span>
                <span className="font-bold">{receiptData.tenantName}</span>
              </div>
              
              <div className="border-b border-dotted border-gray-400 pb-2">
                <span className="inline-block w-48">Amount in Kenya Shillings</span>
                <span className="font-bold">KES {receiptData.amount.toLocaleString()}</span>
              </div>

              <div className="flex space-x-8 my-4">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={receiptData.paymentMethod.toLowerCase().includes('cash')}
                    readOnly
                  />
                  <span>Cash</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={receiptData.paymentMethod.toLowerCase().includes('credit')}
                    readOnly
                  />
                  <span>Credit Card</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={receiptData.paymentMethod.toLowerCase().includes('mpesa')}
                    readOnly
                  />
                  <span>Mpesa</span>
                </label>
              </div>

              <div className="border-b border-dotted border-gray-400 pb-2">
                <span className="inline-block w-48">For the Purpose of</span>
                <span className="font-bold">RENT</span>
                <span className="ml-8">Contact No.</span>
                <span className="font-bold">0718622986</span>
              </div>

              <div className="border-b border-dotted border-gray-400 pb-2">
                <span className="inline-block w-48">Received by</span>
                <span className="font-bold">Management</span>
              </div>
            </div>

            {/* Signature area */}
            <div className="w-32 h-8 bg-purple-700 mb-4"></div>

            {/* Bottom right logo */}
            <div className="flex justify-end">
              <div className="w-16 h-16 rounded-full border-2 border-amber-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs font-bold">MY</div>
                  <div className="text-xs font-bold">PROPERTY</div>
                  <div className="text-xs font-bold">MANAGER</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right purple bar with "RECEIPT" */}
          <div className="w-20 bg-purple-700 flex items-center justify-center">
            <div className="text-white font-bold text-2xl transform rotate-90 whitespace-nowrap">
              RECEIPT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPDFGenerator;
