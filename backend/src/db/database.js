import sqlite3 from 'sqlite3';
import { DB_PATH } from '../config.js';
import { promisify } from 'util';

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('❌ Error conectando a SQLite:', err.message);
  else console.log(`✅ Conectado a SQLite en ${DB_PATH}`);
});

// Promisify helpers
db.allAsync = promisify(db.all.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

export default db;
