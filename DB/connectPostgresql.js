require("dotenv").config()
const { Pool } = require('pg');

const pool = new Pool({
    connectionString : process.env.postgresql_URL,
    ssl: {
          rejectUnauthorized: false
    }
})


module.exports = pool;



