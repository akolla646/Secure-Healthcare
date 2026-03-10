// ============================================================
// migrate_enable_mfa.js
// One-time migration script to enable MFA for ALL existing users.
//
// The login flow already supports MFA fully — this script simply
// ensures every user in the `users` table has mfa_enabled = TRUE
// so no one can bypass the OTP step.
//
// Run once:
//   node src/scripts/migrate_enable_mfa.js
// ============================================================

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const pool = require("../config/db");

const migrate = async () => {
    try {
        console.log("🔐 Starting MFA enablement migration...");

        // Update every user to have mfa_enabled = TRUE
        // regardless of their current value
        const result = await pool.query(`
            UPDATE users
            SET mfa_enabled = TRUE
            WHERE mfa_enabled = FALSE OR mfa_enabled IS NULL
        `);

        console.log(`✅ MFA enabled for ${result.rowCount} user(s).`);

        // Verify: show count of users with MFA enabled vs total
        const check = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE mfa_enabled = TRUE)  AS mfa_on,
                COUNT(*) AS total
            FROM users
        `);

        const { mfa_on, total } = check.rows[0];
        console.log(`📊 MFA status: ${mfa_on}/${total} users have MFA enabled.`);

        if (parseInt(mfa_on) === parseInt(total)) {
            console.log("🎉 All users now have MFA enabled.");
        } else {
            console.warn(`⚠️  ${parseInt(total) - parseInt(mfa_on)} user(s) still have MFA disabled.`);
        }

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await pool.end();
    }
};

migrate();
