require('dotenv').config();
const db=require('./db');
const bcrypt=require('bcryptjs');
const cats=['Rent','Salaries','Marketing','Utilities','Transport','Other'];
async function insert(sql,params){const [meta]=await db.query(sql,params);return meta.insertId;}
async function main(){
 const passwordHash=await bcrypt.hash('Demo@123',10);
 const cx=await db.getConnection();
 try{
  await cx.beginTransaction();
  const [old]=await cx.query('SELECT id FROM users WHERE email=?',['demo@bizlens.local']);
  if(old.length) await cx.query('DELETE FROM users WHERE id=?',[old[0].id]);
  const uid=(await cx.query('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',['Demo Owner','demo@bizlens.local',passwordHash]))[0].insertId;
  const bid=(await cx.query('INSERT INTO businesses(user_id,business_name) VALUES(?,?)',[uid,'Demo Retail Store']))[0].insertId;
  const catIds={};
  for(const name of cats)catIds[name]=(await cx.query('INSERT INTO expense_categories(business_id,name) VALUES(?,?)',[bid,name]))[0].insertId;
  const products=[
   ['Classic T-Shirt','Apparel',350,599,42,'active'],['Denim Jeans','Apparel',900,1499,18,'active'],['Canvas Shoes','Footwear',700,1199,4,'active'],['Leather Wallet','Accessories',250,499,27,'active'],['Backpack','Accessories',600,999,9,'active'],['Clearance Cap','Accessories',300,250,3,'active'],['Old Jacket','Apparel',800,1299,0,'inactive']
  ];
  const pid={};
  for(const p of products)pid[p[0]]=(await cx.query('INSERT INTO products(business_id,name,category,cost_price,selling_price,stock,status) VALUES(?,?,?,?,?,?,?)',[bid,...p]))[0].insertId;
  const customers=[['Arjun Das','9876500001','arjun@example.com'],['Priya Sen','9876500002','priya@example.com'],['Rahul Roy','9876500003','rahul@example.com'],['Mita Paul','9876500004','mita@example.com'],['Sourav Ghosh','9876500005','sourav@example.com'],['Neha Sharma','9876500006','neha@example.com'],['Ayan Bose','9876500007','ayan@example.com']];
  const cid={};
  for(const c of customers)cid[c[0]]=(await cx.query('INSERT INTO customers(business_id,name,phone,email) VALUES(?,?,?,?)',[bid,...c]))[0].insertId;
  const orders=[
   ['Arjun Das','2026-07-05',[['Classic T-Shirt',2],['Leather Wallet',1]]],['Priya Sen','2026-07-09',[['Denim Jeans',1],['Classic T-Shirt',1]]],['Rahul Roy','2026-07-15',[['Canvas Shoes',1]]],['Arjun Das','2026-08-03',[['Backpack',1],['Classic T-Shirt',2]]],['Mita Paul','2026-08-08',[['Denim Jeans',1],['Leather Wallet',2]]],['Priya Sen','2026-08-19',[['Classic T-Shirt',3]]],['Sourav Ghosh','2026-08-27',[['Canvas Shoes',1],['Backpack',1]]],['Arjun Das','2026-09-04',[['Denim Jeans',1],['Classic T-Shirt',2]]],['Rahul Roy','2026-09-07',[['Leather Wallet',2],['Backpack',1]]],['Mita Paul','2026-09-11',[['Classic T-Shirt',2],['Canvas Shoes',1]]],['Priya Sen','2026-09-15',[['Denim Jeans',1],['Leather Wallet',1]]],['Neha Sharma','2026-09-18',[['Backpack',1],['Classic T-Shirt',1]]],['Ayan Bose','2026-09-21',[['Clearance Cap',1]]],['Sourav Ghosh','2026-09-25',[['Canvas Shoes',1],['Classic T-Shirt',1]]]
  ];
  for(const [customer,date,items] of orders){
   const oid=(await cx.query("INSERT INTO orders(business_id,customer_id,order_date,status) VALUES(?,?,?,'completed')",[bid,cid[customer],date]))[0].insertId;
   for(const [name,qty] of items){
    const [p]=await cx.query('SELECT id,cost_price,selling_price FROM products WHERE id=?',[pid[name]]);
    await cx.query('INSERT INTO order_items(order_id,product_id,quantity,cost_price,selling_price) VALUES(?,?,?,?,?)',[oid,p[0].id,qty,p[0].cost_price,p[0].selling_price]);
   }
  }
  const expenses=[['Rent',18000,'2026-07-01','Monthly shop rent'],['Marketing',6500,'2026-07-12','Local promotion'],['Utilities',3200,'2026-07-20','Electricity and internet'],['Transport',2800,'2026-08-05','Supplier transport'],['Salaries',15000,'2026-08-10','Part-time staff'],['Marketing',4800,'2026-08-18','Social media promotion'],['Rent',18000,'2026-09-01','Monthly shop rent'],['Utilities',3600,'2026-09-09','Electricity and internet'],['Transport',2400,'2026-09-13','Supplier transport'],['Marketing',5200,'2026-09-16','Festival promotion'],['Other',1500,'2026-09-22','Packaging and supplies']];
  for(const [cat,amount,date,desc] of expenses)await cx.query('INSERT INTO expenses(business_id,category_id,amount,expense_date,description) VALUES(?,?,?,?,?)',[bid,catIds[cat],amount,date,desc]);
  await cx.commit();
  console.log('Demo database ready. Login: demo@bizlens.local | Password: Demo@123');
 }catch(e){await cx.rollback();throw e;}finally{cx.release();await db.end();}
}
main().catch(e=>{console.error('Demo seed failed:',e.message);process.exit(1);});
