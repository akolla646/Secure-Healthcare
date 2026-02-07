const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect()
  .then((client) => {
    console.log("PostgreSQL-Neon connected successfully");
    client.release();
  })
  .catch(err => {
    console.error(" PostgreSQL-Neon connection failed");
    console.error(err);
  });

pool.on("error", (err) => {
  console.error("Unexpected PG error on idle client", err);
});

module.exports = pool;
