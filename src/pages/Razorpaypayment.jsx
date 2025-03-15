import React, { useState } from 'react';
const API_URL = process.env.REACT_APP_API_URL;
const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

// Add check for Razorpay key
if (!RAZORPAY_KEY_ID) {
  console.error('Razorpay Key ID is missing. Please check your .env file.');
}

export default function RazorpayPaymentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(10);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      // Generate a simple order ID (in production, this should come from your order system)
      const orderId = `order_${Date.now()}`;

      // Create order on your backend
      const response = await fetch(`${API_URL}/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Razorpay expects amount in paise (1 INR = 100 paise)
          currency: 'INR',
          receipt: orderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const { id: razorpayOrderId, amount: orderAmount, currency } = await response.json();

      const options = {
        key: RAZORPAY_KEY_ID, // Using the variable we defined at the top
        amount: orderAmount,
        currency: currency,
        name: 'Your Store Name',
        description: 'Purchase Description',
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            // Verify payment on your backend
            const verifyResponse = await fetch(`${API_URL}/verify-razorpay-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            const { success } = await verifyResponse.json();
            if (success) {
              // Payment successful - redirect to success page
              window.location.href = `/order-success/${orderId}`;
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#3B82F6', // Blue color matching your UI
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold text-center mb-6">Payment Details</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-md">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount (INR)
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">₹</span>
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Pay with Razorpay'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          Secure payment powered by Razorpay
        </p>
      </div>
    </div>
  );
}