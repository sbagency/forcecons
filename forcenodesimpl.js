/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import fs from 'fs'
import crypto from 'crypto'

import http from 'http';
import WebSocket, { WebSocketServer } from 'ws'


import {ForceNet} from './forcenet.js'
import {ForceConsSimpl} from './forceconssimpl.js'
import {ForceVerifier,ForceSigner} from './forceverifier.js'
import {ForceStMgr} from './forcestmgr.js'
import {ForceTxMgr} from './forcetxmgr.js'

import {rndstr,hash256,getPwdFromFileOrConsole,genNewAcc} from './forceutil.js'

async function forcenodesimpl(opts){


if(!opts)opts={}

opts.host = opts.host || "127.0.0.1";
opts.port = opts.port || 10000;
opts.http_host = opts.http_host || "127.0.0.1";
opts.http_port = opts.http_port || (opts.port - 2000);
opts.algo = opts.algo || "ed25519";
opts.http_files = opts.http_files || "./static";
opts.gw_host = opts.gw_host || "127.0.0.1";
opts.gw_port = opts.gw_port || "10000";

console.log("options:",opts)


let bootnodes;if(opts.bootnodes){bootnodes=JSON.parse(fs.readFileSync(opts.bootnodes));console.log('bootnodes',bootnodes);}

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


const onmsg = (mo)=>{
  return fcons.onmsg(mo)
}


const {host,port}=opts
console.log('host,port:',host,port)

const {gw_host,gw_port}=opts

if(bootnodes){ for(let bn of bootnodes){  console.log(bn) } }
if(gw_host && gw_port){ console.log('gw_host,gw_port:',gw_host,gw_port) }




const ontx=(tx,st)=>{
  if(opts.ontx) return opts.ontx(tx,st)
  const data=tx.data
  const args=data.args
  //console.log('ontx:',tx,st)
  switch(data.func){
    case 'set':{
      const k=args[0],v=args[1];
      st[k]=v;
      return true;
    }
  }
  return false;
}


const onbk=(bk,self)=>{
  send2ws({what:'bk',bk})
  return fstmgr.onbk(bk,self)
}

const onlbk=(lbk,self)=>{
  send2ws({what:'lbk',lbk})
  return fstmgr.onlbk(lbk,self)
}


const fnet = new ForceNet({addr:addr,no:no,host,port,gw_host,gw_port,bootnodes,onmsg, sign, verify})
const ftxmgr = new ForceTxMgr({no:no});
const fstmgr = new ForceStMgr({no:no,ftxmgr,ontx});
const fcons = new ForceConsSimpl({no:no,addr:addr,fnet,getTxq:fstmgr.getTxq,onbk,onlbk,stoped:true})

fstmgr.getbks=fcons.getbks;


var wss={};
const send2ws=(mo)=>{  const ms=JSON.stringify(mo);  for(let wsid of Object.keys(wss)){wss[wsid].send(ms)} }

if(opts.http_port && opts.http_host){

const index_html = fs.readFileSync(opts.http_files+'/index.html')
const force_graph_js = fs.readFileSync(opts.http_files+'/force-graph.min.js')
//console.log(no,index_html.toString());
const httpserver = http.createServer((req, res)=> {
  console.log('url',req.url)
  switch(req.url){
    case '/': {res.end(index_html);return;}
    case '/force-graph.min.js': {res.end(force_graph_js);return;}
    case '/api':{res.end(JSON.stringify({ok:1}));return;}
  }
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.write(JSON.stringify({error:'invalid url',url:req.url}));
  res.end()
})

httpserver.listen(opts.http_port, opts.http_host, () => { console.log(`http server listen ${opts.http_host}:${opts.http_port}`)});

const wsserver = new WebSocketServer({server:httpserver})
wsserver.on('connection', (ws)=> {
  const wsid = rndstr(8);  ws.wsid=wsid;  wss[wsid]=ws;
  ws.on('message', (msg)=> { const mo=JSON.parse(msg);  console.log(no,'ws:', mo);  });
  ws.on('error', (err)=> {console.log(no,'ws err',err)});
  ws.on('close', ()=> { console.log(no,'ws close',wsid);  delete wss[wsid];  });
});

} // opts.http_port && opts.http_host

return {acc:{addr,host,port},fnet,ftxmgr,fstmgr,fcons,run:fcons.run,connect:fnet.connect}

}

export { forcenodesimpl as ForceNode }


