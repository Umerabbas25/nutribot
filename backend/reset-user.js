require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => client.query('DELETE FROM users WHERE "phoneNumber" = $1', ['923354506534']))
  .then(r => {
    console.log('✅ User reset! Rows deleted:', r.rowCount);
    return client.end();
  })
  .catch(e => {
    console.log('Error:', e.message);
    client.end();
  });
