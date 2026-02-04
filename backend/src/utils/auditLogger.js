const pool = require("../config/db");

async function logAudit({
  actor_user_id,
  action,
  entity_type,
  entity_id
}) {
  // ✅ Allow SYSTEM events with NULL entity_id
  if (entity_type !== "SYSTEM" && !entity_id) {
    throw new Error("entity_id required for non-SYSTEM entity types");
  }

  await pool.query(
    `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, $2, $3, $4)
    `,
    [actor_user_id, action, entity_type, entity_id]
  );
}

module.exports = { logAudit };
