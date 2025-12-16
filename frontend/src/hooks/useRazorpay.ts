import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay script');
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const openPayment = useCallback(
    async ({
      orderId,
      amount,
      currency = 'INR',
      name = 'HorizonFit',
      description,
      prefill,
      onSuccess,
      onError,
      onDismiss,
    }: {
      orderId: string;
      amount: number;
      currency?: string;
      name?: string;
      description: string;
      prefill?: { name?: string; email?: string; contact?: string };
      onSuccess: (response: RazorpayResponse) => void;
      onError?: (error: Error) => void;
      onDismiss?: () => void;
    }) => {
      if (!isLoaded) {
        onError?.(new Error('Razorpay is not loaded yet'));
        return;
      }

      setIsLoading(true);

      try {
        const options: RazorpayOptions = {
          key: RAZORPAY_KEY,
          amount: amount * 100, // Razorpay expects amount in paise
          currency,
          name,
          description,
          order_id: orderId,
          handler: (response) => {
            setIsLoading(false);
            onSuccess(response);
          },
          prefill,
          theme: {
            color: '#E8673C',
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              onDismiss?.();
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } catch (error) {
        setIsLoading(false);
        onError?.(error as Error);
      }
    },
    [isLoaded]
  );

  return { isLoaded, isLoading, openPayment };
};
