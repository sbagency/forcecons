/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import fs from 'fs'
import crypto from 'crypto'

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws'


import {ForceNet} from './forcenet.js'
import {ForceVerifier,ForceSigner} from './forceverifier.js'
import {ForceConsSimpl} from './forceconssimpl2.js'
//import {ForceStMgr} from './forcestmgr.js'
import {ForceTxMgr} from './forcetxmgr.js'

import {rndstr,hash256,getPwdFromFileOrConsole,genNewAcc} from './forceutil.js'

async function forcenodesimpl(opt){


if(!opt)opt={}

opt.host = opt.host || "127.0.0.1";
opt.port = opt.port || 10000;
opt.http_host = opt.http_host || "127.0.0.1";
opt.http_port = opt.http_port || (opt.port - 2000);
opt.algo = opt.algo || "ed25519";
opt.http_files = opt.http_files || "./static";
opt.gw_host = opt.gw_host || "127.0.0.1";
opt.gw_port = opt.gw_port || "10000";

opt.sid = opt.sid || rndstr(8);

//console.log("options:",opt)


let bootnodes;
if(opt.bootnodes){
  bootnodes=JSON.parse(fs.readFileSync(opt.bootnodes));
  //console.log('bootnodes',bootnodes);
}

const no=opt.port%100;

let acc; if(opt.key){acc = JSON.parse(fs.readFileSync(opt.key))}
else { acc =  genNewAcc();}

console.log('acc',acc)

let pwd; if(opt.pwd){ pwd = await getPwdFromFileOrConsole(opt.pwd) }

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


const onmsg = (mo)=>{
  return fcons.onmsg(mo)
}


const {host,port}=opt
console.log('host,port:',host,port)

const {gw_host,gw_port}=opt

if(bootnodes){ for(let bn of bootnodes){  console.log(bn) } }
if(gw_host && gw_port){ console.log('gw_host,gw_port:',gw_host,gw_port) }


const onbk=(bk,self)=>{
  const txq=bk.data.txq; delete bk.data.txq;
  send2ws({what:'bk',bk})
  bk.data.txq=txq;
  if(opt.onbk)opt.onbk(bk,no,addr)
  return true;
}

const onlbk=(lbk,self)=>{
  const txq=lbk.data.txq; delete lbk.data.txq;
  send2ws({what:'lbk',lbk})
  lbk.data.txq=txq;
  if(opt.onlbk)opt.onlbk(lbk,no,addr)
  return true;
}

const onfbk=(fbk,self)=>{
  const txq=fbk.data.txq; delete fbk.data.txq;
  send2ws({what:'fbk',fbk})
  fbk.data.txq=txq;
  if(opt.onfbk)opt.onfbk(fbk,no,addr)
  return true;
}

/*
const onrbk=(rbk,maxno,self)=>{
  send2ws({what:'rbk',rbk:[],maxno})
  if(opt.onrbk)opt.onrbk(rbk,no,addr)
  return true;
}*/


const getTxq=()=>{
  let q=ftxmgr.getq(); ftxmgr.resetq();
  return q;
}

const revTxq=(q)=>{
  //console.log(no,'revTxq >>>>>>>>>>>>>> <<<<<<<<<<<<<<<',q.length)
  ftxmgr.pushBatch(q)
}


const fnet = new ForceNet({addr,no,host,port,gw_host,gw_port,bootnodes,onmsg, sign, verify})
const ftxmgr = new ForceTxMgr({no});
const fcons = new ForceConsSimpl({no,addr,fnet,getTxq,revTxq,onbk,onlbk,onfbk,stoped:true})


var wss={};
const send2ws=(mo)=>{  const ms=JSON.stringify(mo);  for(let wsid of Object.keys(wss)){wss[wsid].send(ms)} }

if(opt.http_port && opt.http_host){

const index_html = fs.readFileSync(opt.http_files+'/index.html')
const force_graph_js = fs.readFileSync(opt.http_files+'/force-graph.min.js')
//console.log(no,index_html.toString());
const httpserver = http.createServer((req, res)=> {
  console.log('url',req.url)
  switch(req.url){
    case '/': {res.end(index_html);return;}
    case '/force-graph.min.js': {res.end(force_graph_js);return;}
    case '/api':{res.end(JSON.stringify({ok:1}));return;}
    case '/sid':{res.end(JSON.stringify({sid}));return;}
  }
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify({error:'invalid url',url:req.url}));
  res.end()
})

httpserver.listen(opt.http_port, opt.http_host, () => { console.log(`http server listen ${opt.http_host}:${opt.http_port}`)});

const wsserver = new WebSocketServer({server:httpserver})
wsserver.on('connection', (ws)=> {
  const wsid = rndstr(8);  ws.wsid=wsid;  wss[wsid]=ws;
  ws.on('message', (msg)=> { const mo=JSON.parse(msg);  console.log(no,'ws:', mo);  });
  ws.on('error', (err)=> {console.log(no,'ws err',err)});
  ws.on('close', ()=> { console.log(no,'ws close',wsid);  delete wss[wsid];  });
});

} // opt.http_port && opt.http_host

return {acc:{addr,host,port},fnet,ftxmgr,fcons,run:fcons.run,connect:fnet.connect}

}

export { forcenodesimpl as ForceNode }


