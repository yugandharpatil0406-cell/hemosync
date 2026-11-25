require('dotenv').config();
const mysql = require('mysql2/promise');
const embeddedDb = require('./embedded_db');

let useEmbedded = false;
let mysqlPool = null;

try {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blood_bank_system',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  mysqlPool.getConnection()
    .then(conn => {
      console.log('✓ MySQL database connected successfully on port 3306');
      conn.release();
    })
    .catch(err => {
      useEmbedded = true;
      console.warn('⚠️  MySQL offline / unreachable (' + err.message + ').');
      console.log('✓ Seamlessly activated Embedded Standalone Database Engine with full seed dataset (36 users, 30 donors, slots, inventory).');
    });
} catch (e) {
  useEmbedded = true;
  console.log('✓ Embedded Database Engine active.');
}

const db = {
  async execute(sql, params) {
    if (useEmbedded || !mysqlPool) {
      return embeddedDb.execute(sql, params);
    }
    try {
      return await mysqlPool.execute(sql, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND') {
        useEmbedded = true;
        console.warn('⚠️  Falling back to Embedded Database Engine due to MySQL error:', err.message);
        return embeddedDb.execute(sql, params);
      }
      throw err;
    }
  },

  async query(sql, params) {
    if (useEmbedded || !mysqlPool) {
      return embeddedDb.query(sql, params);
    }
    try {
      return await mysqlPool.query(sql, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND') {
        useEmbedded = true;
        console.warn('⚠️  Falling back to Embedded Database Engine due to MySQL error:', err.message);
        return embeddedDb.query(sql, params);
      }
      throw err;
    }
  },

  async getConnection() {
    if (useEmbedded || !mysqlPool) {
      return embeddedDb.getConnection();
    }
    try {
      return await mysqlPool.getConnection();
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND') {
        useEmbedded = true;
        console.warn('⚠️  Falling back to Embedded Database Engine due to MySQL error:', err.message);
        return embeddedDb.getConnection();
      }
      throw err;
    }
  }
};

module.exports = db;
