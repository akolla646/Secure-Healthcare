const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../../config/db');

/**
 * createCheckoutSession
 * 
 * Creates a Stripe Checkout Session for a payment.
 * 
 * @body {number} amount - Amount in cents (or base unit)
 * @body {string} currency - Currency code (default: usd)
 * @body {string} description - Payment description
 * @body {number} userId - ID of the user making the payment
 */
exports.createCheckoutSession = async (req, res) => {
    try {
        const { amount, currency = 'usd', description, userId } = req.body;

        if (!amount || !userId) {
            return res.status(400).json({ error: 'Amount and User ID are required' });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency,
                    product_data: {
                        name: description || 'Medical Service Payment',
                    },
                    unit_amount: amount * 100, // Stripe expects cents
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
            metadata: {
                userId,
                appointmentId: req.body.appointmentId, // Pass appointment ID to webhook
                description
            }
        });

        // Save PENDING payment to DB
        await pool.query(
            `INSERT INTO payments (user_id, amount, currency, stripe_session_id, status, description)
             VALUES ($1, $2, $3, $4, 'PENDING', $5)`,
            [userId, amount, currency, session.id, description]
        );

        res.json({ url: session.url, sessionId: session.id });

    } catch (error) {
        console.error('--- STRIPE CHECKOUT ERROR ---');
        console.error('Request Body:', req.body);
        console.error('Error Object:', error);
        console.error('Error Message:', error.message);

        // Write to log file for agent visibility
        const fs = require('fs');
        fs.appendFileSync('stripe_error.log', `[${new Date().toISOString()}] STRIPE ERROR: ${error.message}\nBody: ${JSON.stringify(req.body)}\nStack: ${error.stack}\n\n`);

        res.status(500).json({ error: 'Payment initiation failed', details: error.message });
    }
};

/**
 * handleWebhook
 * 
 * Verifies and handles Stripe webhook events.
 * 
 * @requires STRIPE_WEBHOOK_SECRET
 */
exports.handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // req.body must be raw buffer for signature verification
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook details:', {
            sigHeader: sig,
            bodyType: typeof req.body,
            bodyLength: req.body ? req.body.length : 0
        });
        console.error(`Webhook Signature Verification Failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle specific events
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.log(`Payment successful for session: ${session.id}`);

            // Update DB status to PAID in payments table
            await pool.query(
                `UPDATE payments SET status = 'PAID' WHERE stripe_session_id = $1`,
                [session.id]
            );

            // Update DB status in appointments table to 'PAID' if appointmentId is present
            if (session.metadata && session.metadata.appointmentId) {
                await pool.query(
                    `UPDATE appointments SET status = 'PAID' WHERE appointment_id = $1`,
                    [session.metadata.appointmentId]
                );
                console.log(`Appointment ${session.metadata.appointmentId} updated to PAID`);
            }

        } else if (event.type === 'checkout.session.async_payment_failed' || event.type === 'checkout.session.expired') {
            const session = event.data.object;
            console.log(`Payment failed/expired for session: ${session.id}`);

            // Update DB status to FAILED in payments table
            await pool.query(
                `UPDATE payments SET status = 'FAILED' WHERE stripe_session_id = $1`,
                [session.id]
            );
        }

        res.status(200).json({ received: true });

    } catch (err) {
        console.error(`Webhook Processing Error: ${err.message}`);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

/**
 * verifyCheckoutSession
 * 
 * Proactively verifies a checkout session with Stripe and updates the DB 
 * if the webhook hasn't arrived yet.
 */
exports.verifyCheckoutSession = async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === 'paid') {
            // Update payments table
            await pool.query(
                `UPDATE payments SET status = 'PAID' WHERE stripe_session_id = $1`,
                [session.id]
            );

            // Update appointments table if linked
            if (session.metadata && session.metadata.appointmentId) {
                await pool.query(
                    `UPDATE appointments SET status = 'PAID' WHERE appointment_id = $1`,
                    [session.metadata.appointmentId]
                );
            }
            return res.json({ status: 'paid' });
        }

        res.json({ status: session.payment_status });
    } catch (error) {
        console.error('Verify Session Error:', error);
        res.status(500).json({ error: 'Failed to verify session' });
    }
};
