import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDb} from '../server/db.js';
import {createApp} from '../server/app.js';
test('Integrated reporting workflow and authority permissions',async t=>{
const db=createDb(':memory:');const server=createApp(db).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>{server.close();db.close()});const base=`http://127.0.0.1:${server.address().port}/api`;
async function call(path,method='GET',body,cookie){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}}
assert.equal((await call('/issues')).status,401);
const user=await call('/auth/login','POST',{email:'student@fixit.demo',password:'Campus@123'});assert.equal(user.status,200);assert.equal(user.data.user.role,'user');
const admin=await call('/auth/login','POST',{email:'admin@fixit.demo',password:'Admin@123'});assert.equal(admin.status,200);
const loc=await call('/locations','GET',null,user.cookie);assert.equal(loc.data.length,90);assert.equal(loc.data.filter(l=>l.type==='Classroom').length,50);assert.equal(loc.data.filter(l=>l.type==='Staff cabin').length,20);assert.equal(loc.data.filter(l=>l.type==='Washroom').length,20);
const body={title:'Broken classroom light',description:'The light next to the whiteboard is broken.',category:'Electrical',location_id:1};
assert.equal((await call('/issues','POST',{...body,status:'Resolved'},user.cookie)).status,403);
assert.equal((await call('/issues','POST',{...body,location_id:900},user.cookie)).status,400);
const report=await call('/issues','POST',body,user.cookie);assert.equal(report.status,201);const id=report.data.id;
assert.equal((await call(`/issues/${id}/progress`,'PATCH',{status:'Resolved',priority:'High'},user.cookie)).status,403);
const update=await call(`/issues/${id}/progress`,'PATCH',{status:'In Progress',priority:'High'},admin.cookie);assert.equal(update.status,200);
assert.equal((await call(`/issues/${id}/notes`,'POST',{body:'The room will be free after 3 PM.'},user.cookie)).status,201);
const detail=await call(`/issues/${id}`,'GET',null,user.cookie);assert.equal(detail.data.status,'In Progress');assert.equal(detail.data.priority,'High');assert.equal(detail.data.activities.length,3);
const other=await call('/auth/register','POST',{name:'Test Student',email:'test@example.edu',password:'Testing123',role:'authority'});assert.equal(other.data.user.role,'user');
assert.equal((await call(`/issues/${id}/notes`,'POST',{body:'Unauthorized note'},other.cookie)).status,403);
assert.equal((await call(`/issues/${id}/progress`,'PATCH',{status:'Resolved',priority:'High'},other.cookie)).status,403);
assert.equal((await call(`/issues/${id}/progress`,'PATCH',{status:'Resolved',priority:'High'},admin.cookie)).status,200);
assert.equal((await call(`/issues/${id}`,'GET',null,user.cookie)).data.status,'Resolved');
await call('/auth/logout','POST',{},user.cookie);assert.equal((await call('/issues','GET',null,user.cookie)).status,401);
});
