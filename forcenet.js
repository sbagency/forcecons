/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import net from 'net'
import crypto from 'crypto'
import EventEmitter from 'events';

import {rndstr,hash256,pause} from './forceutil.js'
import {encK,decK} from './forcecrypto.js'

const ecdhCurve = 'secp521r1'; // crypto.getCurves() // openssl ecparam -list_curves // X25519


function netmgr(opt){


const addr = opt.addr;
if(!addr){console.log('netmgr: !addr',opt);process.exit(1)}
const no = opt.no;

var server;

var nodes={};


const sockclose=(sock)=>{sock.destroy();}


const onconnect=(sock)=>{
  
  sock.forcenet_nonce=0;
  sock.setNoDelay();
  let rs={buf:'',len:0,ho:1}
  let done=false;

  sock.on('data', async (chunk)=>{
   if (chunk == undefined || chunk == null) { console.log(no,'sock.on data is undefined or null'); sockclose(sock); return; }
   
   let data = chunk.toString(); // {ho}{mo}
   //if(opt.log)console.log('sock.on data:',data)
   rs.buf+=data;

   while(rs.buf.length>0){
   
   let ho;
   if(rs.ho==1){ // {ho}
    let i=rs.buf.indexOf('}{');
    if(i==-1){
      if((rs.buf.length)>1024){ console.log(no,'sock.on data header is incorrect',rs.buf); sockclose(sock); return; }
      return;
    }
    i+=1;
    let hs; try{
     hs=rs.buf.substr(0,i)
     ho=JSON.parse(hs);
     if(opt.verify)await opt.verify(ho);
    }catch(e){console.log(no,'sock.on data ho parse/verify error',hs,e); console.log(no,e);sockclose(sock); return;}
    rs.ho=0
    rs.buf=rs.buf.substr(i)
    rs.len=ho.data.len;
    if(opt.log)console.log(no,'ho',ho)
   } // {ho}

   if(rs.len>rs.buf.length){
     //console.log('rs.len>rs.buf.length',rs.len,rs.buf.length)
     return;
   }

   rs.ho=1;
   
   let mo; let ms; try{
     //if(!ho){console.log(no,'!ho','rs:',rs)}
     ms=rs.buf.substr(0,rs.len); rs.buf=rs.buf.substr(rs.len)
     //console.log('ms',ms)
     mo=JSON.parse(ms)
     if(mo.encd){
       if(!sock.secret) throw new Error('!sock.secret but mo.encd');
       const decd=Buffer.from(mo.encd,'hex')
       //console.log('decd:',decd)
       mo=JSON.parse(decd)
     }
     if(opt.verify)await opt.verify(mo)
     if(opt.log)console.log(no,'mo',mo)
   }catch(e){ console.log(no,'sock.on data mo parse/verify error','rs.len',rs.len,'ms:',ms,e); sockclose(sock); return; }
   
   
   if(!mo.data.from || !mo.data.from.addr){console.log('!mo.data.from',mo);sockclose(sock);return;}
   
   
   if(!sock.outgoing && !sock.forcenet_cnt){ // incomming connection
     console.log(no,'1st mo',mo)
     if(mo.data.what!='1st'){console.log(no,'mo.data.what!=1st',mo);sockclose(sock);return;}
     const n_addr=mo.data.from.addr; nodes[n_addr]=sock; sock.forcenet_addr=n_addr;
     sock.forcenet_cnt=1;
     const ecdh = crypto.createECDH(ecdhCurve); ecdh.generateKeys(); sock.ecdh=ecdh;
     sock.secret = ecdh.computeSecret(Buffer.from(mo.data.pk,'base64'), null, 'base64');
     console.log(no,'sock.secret',sock.secret)
     const ms=await mpack(sock,{data:{what:"2nd",pk:ecdh.getPublicKey().toString('base64')}})
     await writeTo(sock,ms)
     continue;
   }
   
   if(!sock.forcenet_cnt){ // outgoing connection
     console.log(no,'2nd mo',mo)
     const n_addr=mo.data.from.addr;
     if(!sock.forcenet_addr){nodes[n_addr]=sock; sock.forcenet_addr=n_addr;}
     else if(sock.forcenet_addr!=n_addr){console.log(no,'2nd mo sock.forcenet_addr!=n_addr',sock.forcenet_addr,n_addr,mo);sockclose(sock);return;}
     sock.forcenet_cnt=1;
     if(mo.data.what!='2nd'){console.log(no,'mo.data.what!=2nd',mo);sockclose(sock);return;}
     sock.secret = sock.ecdh.computeSecret(Buffer.from(mo.data.pk,'base64'), null, 'base64');
     console.log(no,'sock.secret',sock.secret)
     continue;
   }
  
   opt.onmsg(mo);
   
   } //while
   
 })
 sock.on('error', (e)=>{
   console.log(e)
 })
 sock.on('close', ()=>{
   console.log(no,'close',sock.forcenet_addr)
   delete nodes[sock.forcenet_addr];
 })
}

server =  net.createServer();
server.listen(opt.port, opt.host, () => { console.log(`net server listen ${opt.host}:${opt.port}`)});
server.on('connection', (sock)=>{
 //console.log(no,'server.on(connection)',sock)
 onconnect(sock)
});


setTimeout(()=>{
  
if(opt.bootnodes){

for(let n of opt.bootnodes){
 const n_addr=n.addr;
 if(addr==n_addr || nodes[n_addr]) { continue }
 const n_host=n.host;
 const n_port=n.port;
 
 const sock = new net.Socket();sock.outgoing=true;
 sock.on('error', (e)=>{
   console.log(no,e)
 })
 
 sock.connect(n_port, n_host, async ()=> {
   onconnect(sock)
   nodes[n_addr]=sock
   sock.forcenet_addr=n_addr
   const ecdh = crypto.createECDH(ecdhCurve); ecdh.generateKeys(); sock.ecdh=ecdh;
   const ms=await mpack(sock,{data:{what:"1st",pk:ecdh.getPublicKey().toString('base64')}})
   await writeTo(sock,ms)
 })
 
} // for

} else if(opt.gw_host && opt.gw_port){
    
 const sock = new net.Socket();;sock.outgoing=true;
 sock.on('error', (e)=>{ console.log(no,e) })
 sock.connect(opt.gw_port, opt.gw_host, async ()=> {
   onconnect(sock)
   //nodes[n_addr]=sock; sock.forcenet_addr=n_addr;
   const ecdh = crypto.createECDH(ecdhCurve); ecdh.generateKeys(); sock.ecdh=ecdh;
   const ms=await mpack(sock,{data:{what:"1st",pk:ecdh.getPublicKey().toString('base64')}})
   await writeTo(sock,ms)
 })
  
}
},500) // setTimeout

this.connect = (ns)=>{
  
console.log(no,'connect',ns)
for(let n of ns){
 const n_addr=n.addr;
 if(addr==n_addr || nodes[n_addr]) { continue }
 const n_host=n.host;
 const n_port=n.port;
 
 //console.log('connecting...',{n_host,n_port,n_addr} )

 const sock = new net.Socket();sock.outgoing=true;
 sock.on('error', (e)=>{
   console.log(no,e)
 })
 
 sock.connect(n_port, n_host, async ()=> {
   onconnect(sock)
   nodes[n_addr]=sock; sock.forcenet_addr=n_addr;
   const ecdh = crypto.createECDH(ecdhCurve); ecdh.generateKeys(); sock.ecdh=ecdh;
   const ms=await mpack(sock,{data:{what:"1st",pk:ecdh.getPublicKey().toString('base64')}})
   await writeTo(sock,ms)
 })
}
}




const mpack=async (s,mo)=>{
 const data=mo.data
 data.date=Date.now(); if(!data.from)data.from={};data.from.addr=addr; data.from.no=no;
 if(opt.sign)await opt.sign(mo);
 let ms=JSON.stringify(mo);
 const mh=await hash256(ms);
 if(s.secret && s.forcenet_nonce>0){
  const encd=Buffer.from(ms).toString('hex')
  ms=JSON.stringify({encd})
 }
 const ho={data:{nonce:s.forcenet_nonce++,len:ms.length,h:mh}}
 if(opt.sign)await opt.sign(ho);
 const hs=JSON.stringify(ho);
 const res=[hs,ms].join('') // {ho}{mo}
 //if(opt.log)console.log(no,'mpack res:',res)
 return res
}

const writeTo=async (s,ms)=>{
  return new Promise((resolve,reject) => {
    const to=setTimeout(()=>{reject(new Error("socket write timeout"))},1000)
    s.write(ms,(n)=>{clearTimeout(to);resolve(n)})
  });
}


this.send = async (data)=>{
 for(let a of Object.keys(nodes) ){
  const s=nodes[a]
  try{
   const mo={data}
   const ms=await mpack(s,mo)
   await writeTo(s,ms)
  }catch(e){console.log(no,'send error',e);sockclose(s);}
 }
}


this.send2 = async (dataArr)=>{
 for(let a of Object.keys(nodes) ){
  const s=nodes[a]
  let mspack=''
  try{
   for(let data of dataArr){
   const mo={data}
   const ms=await mpack(s,mo)
   mspack+=ms
   }
   if(mspack.length>0){
    await writeTo(s,mspack)
   }
  }catch(e){console.log(no,'send error',e);sockclose(s);}
 }
}


this.sendTo = async (data,a)=>{
 const s=nodes[a]; if(!s)return false;
 try{
  const mo={data}
  const ms=await mpack(s,mo)
  await writeTo(s,ms)
 }catch(e){console.log(no,'sendTo error',e);sockclose(s);return false;}
 return true;
}


this.getConnsNum = ()=>{
  return Object.keys(nodes).length;
}
this.getConns = ()=>{
  const addrs=[]
  for(let a of Object.keys(nodes)){
    addrs.push(a)
  }
  return addrs
}

this.getFirstConn = ()=>{
  if(nodes){
   for(let a of Object.keys(nodes)){
    return a
   }
  }
  return null
}

this.getRndConn = ()=>{
  if(nodes){
    const keys=Object.keys(nodes);
    if(keys.length>0) return keys[Math.floor(Math.random() * keys.length)]
  }
  return null
}



} // netmgr


export { netmgr as ForceNet }