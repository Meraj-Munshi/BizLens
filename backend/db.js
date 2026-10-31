require('dotenv').config();
const { Pool } = require('pg');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for Neon PostgreSQL.');
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('JWT_SECRET must be at least 32 characters.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined, max: Number(process.env.DB_CONNECTION_LIMIT) || 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
function prepare(sql) {
 let i=0;
 let text=sql.replace(/\?/g,()=>'$'+(++i));
 if (/^\s*INSERT\s+INTO\s+/i.test(text) && !/\bRETURNING\b/i.test(text)) text=text.replace(/;?\s*$/,' RETURNING id');
 return text;
}
function shape(sql,r) {
 const rows=r.rows||[];
 if (/^\s*INSERT\s+INTO\s+/i.test(sql)) return [{insertId:rows[0]?.id===undefined?undefined:Number(rows[0].id),affectedRows:r.rowCount||0},rows];
 return [rows,{affectedRows:r.rowCount||0,rowCount:r.rowCount||0}];
}
async function query(sql,params=[]) { return shape(sql,await pool.query(prepare(sql),params)); }
async function getConnection() {
 const client=await pool.connect();
 return {query:async(sql,params=[])=>shape(sql,await client.query(prepare(sql),params)),beginTransaction:()=>client.query('BEGIN'),commit:()=>client.query('COMMIT'),rollback:()=>client.query('ROLLBACK'),release:()=>client.release()};
}
module.exports={query,getConnection,end:()=>pool.end()};
