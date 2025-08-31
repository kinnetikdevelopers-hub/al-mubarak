import { supabase } from '@/integrations/supabase/client';

// M-Pesa credentials
const consumerKey = "2BJZ8GummAHAMnsqYy2Fq2VfSBO6kuNLMobAE86piHUq8ulI";
const consumerSecret = "hCoBeAmOkAAChUZfaZCb3UOvYxsoe8rG1JknaOM53FsShxPh8YN24oHY0tDa5rpp";
const shortcode = "174379";
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const baseURL = "https://sandbox.safaricom.co.ke";

async function getToken() {
  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  
  const response = await fetch(
    `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
    { 
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      } 
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get M-Pesa token');
  }
  
  const data = await response.json();
  return data.access_token;
}

export async function initiatePayment(paymentData: {
  tenant_id: string;
  billing_month_id: string;
  full_name: string;
  unit_number: string;
  phone_number: string;
  amount: number;
}) {
  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);
    const token = await getToken();

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: paymentData.amount,
      PartyA: paymentData.phone_number,
      PartyB: shortcode,
      PhoneNumber: paymentData.phone_number,
      CallBackURL: `${import.meta.env.VITE_BASE_URL || 'http://localhost:8080'}/api/mpesa/callback`,
      AccountReference: `UNIT-${paymentData.unit_number}`,
      TransactionDesc: `Rent payment for unit ${paymentData.unit_number}`
    };

    const response = await fetch(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkData)
      }
    );

    if (!response.ok) {
      throw new Error('M-Pesa STK push failed');
    }

    const responseData = await response.json();

    // Store in payments table
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        tenant_id: paymentData.tenant_id,
        billing_month_id: paymentData.billing_month_id,
        full_name: paymentData.full_name,
        unit_number: paymentData.unit_number,
        phone_number: paymentData.phone_number,
        amount: paymentData.amount,
        checkout_request_id: responseData.CheckoutRequestID,
        merchant_request_id: responseData.MerchantRequestID,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Payment request sent successfully!",
      data: responseData,
      payment_id: payment.id
    };

  } catch (error) {
    console.error("STK Push Error:", error);
    throw new Error("Payment request failed");
  }
}

export async function mockPayment(paymentData: {
  tenant_id: string;
  billing_month_id: string;
  full_name: string;
  unit_number: string;
  phone_number: string;
  amount: number;
}) {
  try {
    // Store in payments table with mock data
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        tenant_id: paymentData.tenant_id,
        billing_month_id: paymentData.billing_month_id,
        full_name: paymentData.full_name,
        unit_number: paymentData.unit_number,
        phone_number: paymentData.phone_number,
        amount: paymentData.amount,
        checkout_request_id: `MOCK-${Date.now()}`,
        merchant_request_id: `MOCK-REQ-${Date.now()}`,
        status: 'paid', // Auto-approve for testing
        mpesa_receipt_number: `MOCK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        transaction_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    // Generate receipt automatically
    const receiptNumber = `RCP-${Date.now()}`;
    await supabase
      .from('receipts')
      .insert([{
        payment_id: payment.id,
        tenant_id: paymentData.tenant_id,
        receipt_number: receiptNumber,
        amount: paymentData.amount,
        unit_number: paymentData.unit_number
      }]);

    return {
      success: true,
      message: "Mock payment completed successfully!",
      data: { CheckoutRequestID: payment.checkout_request_id },
      payment_id: payment.id
    };

  } catch (error) {
    console.error("Mock Payment Error:", error);
    throw new Error("Mock payment failed");
  }
}