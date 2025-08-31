import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

// Your M-Pesa configuration
const consumerKey = "your_consumer_key";
const consumerSecret = "your_consumer_secret";
const shortcode = "174379";
const passkey = "your_passkey";
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
    // Generate M-Pesa credentials
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, -3);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const token = await getToken();

    // STK Push request
    const stkData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone_number,
      PartyB: shortcode,
      PhoneNumber: phone_number,
      CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`,
      AccountReference: `UNIT-${unit_number}`,
      TransactionDesc: `Rent payment for unit ${unit_number}`
    };

    const response = await axios.post(
      `${baseURL}/mpesa/stkpush/v1/processrequest`,
      stkData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Store payment in your existing payments table
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
      message: "Payment request sent!",
      data: response.data,
      payment_id: payment.id
    });

  } catch (error) {
    console.error("STK Push Error:", error);
    res.status(500).json({ error: "Payment request failed" });
  }
}