require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(bodyParser.json());

// PayPal Environment
const Environment =
  process.env.PAYPAL_ENVIRONMENT === 'production'
    ? paypal.core.LiveEnvironment
    : paypal.core.SandboxEnvironment;

const paypalClient = new paypal.core.PayPalHttpClient(
  new Environment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
);

// Create Order Route
app.get('/api', async (req, res) => {
  const { plan } = req.body;

  // Convert plan to actual amount
  let amount = '50.00';
  if (plan === 'standard') amount = '65.00';
  else if (plan === 'premium') amount = '80.00';

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount,
      },
    }],
  });

  try {
    const order = await paypalClient.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error('Create Order Error:', err);
    res.status(500).json({ error: 'Something went wrong creating order' });
  }
});

// Capture Order Route
app.post('/api/paypal/capture-order/:orderID', async (req, res) => {
  const { orderID } = req.params;

  const request = new paypal.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await paypalClient.execute(request);
    res.json({ status: 'success', capture });
  } catch (err) {
    console.error('Capture Order Error:', err);
    res.status(500).json({ error: 'Something went wrong capturing order' });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
