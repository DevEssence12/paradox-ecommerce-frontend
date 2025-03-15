import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const RazorpayPaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  
  // Use the correct environment variable format for React
  const API_URL = process.env.REACT_APP_API_URL;
  const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get payment details from URL params
        const paymentId = searchParams.get('razorpay_payment_id');
        const orderId = searchParams.get('razorpay_order_id');
        const signature = searchParams.get('razorpay_signature');
        
        if (!paymentId || !orderId || !signature) {
          setStatus('failed');
          setError('Missing payment information');
          return;
        }

        // Verify the payment with your backend
        const response = await fetch(`${API_URL}/verify-razorpay-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentId,
            razorpay_order_id: orderId,
            razorpay_signature: signature,
            key_id: RAZORPAY_KEY_ID, // Include key ID for additional verification if needed
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          // Redirect to order success page after a short delay
          setTimeout(() => {
            navigate(`/order-success/${data.orderId || 'unknown'}`);
          }, 2000);
        } else {
          setStatus('failed');
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        setStatus('failed');
        setError('Error processing payment');
        console.error('Payment verification error:', err);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, API_URL, RAZORPAY_KEY_ID]);

  return (
    <div className="container mx-auto max-w-md p-8 mt-10">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">
          Payment {status === 'processing' ? 'Processing' : status === 'success' ? 'Successful' : 'Failed'}
        </h2>
        
        {status === 'processing' && (
          <div className="flex justify-center my-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2">Your payment was successful. Redirecting to order details...</p>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2">{error || 'Your payment failed. Please try again.'}</p>
            <button 
              onClick={() => navigate('/checkout')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorpayPaymentCallback;