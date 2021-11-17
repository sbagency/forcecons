import util from 'util'
import {rndstr,hash256} from '../forceutil.js'
import {ForceTxMgr} from '../forcetxmgr.js'
//import {ForceVM} from '../forcevm.js'

(async ()=>{
console.log('forcetxmgr tests...')

const ftxmgr = new ForceTxMgr();

const addrs=[]
for(let i=0;i<32;i++)addrs.push(rndstr(32))

const kvs={}


const st={}
var pbk;
var stop;

var txpcnt=0;

const bksender=async ()=>{

let q=ftxmgr.getq(); ftxmgr.resetq()

const txf=[],txok=[]
for(let tx of q){
  if(Math.random()>0.75){txf.push(tx);continue;}
  const txd=tx.data;  const k=txd.args[0],v=txd.args[1];
  st[k]=v
  txok.push(tx)
}

ftxmgr.store(txok); ftxmgr.storef(txf);
let bk_no=0;if(pbk)bk_no=pbk.data.no+1;
let ph=null;if(pbk)ph=pbk.h;

const bk={data:{no:bk_no,ph:ph,timestamp:Date.now(),txq:txok}};
bk.h=await hash256(JSON.stringify(bk.data))

txpcnt+=bk.data.txq.length;

console.log('bk:',bk.data.no,bk.data.txq.length,'txmgr:',ftxmgr.getql(),ftxmgr.gettxsl(),ftxmgr.gettxfl(),'txcnt:',txcnt)

for(let tx of txok){  tx.bk={no:bk.data.no,h:bk.h} }

pbk=bk;

if(!stop)setTimeout(bksender,Math.floor(Math.random() * 1000))
}
setTimeout(bksender,500)


var txcnt=0;
const txsender=async ()=>{
  
  const k=rndstr(16),v=Math.random();kvs[k]=v;
  const from=addrs[Math.floor(Math.random() * addrs.length)]
  const tx={data:{func:'set',args:[k,v],from,nonce:0,timestamp:Date.now()}}
  //await sign(tx)  // should be not msg sign
  tx.h=await hash256(JSON.stringify(tx.data))
  ftxmgr.push(tx)
  txcnt++
  if(!stop)setTimeout(txsender,Math.floor(Math.random() * 250))
}
setTimeout(txsender,500)

setTimeout(()=>{
  stop=true;
  setTimeout(()=>{
    console.log('stoped: txpcnt:',txpcnt,'txmgr:',ftxmgr.getql(),ftxmgr.gettxsl(),ftxmgr.gettxfl(),'txcnt:',txcnt)
    if(ftxmgr.gettxsl()!=txpcnt){console.log('error ftxmgr.gettxsl()!=txpcnt',ftxmgr.gettxsl(),txpcnt)}
    
    
  },1000)
  
},10000)


})()