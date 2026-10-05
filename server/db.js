import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
export function hashPassword(password) { const salt=randomBytes(16).toString('hex'); return salt+':'+scryptSync(password,salt,64).toString('hex'); }
export function verifyPassword(password,hash) { const [salt,key]=hash.split(':'); return timingSafeEqual(Buffer.from(key,'hex'),scryptSync(password,salt,64)); }
export function createDb(path=process.env.DB_PATH || 'data/fixit.sqlite') {
 if(path!==':memory:') mkdirSync(dirname(path),{recursive:true});
 const db=new DatabaseSync(path); db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
 db.exec(`CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('user','authority')));
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS locations(id INTEGER PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL,building TEXT NOT NULL,floor INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS issues(id INTEGER PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,location_id INTEGER NOT NULL REFERENCES locations(id),priority TEXT NOT NULL DEFAULT 'Medium',status TEXT NOT NULL DEFAULT 'Pending',user_id INTEGER NOT NULL REFERENCES users(id),created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS activities(id INTEGER PRIMARY KEY,issue_id INTEGER REFERENCES issues(id),user_id INTEGER REFERENCES users(id),kind TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL);`);
 if(!db.prepare('SELECT id FROM users LIMIT 1').get()) {
 db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run('Alex Morgan','student@fixit.demo',hashPassword('Campus@123'),'user');
 db.prepare('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)').run('Jordan Lee','admin@fixit.demo',hashPassword('Admin@123'),'authority');
 const insert=db.prepare('INSERT INTO locations(name,type,building,floor) VALUES(?,?,?,?)');
 for(const [type,count,prefix] of [['Classroom',50,'Classroom'],['Staff cabin',20,'Staff cabin'],['Washroom',20,'Washroom']]) for(let i=1;i<=count;i++) insert.run(`${prefix} ${String(i).padStart(2,'0')}`,type,`Block ${String.fromCharCode(65+Math.floor((i-1)/10))}`,Math.floor(((i-1)%10)/4));
 const samples=[['Ceiling fan needs a little attention','The ceiling fan near the windows is making a loud rattling noise.','Electrical',12,'High','Pending'],['Water leaking from the basin','The tap keeps dripping even when fully closed. Water is pooling below the basin.','Plumbing',73,'High','In Progress'],['Projector isn’t connecting','The projector shows no signal when connected to a laptop via HDMI.','Equipment',8,'Medium','Pending'],['A broken chair in the front row','One chair has a loose leg and is unsafe to sit on.','Furniture',24,'Medium','In Progress'],['Lights restored in the corridor','Two lights outside the cabin were flickering and needed replacement.','Electrical',55,'Low','Resolved'],['Washroom needs cleaning','The washroom on the first floor needs cleaning and soap refills.','Cleaning',84,'Medium','Pending'],['Window latch repaired','The window did not close securely; the latch has now been replaced.','Infrastructure',32,'Low','Resolved'],['Air conditioner not cooling','The AC runs but does not cool the cabin.','Equipment',64,'Medium','In Progress']];
 samples.forEach((s,i)=>{const date=new Date(Date.now()-(i*13+3)*3600000).toISOString();const r=db.prepare('INSERT INTO issues(title,description,category,location_id,priority,status,user_id,created_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?)').run(...s,date,date); db.prepare('INSERT INTO activities(issue_id,user_id,kind,body,created_at) VALUES(?,1,?,?,?)').run(r.lastInsertRowid,'report','Issue reported',date);if(s[5]!=='Pending')db.prepare('INSERT INTO activities(issue_id,user_id,kind,body,created_at) VALUES(?,2,?,?,?)').run(r.lastInsertRowid,'status',`Status changed to ${s[5]}`,date);});
 }
 return db;
}
