import React, { useState, useEffect } from 'react';

const PaymentGateway = () => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    // Load PesaPal script
    const script = document.createElement('script');
    script.src = 'https://pay.pesapal.com/v3/pesapal.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const submitPayment = () => {
    if (!selectedMethod || !amount) {
      alert('Please select payment method and enter amount');
      return;
    }

    if (selectedMethod === 'mpesa' && !phone) {
      alert('Please enter phone number for M-Pesa');
      return;
    }

    // PesaPal configuration
    const pesapalConfig = {
      consumer_key: 'JhVPXhkCJJZ1nt/qlNQM2kYBBh9W6O4G',
      consumer_secret: 'TdHN4HQQS/ePd6+8OGP7rOJCHD4=',
      environment: 'live'
    };

    const orderData = {
      id: 'ORDER_' + Date.now(),
      currency: 'KES',
      amount: parseFloat(amount),
      description: 'Rent Payment - Al Mubarak Apartments',
      callback_url: 'https://almubarak.kinnetikdevelopers.com/success',
      cancellation_url: 'https://almubarak.kinnetikdevelopers.com/cancelled',
      notification_id: 'PAYMENT_' + Date.now(),
      billing_address: {
        email_address: 'tenant@almubarak.com',
        phone_number: phone || '0700000000',
        country_code: 'KE',
        first_name: 'Tenant',
        middle_name: '',
        last_name: 'User',
        line_1: 'Al Mubarak Apartments',
        line_2: '',
        city: 'Nairobi',
        state: 'Nairobi',
        postal_code: '00100',
        zip_code: '00100'
      }
    };

    // Initialize PesaPal payment
    if (window.pesapal) {
      window.pesapal.init(pesapalConfig);
      window.pesapal.newTransaction(orderData);
    } else {
      alert('Payment system not loaded. Please refresh and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quick Payment</h1>
          <p className="text-gray-600">Al Mubarak Apartments</p>
        </div>

        {!selectedMethod ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700 text-center mb-6">
              Choose Payment Method
            </h2>
            
            <button
              onClick={() => setSelectedMethod('mpesa')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">📱</span>
              <span>M-Pesa</span>
            </button>

            <button
              onClick={() => setSelectedMethod('card')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">💳</span>
              <span>Card Payment</span>
            </button>

            <button
              onClick={() => setSelectedMethod('airtel')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">📱</span>
              <span>Airtel Money</span>
            </button>

            <button
              onClick={() => setSelectedMethod('bank')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-3 transition-all duration-200 transform hover:scale-105"
            >
              <span className="text-2xl">🏦</span>
              <span>Bank Transfer</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-700">
                {selectedMethod === 'mpesa' && 'M-Pesa Payment'}
                {selectedMethod === 'card' && 'Card Payment'}
                {selectedMethod === 'airtel' && 'Airtel Money'}
                {selectedMethod === 'bank' && 'Bank Transfer'}
              </h2>
              <button
                onClick={() => setSelectedMethod('')}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Change Method
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              {(selectedMethod === 'mpesa' || selectedMethod === 'airtel') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Card Number"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex space-x-4">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                      className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cardholder Name"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )}

              <button
                onClick={submitPayment}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Pay KES {amount || '0'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;
