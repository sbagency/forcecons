import {ForceNetRpc} from './forcenet-rpc.js'
import {rndstr,hash256,pause} from './forceutil.js'

function cons(opt){
  
console.log('cons',opt)

const no=opt.no;
const addr=opt.addr;
const fnet = opt.fnet;
const fdb = opt.fdb;

const finLen = opt.finLen || 8;
const xinLen = opt.xinLen || 8;

var stoped=opt.stoped;

var oblock=0;

this.onmsg = async (mo)=>{

  const data=mo.data;  const from=data.from;
  
  switch(data.what){
    case 'cons.ping':{
      console.log(no,'cons.ping',data.nonce,'from:',from.no, from.addr.substr(0,8))
      return;
    } // ping
    case 'bk':{
      const bk=data.bk;
      if(bks[bk.h]){console.log(no,'bk exists',bk,'from:',from.no, from.addr.substr(0,8)); return;}
      if(bk.data.no<=fbk.data.no){console.log(no,'bk.data.no<=fbk.data.no drop bk',bk); return;}
      
      //if(!bks[bk.data.ph]){ await pause(200); if(bks[bk.data.ph]){console.log(no,'no orphan after pause',bk.data.no,bk.h.substr(0,8))}}
      
      if(!bks[bk.data.ph]){ // orphan bk

       if(oblock>0){console.log(no,'orphan bk already in process, ignore other orphans');return;}
       oblock++;
       
       let from_addr=from.addr; let from_no=from.no;
       let obk=bk;

       const get_bks=async (h)=>{
        let q={what:'get_bk',h:h}
        try{
          let resp=await fnrpc.run(q,from_addr);
          if(resp.err){console.log(no,'err',resp);return null;}
          return resp.res;
        }catch(e){ console.log(no,'get_bk rpc error',e);}
        return null;
       }
       
       let obks=[]; let gbk=obk; obks.push(gbk); let wdc=1000;
       
       while(!bks[gbk.data.ph]){
        wdc--;if(wdc==0){oblock--;console.log(no,'error getting orphan chain too long, wdc==0');return;}
        gbk=await get_bks(gbk.data.ph);
        //if(!gbk || !gbk.data || !gbk.data.ph){oblock--;console.log(no,'error getting orphan chain !gbk');return;}
        if(!gbk || !gbk.data || !gbk.data.ph){console.log(no,'orphan !gbk, obks.length',obks.length);break;}
        if(gbk.data.no<=fbk.data.no){console.log(no,'orphan gbk.data.no<=fbk.data.no',gbk,'obks.length',obks.length); break;}
        obks.push(gbk);
       }
       
       //console.log(no,'orphan bk, collected',obks.length, 'lbk:',lbk.data.no,lbk.h.substr(0,8))
       
       for(let i=obks.length-1;i>=0;i--){
         let xbk=obks[i]
        if(bks[xbk.h]){ console.log(no,'orphan bk, already taken',xbk); continue; }
        if(!takebk(xbk)){ console.log(no,'orphan bk, !takebk(xbk) finish'); oblock--; return;}
       }
         
       console.log(no,'orphan bk, finished',obks.length, 'lbk:',lbk.data.no,lbk.h.substr(0,8), 'bk:',bk.data.no,bk.h.substr(0,8),'from:',from.no);

       oblock--;
       
       //checkChain(bk)
       return;
      } // orphan
      
     if(!takebk(bk)){ console.log('onmsg bk, error !takebk(bk)'); return;}
     
     // send bk_ok
     const bk_ok = {no:bk.data.no,h:bk.h,timestamp:Date.now()}
     await fnet.send({what:"bk_ok",bk_ok })

      bk.oks.m[addr]=1;bk.oks.cnt++;

      if(fnet.getConnsNum()<=1){
        bk.oks.done=1;
        checkChain(bk);
        return;
      }
        
        setTimeout(()=>{
          if(bk.oks.done)return;
          console.log(no,'bk is not confirmed',bk.data.no,bk.h.substr(0,8),'cnt',bk.oks);
          delete bks[bk.h];
        },3000)
        
     
        
      
      //checkChain(bk)
      return;
    } // bk
    
    case 'bk_ok':{
      const bk_ok=data.bk_ok;
      if(!from || !from.addr){console.log(no,'bk_ok !from || !from.addr',mo); return;}
      if(!bks[bk_ok.h]){
        for(let i=0;i<5;i++){await pause(100);if(bks[bk_ok.h])break;}
        if(!bks[bk_ok.h]){console.log(no,'bk_ok.h !exists',bk_ok.no,bk_ok.h.substr(0,8),'from:',from.no);return;}
      }
      
      let bk=bks[bk_ok.h];
      

      if(!bk.oks){console.log(no,'!bk.oks',bk.data.no,bk.h.substr(0,8));return;}
      
      if(bk.oks.m[from.addr]){console.log(no,'bk_ok from',from,'exists',bk_ok.no,bk_ok.h.substr(0,8));return;}
      bk.oks.m[from.addr]=1; bk.oks.cnt++;
      
      let q=fnet.getConnsNum() //opt.q(addr)
      q=1+Math.floor(q/2);
      if(no==0)console.log(no,'q',q);
      if(bk.oks.cnt>=q && !bk.oks.done){
        bk.oks.done=1;
        checkChain(bk);
      }


      //console.log(no,'bk_ok',bk_ok.no,bk_ok.h.substr(0,8),'sender:',bk.sender.no,'from:',from.no,'cnt',bk.oks.cnt)

      break;
    }
    
  }
  
  fnrpc.onmsg(mo)
}


const onrpc = async (mo)=>{

  const {from,q}=mo.data;
  
  switch(q.what){
    case 'get_bk':{ // q.h
      return new Promise( (resolve,reject) => {
        const bk=bks[q.h]
        if(!bk){ reject({err:'no bk',h:q.h});return;}
        else{resolve(bk);return;}
      });
    }
    
    case 'cons.test':{
      return new Promise( (resolve,reject) => {resolve({test:'ok',c:(q.a+q.b)})} );
    }
  }
 
  return new Promise( (resolve,reject) => {reject("unknown q.what")});
 
}


const fnrpc = new ForceNetRpc({addr,no,sendTo:fnet.sendTo,onrpc})


const bks={};
const lvbks={};
var lbk,fbk;
var stats={};

//const fbka=[];

/*
const upd_fbk=()=>{
  let fbk0=lbk;
  let i=finLen;while(i>0){
    let bk=bks[fbk0.data.ph]
    if(!bk)break;
    fbk0=bk;
    i--;
  }
  fbk=fbk0;
}
*/

(async ()=>{
  const bk0={data:{no:0,ph:null,timestamp:1633776181717,rndstr:'b23648269e4f74ea49d355bd040881d0d1eec1177b31efafb252acc7a323ab00'}}
  bk0.h=await hash256(JSON.stringify(bk0.data))
  bk0.sender={no:null,addr:null}
  bk0.finalized=true; //fbka.push(bk0);
  console.log('bk0',bk0)
  bks[bk0.h]=bk0;
  lbk=bk0;
  fbk=bk0;
})()

const takebk=(bk,self)=>{
 if(bks[bk.h]){console.log('bk already taken',bk.data.no,bk.h.substr(0,8));return false;}
 if(opt.onbk){
   if(!opt.onbk(bk,self))return false;
 }
 bks[bk.h]=bk;
 //bkwatch[bk.h]=bk;
 const pbk=bks[bk.data.ph];  if(pbk){if(!pbk.nbks)pbk.nbks=[]; pbk.nbks.push(bk);}
 
 const saddr=bk.sender.addr; if(!stats[saddr])stats[saddr]={bk:0,fbk:0}; stats[saddr].bk++;
 
 return true
}

const verifyChain=(bk)=>{
  return true;
  let bk0=bk
  if(lvbks[bk.h])return true
  for(let i=bk.data.no;i>0;i--){
   let pbk=bks[bk.data.ph]
   if(!pbk){console.log('verifyChain !pbk',bk.data.ph);return false;}
   if(pbk.data.no+1!=bk.data.no){console.log('verifyChain pbk.data.no+1!=bk.data.no',pbk.data.no,bk.data.no);return false;}
   bk=pbk
   if(lvbks[bk.h]) break;
  }
  lvbks[bk0.h]=bk0
  return true
}


const lastBoKey = '_last_key-7332-9098-42ff-ab56'

//var dbLock = 0;

//setInterval(async ()=>{dbLock++; await fdb.flush(); dbLock--;},3000)

const fdb_put_bo=async (h,bo,pref)=>{ // fdb_put_bo(bk.h,bk,'bk'); fdb_put_bo(tx.h,tx,'tx')
//  while(dbLock)await pause(10);

//  fdb.put(pref + h,JSON.stringify(bo))
//  if(pref)fdb.put(pref+lastBoKey,h)
  fdb.batch([
    {type:'put',key:pref+h,value:JSON.stringify(bo)},
    {type:'put',key:pref+lastBoKey,value:h}
  ])
}

const fdb_get_last_bo=async (pref)=>{ // fdb_get_last_bo('bk')
//  while(dbLock)await pause(10);
  const h = await fdb.get(pref + lastBoKey)
  if(!h) return null;
  const bin = await fdb.get(h)
  if(!bin) return null;
  let bo;try{ bo=JSON.parse(bin); }catch(e){console.log(e); return null;}
  return bo;
}

const fdb_get_bo=async (h)=>{
//  while(dbLock)await pause(10);
  const bin = await fdb.get(h);
  if(!bin) return null;
  let bo;try{ bo=JSON.parse(bin); }catch(e){console.log(e); return null;}
  return bo;
}



const checkChain=(bk,self)=>{
  if(bk.data.no>lbk.data.no){
    if(!verifyChain(bk)){
      console.log(no,'!verifyChain',bk)
      throw new Error('checkChain !verifyChain bk.data.no '+bk.data.no)
    }
    if(opt.onlbk)opt.onlbk(bk,self)
    lbk=bk;
    //const fbk0=fbk;
    //upd_fbk();
    //{
    //  let fbk0=lbk;
    //  let i=finLen;while(i>0){
    //    let bk=bks[fbk0.data.ph]
    //    if(!bk)break;
    //    fbk0=bk;
    //    i--;
    //  }
    //  fbk=fbk0;
    //}
    
    if(lbk.data.no-fbk.data.no>finLen){
      const fbk_no_1 = fbk.data.no+1;
      let bki=lbk;while(bki.data.no>fbk_no_1){
        bki=bks[bki.data.ph]
      }
      console.log(no,'bki:', bki.data.no, bki.h.substr(0,8), 'fbk:', fbk.data.no, fbk.h.substr(0,8) );
      
      //let bki=lbk;let i=finLen;while(i>0){
      //  let _bk=bks[bki.data.ph]; if(!_bk)break; bki=_bk;
      //}
      //if(fbk!=bki){
       if(fbk!=bks[bki.data.ph]){
         console.log(no,'fbk!=bks[bki.data.ph]',fbk,bks[bki.data.ph])
         throw  new Error('fbk!=bks[bki.data.ph' + fbk.data.no +':'+fbk.h.substr(0,8))
       }
       fbk=bki;
       fbk.finalized=true; fdb_put_bo(fbk.h,fbk,'bk'); //fbka.push(fbk);
       const saddr=fbk.sender.addr; if(!stats[saddr])stats[saddr]={bk:0,fbk:0}; stats[saddr].fbk++;
       if(opt.onfbk)opt.onfbk(fbk,self);
      //}
    }
    let fbk_data_ph = fbk.data.ph || 'null';
    console.log(no,'lbk:',lbk.data.no,lbk.h.substr(0,8),'->',lbk.data.ph.substr(0,8),
                   'fbk:',fbk.data.no,fbk.h.substr(0,8),'->',fbk_data_ph.substr(0,8),
                   'sender:',bk.sender.no,'txql',bk.data.txq.length)
  }
}

/*
const fbka_watch=()=>{
  const rbks=[]; let maxno=0;
  while(fbka.length>fbkaLen){
    const bk=fbka.shift()
    //console.log(no,'fbka_watch fbka.shift',bk.data.no,bk.h.substr(0,8))
    delete bks[bk.h]; delete lvbks[bk.h];
    rbks.push(bk); if(bk.data.no>maxno)maxno=bk.data.no;
  }
  if(rbks.length>0){
    console.log(no,'fbka_watch rbks.length>0',rbks,maxno)
    if(opt.onrbk)opt.onrbk(rbks,maxno)
  }
}

setInterval(fbka_watch,2100)
*/
const stats_watch=()=>{
  console.log(no,'stats:',stats)
}

//setInterval(stats_watch,2500)

/*
const upd_bkwatch=()=>{
  const rbks=[]
  for(let h of Object.keys(bkwatch)){
    const bk=bkwatch[h]
    if(bk.finalized) { delete bkwatch[h]; continue;}
    if(bk.data.no<=fbk.data.no && fbk.h!=bk.h){
      const txq=bk.data.txq;
      //if(opt.revTxq && txq.length>0)opt.revTxq(txq);
      //console.log(no,'upd_bkwatch >>>> ',bk.data.no,bk.h.substr(0,8))
      if(bk.sender.addr == addr){
        if(opt.revTxq)opt.revTxq(txq);
      }
      rbks.push(bk.h);
      delete bkwatch[h];
    }
  }
  //if(rbks.length>0){
    //if(opt.onrbk)opt.onrbk(rbks)
  //}
}
*/

//setInterval(upd_bkwatch,2000)

/*
var bk_watch_head;
var bk_watch_tail;

const upd_bkwatch=()=>{
  while(bk_watch_head){
    if(bk_watch_head.finalized){ bk_watch_head = bk_watch_head.bk_watch_next; continue;}
    if(bk_watch_head.data.no<=fbk.data.no){
      const txq=bk_watch_head.data.txq;
      if(opt.revTxq && txq.length>0)opt.revTxq(txq);
      bk_watch_head = bk_watch_head.bk_watch_next;
      continue;
    }
    else {break;}
  }
}
*/


//const bkwatch={}

var bk_prod_cnt = 0;
async function bk_prod() {
  
  if(oblock==0){
  
  const lbk0=lbk;
  
  const bk={data:{no:lbk0.data.no+1,ph:lbk0.h,timestamp:Date.now()}}
  let txq=[]; if(opt.getTxq)txq=await opt.getTxq(bk);
  bk.data.txq=txq;
  bk.h=await hash256(JSON.stringify(bk.data))
  bk.sender={no:no,addr:addr}
  bk.proof={nonce:rndstr(8)}
  bk.oks={cnt:1,m:{}}
  bk.oks[addr]=1
  

  if(lbk0!=lbk && !stoped){console.log(no,'>>reprod>>',lbk0.data.no,lbk.data.no);setTimeout(bk_prod, 10);return;}

  if(!takebk(bk,true)){ console.log('bk_prod, error !takebk(bk,true)',bk);return; }
   
  checkChain(bk,true);
  
  //bkwatch[bk.h]
  //if(!bk_watch_head)bk_watch_head=bk;
  //if(!bk_watch_tail){bk_watch_tail=bk;}else {bk_watch_tail.bk_watch_next=bk;bk.bk_watch_prev=bk_watch_tail;bk_watch_tail=bk;}
  //bkwatch[bk.h]=bk

  await fnet.send({what:"bk",bk:bk,nonce:bk_prod_cnt++})
  
  }

  if(!stoped)setTimeout(bk_prod, 2000+Math.floor(Math.random() * 2000));
}



var pingcnt=0;
async function ping_tick() {
  await fnet.send({what:"cons.ping",nonce:pingcnt++})
  if(!stoped)setTimeout(ping_tick, 3000+Math.floor(Math.random() * 1000));
}


this.stop=()=>{
  stoped=true
  if(opt.onstop)opt.onstop();
}

this.run=()=>{
  if(!stoped)return;
  stoped=false
  //setTimeout(ping_tick, 100);
  setTimeout(bk_prod,1000);
  //setTimeout(testrpc_tick, 100);
  if(opt.onrun)opt.onrun();
}

this.getbk=(h)=>{return bks[h]}

this.getbks=()=>{return bks;}

}  // cons




export { cons as ForceConsSimpl }