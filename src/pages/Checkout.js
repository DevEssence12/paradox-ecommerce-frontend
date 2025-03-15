import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectItems } from '../features/cart/cartSlice';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { updateUserAsync } from '../features/user/userSlice';
import { createOrderAsync, selectCurrentOrder, selectStatus } from '../features/order/orderSlice';
import { selectUserInfo } from '../features/user/userSlice';
import { Grid } from 'react-loader-spinner';

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID;
if (!RAZORPAY_KEY_ID) {
  console.error('Razorpay Key ID is missing. Please check your .env file.');
}

function Checkout() {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const user = useSelector(selectUserInfo);
  const items = useSelector(selectItems);
  const status = useSelector(selectStatus);
  const currentOrder = useSelector(selectCurrentOrder);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = items.reduce(
    (amount, item) => item.product.discountPrice * item.quantity + amount,
    0
  );
  const totalItems = items.reduce((total, item) => item.quantity + total, 0);

  const [selectedAddress, setSelectedAddress] = useState(null);

  const handleAddress = (e) => {
    const selectedAddressData = JSON.parse(e.target.value);
    setSelectedAddress(selectedAddressData);
  };

  const handleRazorpayPayment = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }
  
    try {
      setIsProcessing(true);
      setPaymentError(null);
  
      // Verify Razorpay is loaded
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }
  
      // Create a unique order ID
      const tempOrderId = Date.now().toString();
  
      // Create order on server
      const response = await fetch('/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          totalAmount: totalAmount,
          orderId: tempOrderId,
          userId: user.id,
          products: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.discountPrice
          }))
        }),
        credentials: 'include' // Ensure cookies are sent with the request
      });
  
      if (!response.ok) {
        const errorText = await response.text(); // Get the raw response text
        console.error('Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to create payment order');
        } catch (parseError) {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
  
      const orderData = await response.json();
      console.log('Razorpay order created:', orderData);
  
      // Open Razorpay payment modal
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: totalAmount * 100, // Convert to paise
        currency: "INR",
        name: "Paradox E-Commerce",
        description: "Purchase Payment",
        order_id: orderData.order.id, // Use the correct property from your response
        handler: async function (response) {
          console.log('Payment successful:', response);
  
          try {
            // Verify payment on server
            const verifyResponse = await fetch('/payments/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              }),
              credentials: 'include'
            });
  
            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.message || 'Payment verification failed');
            }
  
            const verificationData = await verifyResponse.json();
            console.log('Payment verified:', verificationData);
  
            // Create order in your system after payment verification
            const order = {
              items,
              totalAmount,
              totalItems,
              user: user.id,
              paymentMethod: 'razorpay',
              selectedAddress,
              status: 'pending',
              paymentData: {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              }
            };
            dispatch(createOrderAsync(order));
  
          } catch (verifyError) {
            console.error('Payment verification failed:', verifyError);
            setPaymentError('Payment was processed but verification failed. Please contact support.');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: selectedAddress?.phone || '',
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log('Payment modal dismissed');
          }
        }
      };
  
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setPaymentError(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });
  
      razorpay.open();
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      setPaymentError(error.message || 'Failed to create payment order. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!items.length) {
    return <Navigate to="/" replace={true} />;
  }

  if (currentOrder) {
    return <Navigate to={`/order-success/${currentOrder.id}`} replace={true} />;
  }

  if (status === 'loading' || isProcessing) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Grid
          height="80"
          width="80"
          color="rgb(79, 70, 229)"
          ariaLabel="grid-loading"
          radius="12.5"
          visible={true}
        />
        <p className="ml-4 text-lg text-gray-700">
          {isProcessing ? 'Processing payment...' : 'Loading...'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {paymentError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4 mb-4" role="alert">
          <strong className="font-bold">Error! </strong>
          <span className="block sm:inline">{paymentError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <form
            className="bg-white px-5 py-12 mt-12"
            noValidate
            onSubmit={handleSubmit((data) => {
              dispatch(
                updateUserAsync({
                  ...user,
                  addresses: [...user.addresses, data],
                })
              );
              reset();
            })}
          >
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="text-2xl font-semibold leading-7 text-gray-900">
                  Shipping Address
                </h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Add a new delivery address
                </p>

                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Full name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('name', {
                          required: 'Name is required',
                        })}
                        id="name"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.name && (
                        <p className="text-red-500">{errors.name.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        {...register('email', {
                          required: 'Email is required',
                        })}
                        type="email"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.email && (
                        <p className="text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Phone
                    </label>
                    <div className="mt-2">
                      <input
                        id="phone"
                        {...register('phone', {
                          required: 'Phone is required',
                        })}
                        type="tel"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.phone && (
                        <p className="text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <label
                      htmlFor="street"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Street address
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('street', {
                          required: 'Street address is required',
                        })}
                        id="street"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.street && (
                        <p className="text-red-500">{errors.street.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2 sm:col-start-1">
                    <label
                      htmlFor="city"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      City
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('city', {
                          required: 'City is required',
                        })}
                        id="city"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.city && (
                        <p className="text-red-500">{errors.city.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      State
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('state', {
                          required: 'State is required',
                        })}
                        id="state"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.state && (
                        <p className="text-red-500">{errors.state.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="pinCode"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      PIN Code
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        {...register('pinCode', {
                          required: 'PIN Code is required',
                        })}
                        id="pinCode"
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                      />
                      {errors.pinCode && (
                        <p className="text-red-500">{errors.pinCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-x-6">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="text-sm font-semibold leading-6
                  text-gray-700 hover:text-gray-900"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="text-sm font-semibold leading-6 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md py-2 px-4"
                >
                  Save Address
                </button>
              </div>
            </div>
          </form>

          <div className="mt-4">
            <h2 className="text-2xl font-semibold leading-7 text-gray-900">
              Saved Addresses
            </h2>
            <select
              value={selectedAddress ? JSON.stringify(selectedAddress) : ''}
              onChange={handleAddress}
            >
              <option value="">Select an address</option>
              {user.addresses.map((address, index) => (
                <option key={index} value={JSON.stringify(address)}>
                  {address.name}, {address.street}, {address.city}, {address.state}, {address.pinCode}
                </option>
              ))}
            </select>
            {selectedAddress && (
              <div className="mt-4">
                <h3>Selected Address:</h3>
                <p>
                  {selectedAddress.name}, {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.pinCode}
                </p>
                <p>Phone: {selectedAddress.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white px-5 py-12">
            <h2 className="text-2xl font-semibold leading-7 text-gray-900">
              Order Summary
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Summary of your order
            </p>

            <div className="mt-10">
              <ul>
                {items.map((item, index) => (
                  <li key={index} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{item.product.name}</span>
                    <span className="text-sm font-medium text-gray-900">{item.quantity} x ₹{item.product.discountPrice}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 py-6">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <span>Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleRazorpayPayment}
                  className="text-sm font-semibold leading-6 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md py-2 px-4 w-full"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
