"use strict";

const { logAudit } = require("../utils/auditLogger");

module.exports.authorize = (...allowedRoles) => {

  const roles = allowedRoles.flat();

  return async (req, res, next) => {
    // ❌ No authenticated user / role
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: "Role not found in token"
      });
    }

    // ❌ Role not allowed → audit
    if (!roles.includes(req.user.role)) {
      await logAudit({
        actor_user_id: req.user.user_id,
        action: "PERMISSION_DENIED",
        entity_type: "SYSTEM",
        entity_id: null
      });

      return res.status(403).json({
        error: "Access denied"
      });
    }

    // ✅ Role allowed
    next();
  };
};
