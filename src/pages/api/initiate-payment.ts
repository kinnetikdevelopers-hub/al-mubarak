import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Your existing M-Pesa credentials
const consumerKey = "2BJZ8GummAHAMnsqYy2Fq2VfSBO6kuNLMobAE86piHUq8ulI";
const consumerSecret = "hCoBeAmOkAAChUZfaZCb3UOvYxsoe8rG1JknaOM53FsShxPh8YN24oHY0tDa5rpp";
const shortcode = "174379";
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const baseURL = "https://sandbox.safaricom.co.ke";

async function getToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const { data } = await axios.get(
    `${baseURL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return data.access_token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenant_id, billing_month_id, full_name, unit_number, phone_number, amount } = req.body;

  try {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const token = await getToken();

    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone_number,
      PartyB: shortcode,
      PhoneNumber: phone_number,
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mpesa/callback`,
      AccountReference: `UNIT-${unit_number}`,
      TransactionDesc: `Rent payment for unit ${unit_number}`
    };

    const response = await axios.post(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      stkData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store in your existing payments table
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        tenant_id,
        billing_month_id,
        full_name,
        unit_number,
        phone_number,
        amount,
        checkout_request_id: response.data.CheckoutRequestID,
        merchant_request_id: response.data.MerchantRequestID,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: "Payment request sent successfully!",
      data: response.data,
      payment_id: payment.id
    });

  } catch (error) {
    console.error("STK Push Error:", error);
    res.status(500).json({ error: "Payment request failed" });
  }
}