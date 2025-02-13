import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useSelector } from 'react-redux';
import CheckoutForm from "./CheckoutForm";
import { selectCurrentOrder } from "../features/order/orderSlice";

const stripePromise = loadStripe("pk_test_51N5NLVSF2Mo4AGVvYGMMNnTcPA5lHrkUv8zPymsKfL31c8m6et8525Y92zMgA22m1u6ZkkXsBofre0PJL6i3eVsh00sR6M8c00");

export default function StripeCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const currentOrder = useSelector(selectCurrentOrder);

  useEffect(() => {
    if (currentOrder) {
      fetch("/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: currentOrder.totalAmount,
          orderId: currentOrder.id
        }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret))
        .catch((error) => console.error("Error:", error));
    }
  }, [currentOrder]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
    },
  };

  if (!clientSecret) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading payment form...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      <Elements options={{ clientSecret, appearance }} stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}