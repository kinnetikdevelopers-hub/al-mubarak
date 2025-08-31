import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("=== M-Pesa Callback Received ===");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const callbackData = req.body.Body?.stkCallback;
    if (!callbackData) {
      return res.status(200).json({ message: "No callback data" });
    }

    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;

    // Find payment record
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestID)
      .single();

    if (findError || !payment) {
      console.error("Payment not found:", findError);
      return res.status(200).json({ message: "Payment not found" });
    }

    if (resultCode === 0) {
      // Payment successful
      const callbackMetadata = callbackData.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const transactionDate = callbackMetadata.find(item => item.Name === "TransactionDate")?.Value;
      const actualAmount = callbackMetadata.find(item => item.Name === "Amount")?.Value;

      // Update payment
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          transaction_date: transactionDate?.toString(),
          partial_amount: actualAmount
        })
        .eq('id', payment.id);

      // Generate receipt
      const receiptNumber = `RCP-${Date.now()}`;
      await supabase
        .from('receipts')
        .insert([{
          payment_id: payment.id,
          tenant_id: payment.tenant_id,
          receipt_number: receiptNumber,
          amount: actualAmount || payment.amount,
          unit_number: payment.unit_number
        }]);

      console.log(`✅ Payment completed: ${mpesaReceiptNumber}`);

    } else {
      // Payment failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      console.log(`❌ Payment failed with code: ${resultCode}`);
    }

    res.status(200).json({ message: "Callback processed" });

  } catch (error) {
    console.error("Callback error:", error);
    res.status(200).json({ message: "Callback error" });
  }
}