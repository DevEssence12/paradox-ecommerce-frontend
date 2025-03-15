import React from 'react';
import RazorpayPaymentForm from './Razorpaypayment';

export default function Checkout() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
          <p className="text-gray-600">Please complete your payment to finish your order.</p>
        </div>
      </div>

      <RazorpayPaymentForm />
    </div>
  );
}