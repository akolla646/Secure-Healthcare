/**
 * Authentication Middleware
 * Verifies JWT from Authorization header and attaches user data to req.user.
 */

"use strict";

const jwt = require("jsonwebtoken");

// Middleware to validate JWT
module.exports.authenticate = (req, res, next) => {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Validate header format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authorization token missing" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    try {
        // Verify token using secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded payload to request
        req.user = decoded;

        next(); // Proceed to next middleware
    } catch (err) {
        // Token invalid or expired
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};
