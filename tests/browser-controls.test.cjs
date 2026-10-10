const test = require('node:test');
const assert = require('node:assert/strict');
const {blockedShortcut}=require('../browser-controls.js');
test('blocks common Inspect, console, and source shortcuts',()=>{
 for(const event of [
  {key:'F12'},{key:'Unidentified',code:'F12'},
  ...['i','j','c'].map(key=>({key,ctrlKey:true,shiftKey:true})),
  ...['i','j','c'].map(key=>({key,metaKey:true,altKey:true})),
  {key:'c',metaKey:true,shiftKey:true},{key:'u',ctrlKey:true},{key:'u',metaKey:true,altKey:true}
 ]) assert.equal(blockedShortcut(event),true,JSON.stringify(event));
});
test('preserves ordinary copying, pasting, selection, and text editing',()=>{
 for(const event of [
  ...['c','v','x','a','z','y'].flatMap(key=>[{key,ctrlKey:true},{key,metaKey:true}]),
  {key:'i'},{key:'j'},{key:'u'},{key:'ArrowRight',shiftKey:true},{key:'Enter'},{key:'Tab'}
 ]) assert.equal(blockedShortcut(event),false,JSON.stringify(event));
});
