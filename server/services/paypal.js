import { Client, Environment, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk';

let ordersCtrl = null;
let paymentsCtrl = null;

function getControllers() {
  if (ordersCtrl) return { ordersCtrl, paymentsCtrl };

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing.');
  }

  const client = new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: Environment.Sandbox,
  });

  ordersCtrl = new OrdersController(client);
  paymentsCtrl = new PaymentsController(client);
  return { ordersCtrl, paymentsCtrl };
}

export async function createOrder(amount, bookingId) {
  const { ordersCtrl } = getControllers();
  const baseUrl = process.env.EXPO_PUBLIC_GOOGLE_AUTH_URL || 'https://boggle-bakeshop-fridge.ngrok-free.dev';
  const refId = bookingId || `walkwi_${Date.now()}`;

  const response = await ordersCtrl.createOrder({
    body: {
      intent: 'CAPTURE',
      purchaseUnits: [{
        referenceId: refId,
        amount: {
          currencyCode: 'USD',
          value: String(Number(amount).toFixed(2)),
        },
        description: 'Walkwi - Servicio de paseo de mascota',
      }],
      applicationContext: {
        brandName: 'Walkwi',
        landingPage: 'BILLING',
        userAction: 'PAY_NOW',
        returnUrl: `${baseUrl}/api/payments/capture-return?orderId=${encodeURIComponent(refId)}`,
        cancelUrl: `${baseUrl}/api/payments/cancel`,
      },
    },
    prefer: 'return=representation',
  });

  const result = response.result || response;
  const approveLink = result.links?.find((l) => l.rel === 'approve');

  return {
    orderId: result.id,
    approveUrl: approveLink?.href || null,
    status: result.status,
  };
}

export async function captureOrder(orderId) {
  const { ordersCtrl } = getControllers();

  const response = await ordersCtrl.captureOrder({
    id: orderId,
    prefer: 'return=representation',
    body: {},
  });

  const result = response.result || response;
  const capture = result.purchaseUnits?.[0]?.payments?.captures?.[0];

  return {
    captureId: capture?.id || null,
    status: capture?.status || result.status,
    amount: capture?.amount?.value,
    payerId: result.payer?.payerId,
  };
}

export async function refundPayment(captureId, amount) {
  const { paymentsCtrl } = getControllers();

  const response = await paymentsCtrl.refundCapturedPayment({
    captureId,
    body: amount
      ? { amount: { currency_code: 'USD', value: String(Number(amount).toFixed(2)) } }
      : {},
  });

  const result = response.result || response;

  return {
    refundId: result.id,
    status: result.status,
    amount: result.amount?.value,
  };
}
