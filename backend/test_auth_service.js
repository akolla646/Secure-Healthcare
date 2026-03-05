require("dotenv").config();
const authService = require("./src/modules/auth/auth.service");

async function testLogin() {
    try {
        const result = await authService.login("lia", "123456");
        console.log("Login Success:", result);
    } catch (err) {
        console.error("Login Failed:", err.message);
    } finally {
        process.exit(0);
    }
}

testLogin();
