import {ForceNode} from '../forcenodesimpl2.js'
import {rndstr,hash256,pause} from '../forceutil.js'


import commandLineArgs from 'command-line-args'
const opts = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'host', type: String, defaultValue: "127.0.0.1"},
  { name: 'port', type: Number, defaultValue: 10000},
  { name: 'http_host', type: String, defaultValue: "127.0.0.1"},
  { name: 'http_port', type: Number},
  { name: 'key', type: String},
  { name: 'pwd', type: String},
  { name: 'http_files', type: String, defaultValue: "./static"},
  { name: 'bootnodes', type: String, defaultValue: "bootnodes.json"}
] )

console.log("options:",opts)

if("help" in opts || !opts.key){
console.log("Usage: --key keys/k0.json --host 127.0.0.1 --port 10000 --http_host 127.0.0.1 --http_port 8000 --bootnodes  bootnodes.json --pwd keys/pwd")
  process.exit(0)
}

const no=opts.port%100;

(async ()=>{

console.log(no,'starting...');
  

const st={}; setInterval(()=>{console.log(no,'st.length:',Object.keys(st).length)},3000)

opts.onfbk = async (fbk,no,addr)=>{
  //console.log('onfbk',fbk)
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
    //console.log(no,i,tx)
  }
  return true;
}


const fn = await ForceNode(opts)

console.log(fn.acc)

await pause(1000);

fn.run()

// txs

const addrs=[];for(let i=0;i<16;i++)addrs.push(rndstr(32));
const kvs={}


var txcnt=0;
const txsender=async ()=>{
  const txa=[]
  for(let i=0;i<1;i++){
  const k=rndstr(16),v=Math.random();
  kvs[k]=v;
  const sender=addrs[Math.floor(Math.random() * addrs.length)]
  const tx={data:{func:'set',args:[k,v],sender,nonce:0,timestamp:Date.now()}}
  tx.h=await hash256(JSON.stringify(tx.data))
  txa.push(tx)
  txcnt++
  }
  fn.ftxmgr.pushBatch(txa)
  setTimeout(txsender,Math.floor(Math.random() * 200))
}
setTimeout(txsender,500);


})()
