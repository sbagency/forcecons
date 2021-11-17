import {ForceNode} from '../forcenodesimpl.js'
import {rndstr,hash256,pause} from '../forceutil.js'


(async ()=>{
  
// fn-test [port]
  
//const name = process.argv[1].split('/'); console.log(name[name.length-1].split('.')[0])

let P = 10000; if(process.argv.length>=3) P = parseInt(process.argv[2])

// node

const fn = await ForceNode({
  ontx: async (tx,st)=>{
  console.log('ontx:',tx,st)
  switch(tx.data.func){
    case 'set':{
      const args=tx.data.args;
      const k=args[0],v=args[1];
      st[k]=v;
      return true;
    }
  }
  return false;
  }})

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
  //await signtx(tx,sender)
  fn.ftxmgr.push(tx)
  txcnt++
  setTimeout(txsender,Math.floor(Math.random() * 200))
}
setTimeout(txsender,500);



})()
