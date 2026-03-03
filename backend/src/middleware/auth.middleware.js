/**
 * Authentication Middleware
 * Verifies JWT from Authorization header and attaches user data to req.user.
 */

"use strict";

const jwt = require("jsonwebtoken");

// Middleware to validate JWT
module.exports.authenticate = (req, res, next) => {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authorization token missing"
        });
    }

    // Extract the token by splitting "Bearer <token>"
    const token = authHeader.split(" ")[1];

    try {
        // Verify the token using the JWT secret from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user information to the request object
        // This makes user_id and role available to all subsequent middleware and routes
        req.user = decoded;

        // Continue to the next middleware or route handler
        next();
    } catch (err) {
        // Token is invalid or expired
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
};
