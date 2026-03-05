const pool = require("./src/config/db");

async function checkUser(username) {
    try {
        const { rows } = await pool.query(
            `
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.is_active,
        u.is_locked,
        u.password_hash IS NOT NULL as has_password,
        r.role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.role_id
      WHERE LOWER(u.username) = $1 OR LOWER(u.email) = $1
      `,
            [username.toLowerCase()]
        );
        console.log("User details:", rows);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        pool.end();
    }
}

checkUser("lia");
