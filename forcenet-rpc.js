/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import crypto from 'crypto'
import EventEmitter from 'events';

import {rndstr,hash256} from './forceutil.js'


function rpcmgr(opt){

const addr = opt.addr;
const no = opt.no;

const ems={}
const rpcMaxWaitTime = 2000

this.run = async (q,a)=>{
 if(opt.log)console.log(no,'rpcmgr::rpc',q,a)
 return new Promise( async (resolve, reject) => {
  //if(!nodes[a]){reject('net this.rpc unknown addr',a);return;}
  const id=rndstr(16);
  if(!(await opt.sendTo({what:'net.rpc',id:id,q:q},a))){ reject("rpc !fn.sendTo(rpcdata,a)"); return; }
  const em=new EventEmitter(); ems[id]=em;
  const to=setTimeout(() => { delete ems[id]; reject(new Error("rpc timeout error")); }, rpcMaxWaitTime);
  em.once('event', (data) => { delete ems[id]; clearTimeout(to); resolve(data); });
 });
}


this.onmsg = async (mo)=>{

  const data=mo.data;  const {from}=data;

  switch(data.what){
    case 'net.rpc':{
      if(opt.log)console.log(no,'net::onmsg: net.rpc',from.addr,data.q.what)
      let resp={what:'net.rpc_resp',id:data.id}
      try{resp.res=await opt.onrpc(mo)}catch(e){if(opt.log)console.log(no,'rpc opt.onrpc err',e);resp.err=e;}
      //console.log('this.onmsg resp',resp)
      if(!(await opt.sendTo(resp,from.addr))){console.error(no,"net onmsg !fn.sendTo",resp,from.addr);return;}
      break;
    }
    case 'net.rpc_resp':{
      if(opt.log)console.log(no,'net::onmsg: net.rpc_resp',from.no,from.addr,data.res)
      const id=data.id;
      if(!ems[id]){console.error(no,'net onmsg orphan net.rpc_resp',id);break;}
      ems[id].emit('event',data);
      break;
    }
    default:{}
  }
  return mo;
}
  
}

export { rpcmgr as ForceNetRpc }