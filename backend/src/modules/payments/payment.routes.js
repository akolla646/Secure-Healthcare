const express = require('express');
const router = express.Router();
const controller = require('./payment.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// POST /api/payments/create-checkout-session (Protected)
router.post('/create-checkout-session', authenticate, controller.createCheckoutSession);

// GET /api/payments/verify-session (Protected)
router.get('/verify-session', authenticate, controller.verifyCheckoutSession);

// POST /api/payments/webhook (Public - Stripe signature verification) call this without auth headers (signature verified internally)
// Note: This route requires raw body parsing, which should be handled in app.js or specific middleware here
router.post('/webhook', express.raw({ type: 'application/json' }), controller.handleWebhook);

module.exports = router;
