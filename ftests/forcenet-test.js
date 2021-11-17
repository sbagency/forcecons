/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'
import crypto from 'crypto'
import EventEmitter from 'events';
import readline from 'readline'


import {ForceNet} from '../forcenet.js'
import {ForceNetRpc} from '../forcenet-rpc.js'
import {ForceVerifier,ForceSigner} from '../forceverifier.js'
import {rndstr,hash256,getPwdFromFileOrConsole} from '../forceutil.js'


import commandLineArgs from 'command-line-args'
const opts = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'host', type: String, defaultValue: "127.0.0.1"},
  { name: 'port', type: Number},
  { name: 'key', type: String, defaultValue: "keys/k0.json"},
  { name: 'algo', type: String, defaultValue: "ed25519"},
  { name: 'pwd', type: String},
  { name: 'bootnodes', type: String, defaultValue: "bootnodes.json"}
] )

console.log("options:",opts)

if("help" in opts || !opts.key){
console.log("Usage: --key keys/k0.json --host 127.0.0.1 --port 10000 --bootnodes  bootnodes.json --pwd keys/pwd")
  process.exit(0)
}

// node ftests/forcenet-test.js --key keys/k0.json --host 127.0.0.1 --port 10000 --bootnodes  bootnodes.json --pwd keys/pwd

const bootnodes=JSON.parse(fs.readFileSync(opts.bootnodes));
console.log(bootnodes);


(async () => {

console.log('forcenet-test...')

const no=opts.port%100;

let acc; if(opts.key){acc = JSON.parse(fs.readFileSync(opts.key))}
else { acc =  genNewAcc();}

console.log('acc',acc)

let pwd; if(opts.pwd){ pwd = await getPwdFromFileOrConsole(opts.pwd) }

const fsi=new ForceSigner({acc,pwd})
const fv=new ForceVerifier()

const addr=acc.addr

console.log({no,addr})


const sign = async (mo)=>{
  return fsi.sign(mo)
}

const verify = async (mo)=>{
  return fv.verify(mo)
}



const onmsg = async (mo)=>{

  const data=mo.data;
  const from=data.from;
  
  switch(data.what){
    case 'ping':{
      console.log(no,addr.substr(0,8),'onmsg: ping from:',from.no,from.addr.substr(0,8))
      break;
    }
    case 'ping2':{
      console.log(no,addr.substr(0,8),'onmsg: ping2 from:',from.no,from.addr.substr(0,8))
      break;
    }
    default:{}
  }
  
  fnrpc.onmsg(mo)
}


const onrpc = (mo)=>{
  
  const data=mo.data;
  const from=data.from;
  const q=data.q;
  
  console.log('onrpc:',q,'from:',from.no,from.addr.substr(0,8))
  
 return new Promise( (resolve, reject) => {
  
  switch(q.what){
    case 'node.test':{
      resolve({test:'ok',c:(q.a+q.b)}); return;
    }
    default:{
      reject({err:'unknown rpc method'}); return;
    }
  }
  
 })
}




const {host,port}=opts

console.log('host,port:',host,port)

const fnet = new ForceNet({addr,no,host,port,bootnodes,onmsg, sign, verify, log:1})

const fnrpc = new ForceNetRpc({addr,no,sendTo:fnet.sendTo,onrpc})


const pingsender=async ()=>{
  
  await fnet.send({what:'ping',pingnonce:rndstr(8)})
  
  setTimeout(pingsender,2000+Math.floor(Math.random() * 1000))
}

setTimeout(pingsender,500)



const rpcsender=async ()=>{
  
  const n_addr=fnet.getRndConn()
  if(n_addr){
   const start = Date.now();
   const a=Math.random()*1000;const b=Math.random()*1000;
   let resp; try{
     resp=await fnrpc.run({what:'node.test',a,b},n_addr)
   }catch(e){console.log(e);return;}
   const millis = Date.now() - start;
   console.log('rpc result in ',millis/1000,'secs.', resp.res, 'from:',n_addr.substr(0,8))
   if(resp.err){
     console.log('resp.err',resp.err);
   } else {
     if(!resp.res){
     console.log('!resp.res',resp)
     } else {
     const res=resp.res;
     if((a+b)!=res.c){console.log('rpc test result error ',a+b,res.c)}
     }
   }
  }
  
  setTimeout(rpcsender,2000+Math.floor(Math.random() * 1000))
}

setTimeout(rpcsender,500)

})()


