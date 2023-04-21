import { useApi, type Cart } from '@/api';
import {
  loadStripe,
  type Stripe,
  type PaymentRequest,
  type PaymentRequestPaymentMethodEvent,
  type PaymentRequestItem,
  type PaymentRequestShippingAddressEvent,
  type PaymentRequestShippingOption,
  type PaymentRequestShippingOptionEvent,
} from '@stripe/stripe-js';

let _client: Stripe | null = null;

export const useStripe = async (): Promise<Stripe> => {
  if (_client) return _client;

  _client = await loadStripe(import.meta.env.VITE_STRIPE_API_KEY);
  if (!_client) {
    throw new Error('Could not load stripe');
  }

  return _client;
};

const priceToAmount = (price: number): number => {
  return price * 100;
};

export const createPaymentRequest = async (cart: Cart): Promise<PaymentRequest> => {
  const client = await useStripe();

  const paymentRequest = client.paymentRequest({
    country: 'CH',
    currency: 'chf',
    total: {
      label: 'My Shop Name',
      amount: priceToAmount(cart.total),
    },
    displayItems: cart.items.map((i): PaymentRequestItem => {
      return {
        label: i.name,
        amount: priceToAmount(i.price),
      };
    }),
    requestPayerName: true,
    requestPayerEmail: true,
    requestPayerPhone: true,
    requestShipping: true,
    shippingOptions: [],
  });

  paymentRequest.on('shippingaddresschange', handleShipping);
  paymentRequest.on('shippingoptionchange', handleShippingCost);
  paymentRequest.on('paymentmethod', handlePayment);

  return paymentRequest;
};

const handleShipping = (event: PaymentRequestShippingAddressEvent) => {
  console.log('get shipping for', event.shippingAddress);

  const api = useApi();
  const cart = api.getCart();
  const shippingOptions = api.getAvailableShippingOptions(event.shippingAddress);

  event.updateWith({
    status: 'success',
    shippingOptions: shippingOptions.map((s): PaymentRequestShippingOption => {
      return {
        id: s.id,
        label: s.label,
        detail: s.detail,
        amount: priceToAmount(s.price),
      };
    }),
    total: {
      label: 'My Shop Name',
      amount: priceToAmount(cart.total + shippingOptions[0].price),
    },
    displayItems: [
      ...cart.items.map((i): PaymentRequestItem => {
        return {
          label: i.name,
          amount: priceToAmount(i.price),
        };
      }),
      // default shipping options
      {
        label: shippingOptions[0].label,
        amount: priceToAmount(shippingOptions[0].price),
      },
    ],
  });
};

const handleShippingCost = (event: PaymentRequestShippingOptionEvent) => {
  console.log('handle shipping costs');

  const api = useApi();
  const cart = api.getCart();
  const shippingOption = event.shippingOption;

  event.updateWith({
    status: 'success',
    total: {
      label: 'My Shop Name',
      amount: priceToAmount(cart.total) + shippingOption.amount,
    },
    displayItems: [
      ...cart.items.map((i): PaymentRequestItem => {
        return {
          label: i.name,
          amount: priceToAmount(i.price),
        };
      }),
      {
        label: shippingOption.label,
        amount: shippingOption.amount,
      },
    ],
  });
};

export const setupPaymentButton = async (paymentRequest: PaymentRequest, button: HTMLButtonElement) => {
  const client = await useStripe();

  const elements = client.elements();
  const prButton = elements.create('paymentRequestButton', {
    paymentRequest,
  });

  const result = await paymentRequest.canMakePayment();
  if (!result) {
    throw new Error('Apple Pay is not available');
  }

  prButton.mount(button);
};

export const handlePayment = async (event: PaymentRequestPaymentMethodEvent): Promise<void> => {
  const client = await useStripe();

  if (!event.shippingOption) {
    throw new Error('no shipping option selected');
  }

  const api = useApi();
  const paymentIntent = await api.createPaymentIntent(event);

  const { paymentIntent: updatedPaymentIntent, error: confirmError } =
    await client.confirmCardPayment(
      paymentIntent.client_secret || '',
      { payment_method: event.paymentMethod.id },
      { handleActions: false }
    );

  if (confirmError) {
    event.complete('fail');
  } else {
    event.complete('success');

    if (paymentIntent.status === 'requires_action') {
      const { error } = await client.confirmCardPayment(updatedPaymentIntent.client_secret || '');
      if (error) {
        console.error('payment could not be confirmed');
        return;
      }
    }

    console.log('🎉 thank you for your payment', paymentIntent);
  }
};
