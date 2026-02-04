const bcrypt = require("bcrypt");

async function hashPassword(plainPassword) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log("Plain Password:", plainPassword);
  console.log("Hashed Password:", hash);
}

hashPassword("adam123");   // change password if you want
