const test=require('node:test');const assert=require('node:assert/strict');
const library=require('../common-reasons.js');
test('stored reasons load trimmed, with duplicates removed and empty deleted library preserved',()=>{
 assert.deepEqual(library.load({getItem:()=>JSON.stringify([' Custom ','Custom','Other',''])}),['Custom','Other']);
 assert.deepEqual(library.load({getItem:()=>JSON.stringify([])}),[]);
});
test('missing, corrupt, or blocked browser storage falls back to editable defaults',()=>{
 for(const storage of [null,{getItem:()=>null},{getItem:()=>'{broken'}, {getItem:()=>JSON.stringify([123])},{getItem:()=>{throw Error('blocked')}}]) {
  assert.ok(library.load(storage).includes('BJD Offline'));
 }
});
