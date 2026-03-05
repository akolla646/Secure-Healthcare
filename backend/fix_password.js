require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./src/config/db");

async function fixPassword() {
    try {
        const passwordHash = await bcrypt.hash("123456", 12);
        const { rowCount } = await pool.query(
            `UPDATE users SET password_hash = $1 WHERE username = 'lia'`,
            [passwordHash]
        );
        console.log(`Updated ${rowCount} user(s) with password '123456'.`);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        pool.end();
    }
}

fixPassword();
