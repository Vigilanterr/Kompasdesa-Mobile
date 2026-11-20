import crypto from 'crypto';

export const createMidtransTransaction = async (params: {
    order_id: number;
    gross_amount: number;
    customer_email: string;
}) => {
    try {
        const serverKey = process.env.SERVER_KEY;
        if (!serverKey) {
            console.error('SERVER_KEY tidak diatur di environment');
            return null;
        }

        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
        const baseUrl = isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const orderId = `ORDER-${params.order_id}-${Date.now()}`;
        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(params.gross_amount),
            },
            customer_details: {
                email: params.customer_email,
            },
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

        const data = await response.json() as any;
        return data.token || null;
    } catch (error) {
        console.error('Error membuat transaksi Midtrans:', error);
        return null;
    }
};

export const verifyMidtransNotification = (notification: any): boolean => {
    try {
        const serverKey = process.env.SERVER_KEY;
        if (!serverKey) return false;

        const { order_id, status_code, gross_amount, signature_key } = notification;
        const data = `${order_id}${status_code}${gross_amount}${serverKey}`;
        const hash = crypto.createHash('sha512').update(data).digest('hex');

        return hash === signature_key;
    } catch (error) {
        console.error('Error memverifikasi notifikasi Midtrans:', error);
        return false;
    }
};
