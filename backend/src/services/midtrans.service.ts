import crypto from 'crypto';

export const createMidtransTransaction = async (params: { order_id: number; gross_amount: number; customer_email: string }) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error('MIDTRANS_SERVER_KEY not configured');
      return null;
    }

    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

    const transactionDetails = {
      order_id: `ORDER-${params.order_id}-${Date.now()}`,
      gross_amount: Math.round(parseFloat(params.gross_amount.toString())),
    };

    const customerDetails = {
      email: params.customer_email,
    };

    const payload = {
      transaction_details: transactionDetails,
      customer_details: customerDetails,
    };

    const auth = Buffer.from(`${serverKey}:`).toString('base64');

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Midtrans API error:', response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as any;
    return data.token || null;
  } catch (error) {
    console.error('Error creating Midtrans transaction:', error);
    return null;
  }
};

export const verifyMidtransNotification = (notification: any): boolean => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      return false;
    }

    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;
    const signatureKey = notification.signature_key;

    const data = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const hash = crypto.createHash('sha512').update(data).digest('hex');

    return hash === signatureKey;
  } catch (error) {
    console.error('Error verifying Midtrans notification:', error);
    return false;
  }
};
