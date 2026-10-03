// MySQL 连接池封装。提供 query / exec / transaction 三个方法，业务层只调这个。
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool(config.mysql);

// 普通查询，返回行数组
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// 执行写操作，返回 { insertId, affectedRows }
async function exec(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

// 事务：把一系列操作包在一个连接里，全部成功才提交
async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const res = await fn(conn);
    await conn.commit();
    return res;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// 事务内用的执行器（用同一个 conn）
function withConn(conn) {
  return {
    query: (sql, params = []) => conn.execute(sql, params).then(([r]) => r),
    exec: (sql, params = []) => conn.execute(sql, params).then(([r]) => r)
  };
}

module.exports = { pool, query, exec, transaction, withConn };
