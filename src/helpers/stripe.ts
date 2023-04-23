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
import router from '../router';

const SHOP_NAME = 'Apple Pay Demo';

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
      label: SHOP_NAME,
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
  console.log('[UI]: get shipping for', event.shippingAddress);

  const api = useApi();
  const shippingOptions = api.getAvailableShippingOptions(event.shippingAddress);
  const cart = api.getCart(shippingOptions[0].id);

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
      label: SHOP_NAME,
      amount: priceToAmount(cart.total + shippingOptions[0].price),
    },
    displayItems: [
      ...cart.items.map((i): PaymentRequestItem => {
        return {
          label: i.name,
          amount: priceToAmount(i.price),
        };
      }),
    ],
  });
};

const handleShippingCost = (event: PaymentRequestShippingOptionEvent) => {
  console.log('[UI]: handle shipping costs');

  const api = useApi();
  const shippingOption = event.shippingOption;
  const cart = api.getCart(shippingOption.id);

  event.updateWith({
    status: 'success',
    total: {
      label: SHOP_NAME,
      amount: priceToAmount(cart.total),
    },
    displayItems: [
      ...cart.items.map((i): PaymentRequestItem => {
        return {
          label: i.name,
          amount: priceToAmount(i.price),
        };
      }),
    ],
  });
};

export const setupPaymentButton = async (
  paymentRequest: PaymentRequest,
  button: HTMLButtonElement
) => {
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
  console.log('[UI]: handle payment');
  const client = await useStripe();

  if (!event.shippingOption) {
    throw new Error('no shipping option selected');
  }

  const api = useApi();
  const paymentIntent = await api.createPaymentIntent(event);

  const { error: confirmError } = await client.confirmCardPayment(
    paymentIntent.client_secret || '',
    { payment_method: event.paymentMethod.id }
  );

  if (confirmError) {
    event.complete('fail');
    console.error('[UI]: payment could not be confirmed');
  } else {
    event.complete('success');
    console.log('[UI]: 🎉 thank you for your payment', paymentIntent);
    router.push({ name: 'thank-you' });
  }
};
