import {ForceNode} from '../forcenodesimpl.js'
import {rndstr,hash256,pause} from '../forceutil.js'


(async ()=>{
  

const st={}

const onfbk = async (fbk,no,addr)=>{
  console.log('onfbk',fbk)
  const txq=fbk.data.txq;
  for(let i in txq){
    const tx=txq[i]
    switch(tx.data.func){
      case 'set':{
        const args=tx.data.args;
        const k=args[0],v=args[1];
        st[k]=v;
      }
    }
    console.log(no,i,tx)
  }
  return true;
}


const fn = await ForceNode({onfbk})

console.log(fn.acc)

await pause(1000);

fn.run()

// txs

const addrs=[];for(let i=0;i<16;i++)addrs.push(rndstr(32));
const kvs={}


var txcnt=0;
const txsender=async ()=>{
  const k=rndstr(16),v=Math.random();
  kvs[k]=v;
  const sender=addrs[Math.floor(Math.random() * addrs.length)]
  const tx={data:{func:'set',args:[k,v],sender,nonce:0,timestamp:Date.now()}}
  tx.h=await hash256(JSON.stringify(tx.data))
  fn.ftxmgr.push(tx)
  txcnt++
  setTimeout(txsender,Math.floor(Math.random() * 200))
}
setTimeout(txsender,500);

var stchkcnt=0;
const stchecker=async ()=>{
  console.log('stchecker',Object.keys(st).length)
  setTimeout(stchecker,Math.floor(2000+Math.random() * 1200))
}
setTimeout(stchecker,3500);



})()
