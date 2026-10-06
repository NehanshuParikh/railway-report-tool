const test = require('node:test');
const assert = require('node:assert/strict');
const summary = require('../failure-summary.js');
const observation = records => ({getRow:r=>({getCell:c=>({value:records[r-3]?.[c]})})});
test('incident summaries use start values and omit transition details',()=>{
 const records=[
 {10:'MODE DEGRADATION (KANJ) (FS - SR - FS)',11:'22:23:02 - 22:23:04',12:'475103 - 475110',13:'MODE DEGRADATION (KANJ) (FS - SR - FS)\n1. FS - SR at 22:23:02 on 475103\n2. SR - FS at 22:23:05 on 475120'},
 {10:'BOTH TAGS MISS (LC-246) (After Tag-388)',11:'21:35:12 - 21:35:12',12:'426104 - 426104'},
 {10:'Brake (VXD) (EB)',11:'21:45:18 - 21:45:18',12:'426104 - 426104'},
 {10:'Emergency Status (VXD) (SPAD)',11:'21:45:18',12:0},
 {10:'SOS (ADI) (SOS RECEIVED)'},{10:'Foreign Tag (ADI) (FOREIGN RFID)'},{10:'-'}];
 const events=summary.readEvents(observation(records),10);
 assert.equal(events.length,6); assert.equal(events[1].station,'LC-246');assert.match(events[1].label,/TAG - 388/);
 assert.equal(events[2].label,'EB applied');assert.equal(events[3].label,'SPAD');assert.equal(events[3].location,'0');
 events[0].reason='BJD Offline';
 const values=summary.cells({events,trainNo:'20484',locoNo:'39260'});
 assert.match(values[3],/^In Train No 20484 \/ Loco No 39260,/);
 assert.match(values[3],/Time - 22:23:02 at Abs Location - 475103\. Due to/);assert.ok(!values[3].includes('Mode transitions:'));assert.ok(!values[3].includes('475110'));assert.ok(!values[3].includes('22:23:05'));assert.match(values[3],/Due to BJD Offline\./);
 assert.match(values[0],/^1\. BJD Offline\n2\. /);
});
test('multiline spreadsheet clipboard escapes HTML and quotes TSV',()=>{
 const payload=summary.clipboardData(['1. reason "quoted"\n2. next','FS - SR','LC-246','<script>bad</script> & text']);
 assert.match(payload.plain,/^"1\. reason ""quoted""\n2\. next"\tFS - SR\tLC-246\t/);
 assert.equal((payload.html.match(/<td /g)||[]).length,4);
 assert.ok(!payload.html.includes('<script>'));assert.match(payload.html,/&lt;script&gt;/);assert.match(payload.html,/mso-data-placement:same-cell/);
});
test('no incidents produces no numbered phantom event',()=>{
 const events=summary.readEvents(observation([{10:'-'}]),4);
 assert.deepEqual(events,[]);
 assert.deepEqual(summary.cells({events,trainNo:'',locoNo:''}).slice(0,3),['','','']);
 assert.match(summary.cells({events})[3],/No incidents logged/);
});
test('selection filters every cell and renumbers without erasing reasons',()=>{
 const events=[
 {type:'FS - SR',station:'KANJ',label:'Mode Degrade FS - SR',time:'01:00',location:'100',reason:'BJD Offline'},
 {type:'Both tag miss',station:'LC-246',label:'Both Tags miss',time:'02:00',location:'200',reason:'Removed at site',included:false},
 {type:'EB',station:'VXD',label:'EB applied',time:'03:00',location:'300',reason:'LC dropped',included:true}];
 const state={events,trainNo:'20484',locoNo:'39260'};
 const values=summary.cells(state);
 assert.equal(values[0],'1. BJD Offline\n2. LC dropped');
 assert.equal(values[1],'1. FS - SR\n2. EB');assert.equal(values[2],'1. KANJ\n2. VXD');
 assert.ok(!values[3].includes('LC-246'));assert.match(values[3],/2\. EB applied/);
 events[1].included=true;
 assert.match(summary.cells(state)[0],/2\. Removed at site/);
 events.forEach(event=>event.included=false);
 assert.deepEqual(summary.cells(state).slice(0,3),['','','']);
 assert.match(summary.cells(state)[3],/No incidents selected/);
 assert.equal(events[1].reason,'Removed at site');
});

test('multi-mode incidents remain one concise numbered sentence',()=>{
 const events=summary.readEvents(observation([{10:'MODE DEGRADATION (GER - KANJ) (FS - SR MODE - ONSIGHT - FS)',11:'04:19:02 - 04:22:58',12:'481904 - 474086',13:'Details and transitions'}]),4);
 const values=summary.cells({events,trainNo:'12345',locoNo:'37216'});
 assert.equal(values[1],'1. FS - SR - OS');
 assert.equal(values[3],'In Train No 12345 / Loco No 37216,\n\n1. Mode Degrade FS - SR - OS at GER - KANJ at Time - 04:19:02 at Abs Location - 481904. Due to ');
});
test('direction filter keeps reasons and selections independent and limits export',()=>{
 const records=[{5:'N',10:'Brake (KANJ) (EB)',11:'06:00',12:'100'},{5:'R',10:'Brake (GER) (EB)',11:'18:00',12:'200'}];
 const events=summary.readEvents(observation(records),5);
 assert.deepEqual(events.map(e=>e.direction),['DN','UP']);
 events[0].reason='Morning issue';events[1].reason='Evening issue';
 const state={events,trainNo:'20484',locoNo:'39260',direction:'DN',trainNos:{DN:'20484',UP:'20483'}};
 assert.match(summary.cells(state)[3],/20484.*\(DN\)/);assert.ok(!summary.cells(state)[3].includes('GER'));
 state.direction='UP';assert.match(summary.cells(state)[3],/20483.*\(UP\)/);assert.equal(summary.cells(state)[0],'1. Evening issue');
 events[1].included=false;state.direction='DN';assert.equal(summary.cells(state)[0],'1. Morning issue');
 state.direction='UP';assert.match(summary.cells(state)[3],/No incidents selected/);
 assert.equal(summary.normalizeDirection('u'),'U');assert.equal(summary.normalizeDirection(''),'Unknown');
});
