/**
 * Role-Based Authorization Middleware (RBAC)
 * Restricts route access based on user roles.
 */

"use strict";

const { logAudit } = require("../utils/auditLogger");

// Middleware factory to allow specific roles
module.exports.authorize = (...allowedRoles) => {

  // Support both array and multiple arguments
  const roles = allowedRoles.flat();

  return async (req, res, next) => {

    // Ensure role exists (auth middleware should run first)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: "Role not found in token" });
    }

    // Deny access if role not allowed
    if (!roles.includes(req.user.role)) {

      // Log unauthorized attempt
      await logAudit({
        actor_user_id: req.user.user_id,
        action: "PERMISSION_DENIED",
        entity_type: "SYSTEM",
        entity_id: null
      });

      return res.status(403).json({ error: "Access denied" });
    }

    next(); // Role authorized
  };
};
