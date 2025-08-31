import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('checkout_request_id', checkoutRequestID)
      .single();

    if (!payment) {
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
    }

    res.status(200).json({ message: "Callback processed" });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(200).json({ message: "Callback error" });
  }
}