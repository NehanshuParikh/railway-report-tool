const test=require('node:test');const assert=require('node:assert/strict');
global.LoginUsers=require('../login-users.js');
const login=require('../frontend-login.js');
test('session lasts exactly six hours and expires at the boundary',()=>{
 const now=10000000;const value={version:1,username:'Parikh',issuedAt:now,expiresAt:now+login.DURATION};
 assert.equal(login.DURATION,21600000);assert.equal(login.validSession(value,now),true);
 assert.equal(login.validSession(value,now+login.DURATION-1),true);assert.equal(login.validSession(value,now+login.DURATION),false);
 assert.equal(login.countdown(value.expiresAt,now),'06:00:00');assert.equal(login.countdown(value.expiresAt,now+3600000),'05:00:00');
 assert.equal(login.countdown(value.expiresAt,value.expiresAt+1),'00:00:00');
});
test('rejects missing, malformed, unknown-user, future, and extended session records',()=>{
 const now=10000000;const good={version:1,username:'Vohra',issuedAt:now,expiresAt:now+login.DURATION};
 for(const value of [null,{}, {...good,version:2},{...good,username:'Unknown'},{...good,issuedAt:now+1},{...good,expiresAt:good.expiresAt+1},{...good,issuedAt:'0'}])assert.equal(login.validSession(value,now),false);
});
test('all seven user verifiers exist; incorrect credentials are rejected',async()=>{
 assert.deepEqual(global.LoginUsers.map(user=>user.username),['Vohra','Parikh','Panchal','Navik','Shrivastav','NMSKavachRoom','NMSTestroom']);
 assert.equal(await login.verifyCredentials('Parikh','not-the-password'),null);
 assert.equal(await login.verifyCredentials('Unknown','not-the-password'),null);
});
