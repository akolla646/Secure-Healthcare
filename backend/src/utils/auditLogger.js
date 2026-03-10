/**
 * Audit Logger Utility
 * 
 * This module provides centralized audit logging functionality for tracking
 * security-relevant events throughout the application. All significant actions
 * (login, logout, data access, permission denials) are logged for compliance
 * and security monitoring.
 * 
 * The audit logs are stored in the PostgreSQL audit_logs table and can be
 * reviewed by administrators through the admin dashboard.
 * 
 * @module utils/auditLogger
 */

// Database connection pool for executing audit log inserts
const pool = require("../config/db");

/**
 * Log an Audit Event
 * 
 * Records a security or compliance event in the audit_logs table.
 * 
 * @async
 * @param {Object} params - The audit log parameters
 * @param {string} params.actor_user_id - UUID of the user performing the action (can be null for system events)
 * @param {string} params.action - The action type (e.g., 'LOGIN_PASSWORD_SUCCESS', 'PERMISSION_DENIED', 'VERIFY_LAB_REPORT')
 * @param {string} params.entity_type - Type of entity being acted upon (e.g., 'USER', 'PATIENT', 'LAB_REPORT', 'SYSTEM')
 * @param {string|null} params.entity_id - UUID of the specific entity (null allowed only for SYSTEM entity_type)
 * @param {string|null} params.ip_address - IP address of the actor (optional)
 * @param {Object} [params.db] - Optional database client for transaction support
 * 
 * @throws {Error} If entity_id is null for non-SYSTEM entity types
 */
async function logAudit({
  actor_user_id,
  action,
  entity_type,
  entity_id,
  ip_address = null,
  db = pool
}) {
  // ✅ Validation: Allow NULL entity_id only for SYSTEM events
  // This ensures all non-system events have a traceable entity reference
  if (entity_type !== "SYSTEM" && !entity_id) {
    throw new Error("entity_id required for non-SYSTEM entity types");
  }

  // Insert the audit log entry into the database
  await db.query(
    `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      ip_address
    )
    VALUES ($1, $2, $3, $4, $5)
    `,
    [actor_user_id, action, entity_type, entity_id, ip_address]
  );
}

module.exports = { logAudit };
