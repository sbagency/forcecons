import util from 'util'
import {rndstr,hash256} from '../forceutil.js'
import {ForceStMgr} from '../forcestmgr.js'
import {ForceTxMgr} from '../forcetxmgr.js'
import {pxSt,mrgSt} from '../forceproxyst.js'

(async ()=>{
console.log('forcestmgr tests...')

const no=0,addr=rndstr(16);
const kvs={};

const addrs=[]
for(let i=0;i<32;i++)addrs.push(rndstr(32))


const ontx=async (tx,st)=>{
  //console.log('ontx:',tx,st)
  const data=tx.data
  const args=data.args
  switch(data.func){
    case 'set':{
      const k=args[0],v=args[1];
      st[k]=v;
      return true;
    }
  }
  return false;
}


const ftxmgr = new ForceTxMgr({no:no});
const fstmgr = new ForceStMgr({no:no,ftxmgr,ontx});
fstmgr.getbks=()=>{return bks;}

console.log('...')

const bks={}
const bk0={data:{no:0,ph:null,timestamp:Date.now(),nonce:rndstr(16)}}
bk0.h=await hash256(JSON.stringify(bk0.data))
bks[bk0.h]=bk0;

var lbk=bk0;
var stop;

const bksender=async ()=>{

  const bk={data:{no:lbk.data.no+1,ph:lbk.h,timestamp:Date.now()}}
  let txq=[]; txq=await fstmgr.getTxq(bk);
  bk.data.txq=txq;
  bk.h=await hash256(JSON.stringify(bk.data))
  bks[bk.h]=bk;
  bk.sender={no:no,addr:addr}

  console.log('bk:',bk.data.no,'txq:  ',bk.data.txq.length,'bk.st',Object.keys(bk.st).length,'txcnt:',txcnt)


  lbk=bk;

  if(!stop)setTimeout(bksender,Math.floor(Math.random() * 1000))
}
setTimeout(bksender,750)



var txcnt=0;
const txsender=async ()=>{
  
  const k=rndstr(16),v=Math.random();kvs[k]=v;
  const from=addrs[Math.floor(Math.random() * addrs.length)]
  const tx={data:{func:'set',args:[k,v],from,nonce:0,timestamp:Date.now()}}
  //await sign(tx)  // should be not msg sign
  tx.h=await hash256(JSON.stringify(tx.data))
  ftxmgr.push(tx)
  txcnt++
  //console.log('txcnt:',txcnt)
  
  if(!stop)setTimeout(txsender,Math.floor(Math.random() * 250))
}
setTimeout(txsender,250)



setTimeout(()=>{
  stop=true;
  setTimeout(()=>{
    console.log('stoped: txmgr:',ftxmgr.getql(),ftxmgr.gettxsl(),ftxmgr.gettxfl(),'txcnt:',txcnt,'lbk',lbk)
    
  const stctrl = new pxSt(bks,lbk,{})
  const pst=stctrl.pst
  const bst=mrgSt(bks,lbk)

console.log('bst',bst)


for(let k of Object.keys(kvs)){
  if(kvs[k]!=pst[k]){console.log('error: kvs[k]!=pst[k]',k,kvs[k],pst[k]);}
}


for(let k of Object.keys(bst)){
  if(kvs[k]!=bst[k]){console.log('error: kvs[k]!=bst[k]',k,kvs[k],bst[k]);}
}

    
  },1000)
  
},10000)


})()