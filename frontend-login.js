/* Frontend convenience gate only. Users can bypass client code and client storage. */
(function(root){
    'use strict';
    const DURATION=6*60*60*1000;
    const KEY='railway-report.login.v1';
    const users=()=>root.LoginUsers || [];
    const account=name=>users().find(user=>user.username.toLowerCase()===String(name||'').trim().toLowerCase());
    function validSession(value,now=Date.now()){
        return Boolean(value && value.version===1 && account(value.username) &&
            Number.isSafeInteger(value.issuedAt) && Number.isSafeInteger(value.expiresAt) &&
            value.issuedAt<=now && value.expiresAt-value.issuedAt===DURATION && now<value.expiresAt);
    }
    function countdown(expiresAt,now=Date.now()){
        const seconds=Math.max(0,Math.ceil((expiresAt-now)/1000));
        return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
    }
    async function verifyCredentials(username,password){
        const user=account(username);
        if(!user || typeof password!=='string')return null;
        if(!root.crypto?.subtle)throw Error('Open the app in a modern browser using HTTPS or a local file.');
        const fromHex=value=>new Uint8Array(value.match(/../g).map(n=>parseInt(n,16)));
        const key=await root.crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
        const bits=await root.crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:fromHex(user.salt),iterations:user.iterations},key,256);
        const actual=new Uint8Array(bits);const expected=fromHex(user.hash);
        let diff=actual.length^expected.length;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];
        return diff===0 ? user.username : null;
    }
    let session=null,storage=null,attempt=0,ready=false;
    function readSession(){
        try{return JSON.parse(storage?.getItem(KEY)||'null');}catch(_){return null;}
    }
    function persist(value){
        try{if(value)storage?.setItem(KEY,JSON.stringify(value));else storage?.removeItem(KEY);}catch(_){storage=null;}
    }
    function clearReport(){
        for(const id of ['failureSummaryPopup','reportPopup'])root.document.getElementById(id)?.remove();
        for(const id of ['fileInput','trainNo','trainName']){const input=root.document.getElementById(id);if(input)input.value='';}
        const button=root.document.getElementById('failureSummaryBtn');if(button)button.disabled=true;
        const log=root.document.getElementById('log');if(log)log.textContent='System Ready.';
        for(const key of ['_sheetRows','_modeDegRows','_tagMissRows','_ebRows','_wrRows'])root[key]=[];
        root.FailureSummary?.reset();
    }
    function lock(message='Please log in to continue.'){
        session=null;attempt++;persist(null);
        if(!ready)return;
        clearReport();
        root.document.getElementById('reportApp').hidden=true;
        root.document.getElementById('loginScreen').hidden=false;
        root.document.getElementById('loginMessage').textContent=message;
        root.document.getElementById('loginPassword').value='';
    }
    function requireSession(){
        if(validSession(session))return true;
        lock(session?'Your 6-hour session has ended. Please log in again.':'Please log in to continue.');return false;
    }
    function showSession(){
        root.document.getElementById('loginScreen').hidden=true;
        root.document.getElementById('reportApp').hidden=false;
        root.document.getElementById('sessionUser').textContent=session.username;
        root.document.getElementById('sessionCountdown').textContent=countdown(session.expiresAt);
    }
    function tick(){
        if(!session)return;
        if(!validSession(session)){lock('Your 6-hour session has ended. Please log in again.');return;}
        root.document.getElementById('sessionCountdown').textContent=countdown(session.expiresAt);
    }
    function init(){
        if(ready || !root.document.getElementById('loginScreen'))return;
        ready=true;
        for(const name of ['localStorage','sessionStorage']){
            try{const candidate=root[name];const probe=KEY+'.probe';candidate.setItem(probe,'1');candidate.removeItem(probe);storage=candidate;break;}catch(_){}
        }
        session=readSession();
        if(validSession(session))showSession();else lock();
        root.document.getElementById('loginForm').addEventListener('submit',async event=>{
            event.preventDefault();const thisAttempt=++attempt;
            const button=root.document.getElementById('loginSubmit');const message=root.document.getElementById('loginMessage');
            button.disabled=true;message.textContent='Checking credentials…';
            try{
                const username=await verifyCredentials(root.document.getElementById('loginUser').value,root.document.getElementById('loginPassword').value);
                if(thisAttempt!==attempt)return;
                if(!username){message.textContent='Incorrect user ID or password.';return;}
                const now=Date.now();session={version:1,username,issuedAt:now,expiresAt:now+DURATION};persist(session);
                root.document.getElementById('loginPassword').value='';showSession();
                if(!storage)root.document.getElementById('sessionNotice').textContent='Browser storage is unavailable. Refreshing will require login again.';
            }catch(error){message.textContent=error.message;}finally{button.disabled=false;}
        });
        root.document.getElementById('sessionLogout').addEventListener('click',()=>lock('You have logged out.'));
        root.addEventListener('storage',event=>{
            if(event.key!==KEY)return;
            const updated=readSession();
            if(validSession(updated)){attempt++;if(session && session.username!==updated.username)clearReport();session=updated;showSession();}
            else lock('You have logged out or your session has expired.');
        });
        root.addEventListener('focus',tick);
        root.document.addEventListener('visibilitychange',tick);
        root.document.addEventListener('click',event=>{
            if(!root.document.getElementById('loginScreen').hidden)return;
            if(!requireSession()){event.preventDefault();event.stopImmediatePropagation();}
        },true);
        root.setInterval(tick,1000);
    }
    const api={DURATION,KEY,validSession,countdown,verifyCredentials,requireSession,logout:()=>lock('You have logged out.')};
    root.FrontendLogin=api;
    if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',init);else init();}
    if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
