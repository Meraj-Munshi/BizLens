require('dotenv').config();
const fs=require('fs');
const {Pool}=require('pg');
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Add the Neon pooled connection string.');
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined,max:2});
async function setup(){
 const client=await pool.connect();
 try{
  const schema=fs.readFileSync(__dirname+'/../database/schema.postgres.sql','utf8');
  await client.query('BEGIN');
  await client.query(schema);
  await client.query('COMMIT');
  console.log('Neon PostgreSQL schema ready.');
 }catch(error){await client.query('ROLLBACK');throw error;}
 finally{client.release();await pool.end();}
}
setup().catch(error=>{console.error('Database setup failed:',error.message);process.exit(1);});
