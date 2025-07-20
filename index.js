require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paypal = require('@paypal/checkout-server-sdk');

const app = express();
app.use(cors({ origin: 'https://vinclarify.info' }));
app.use(bodyParser.json());

const environment =
  process.env.PAYPAL_ENVIRONMENT === 'production'
    ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
    : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const client = new paypal.core.PayPalHttpClient(environment);

app.post('/api/paypal/create-order', async (req, res) => {
  const { amount, vin, plan } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [
      {
        description: `VIN: ${vin}, Plan: ${plan}`,
        amount: {
          currency_code: "USD",
          value: amount
        }
      }
    ]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
});

app.post('/api/paypal/capture-order/:orderID', async (req, res) => {
  const request = new paypal.orders.OrdersCaptureRequest(req.params.orderID);
  request.requestBody({});
  try {
    const capture = await client.execute(request);
    res.json(capture.result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Capture failed");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
