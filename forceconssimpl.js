import {ForceNetRpc} from './forcenet-rpc.js'
import {rndstr,hash256} from './forceutil.js'

function cons(opt){
  
console.log('cons',opt)

const no=opt.no;
const addr=opt.addr;
const fnet = opt.fnet;

var stoped=opt.stoped;

var oblock=0;

const pause=(ms)=>{ return new Promise((resolve) => { setTimeout( () => { resolve(); }, ms); }); }
const now=()=>Date.now(); //(new Date()).toISOString()


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
      if(!bks[bk.data.ph]){ // orphan bk
      
       if(oblock>0){console.log(no,'orphan bk already in process, ignore other orphans');return;}
       oblock++;
       
       let from_addr=from.addr; let from_no=from.no; let obk=bk;

/*
       await pause(200);
       
       if(bks[bk.data.ph]){ // bk is not orphan after pause
        if(!takebk(bk)){ console.log(no,'onmsg bk, error !takebk(bk)'); oblock--; return;}
        oblock--;
        console.log(no,'orphan bk is not orphan after a pause',obk.data.no,obk.h.substr(0,8),'from:',from_no)
        return;
       }
*/
       const get_bks=async (h)=>{
        let q={what:'get_bk',h:h}
        try{
          //let resp=await opt.rpc(JSON.stringify(q),from_addr);
          let resp=await fnrpc.run(q,from_addr);
          //console.log(no,'resp',resp)
          if(resp.err){console.log(no,'err',resp);return null;}
          return resp.res;
        }catch(e){ console.log(no,'get_bk rpc error',e);}
        return null;
       }
       
       let obks=[]; let gbk=obk; obks.push(gbk); let wdc=1000;
       
       while(!bks[gbk.data.ph]){
        wdc--;if(wdc==0){oblock--;console.log(no,'error getting orphan chain too long, wdc==0');return;}
        gbk=await get_bks(gbk.data.ph);
        if(!gbk || !gbk.data || !gbk.data.ph){oblock--;console.log(no,'error getting orphan chain !gbk');return;}
        obks.push(gbk);
       }
       
       console.log(no,'orphan bk, collected',obks.length)
       
       for(let i=obks.length-1;i>=0;i--){
         let xbk=obks[i]
        if(bks[xbk.h]){ console.log(no,'orphan bk, already taken',xbk); continue; }
        if(!takebk(xbk)){ console.log(no,'orphan bk, !takebk(xbk) finish'); oblock--; return;}
       }
         
       console.log(no,'orphan bk, finished',bk.data.no,bk.h.substr(0,8),'from:',from.no);

       oblock--;
       return;
      } // orphan
      
     if(!takebk(bk)){ console.log('onmsg bk, error !takebk(bk)'); return;}
        
      
      //console.log(no,'bk',bk,'from:',from.no, from.addr.substr(0,8))
      checkChain(bk)
      return;
    } // bk
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
var lbk;

(async ()=>{
  const bk0={data:{no:0,ph:null,timestamp:1633776181717,rndstr:'b23648269e4f74ea49d355bd040881d0d1eec1177b31efafb252acc7a323ab00'}}
  bk0.h=await hash256(JSON.stringify(bk0.data))
  bk0.sender={no:null,addr:null}
  console.log('bk0',bk0)
  bks[bk0.h]=bk0;
  lbk=bk0;
})()

const takebk=(bk,self)=>{
 if(bks[bk.h]){console.log('bk already taken',bk.data.no,bk.h.substr(0,8));return false;}
 if(opt.onbk){
   if(!opt.onbk(bk,self))return false;
 }
 bks[bk.h]=bk;
 return true
}

const verifyChain=(bk)=>{
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

const updInchain=(bk0,lbk0)=>{
  delete lbk.inch
  while(bk.data.no>lbk.data.no){
    bk.inch=true;
    bk=bks[bk.data.ph]; if(!bk){console.log('updInchain: !bk'); return}
  }

  while(bk.data.ph!=lbk.data.ph){
    bk.inch=true;delete lkb.inch
    bk=bks[bk.data.ph]; if(!bk){console.log('updInchain: !bk'); return}
    lbk=bks[lbk.data.ph]; if(!lbk){console.log('updInchain: !lbk'); return}
  }
  
  
}

const checkChain=(bk,self)=>{
  if(bk.data.no>lbk.data.no){
    if(!verifyChain(bk)){
      console.log(no,'!verifyChain',bk)
      throw new Error('checkChain !verifyChain bk.data.no '+bk.data.no)
    }
    if(opt.onlbk)opt.onlbk(bk,self)
    //if(bk.data.ph!=lbk.h)updInchain(bk)
    lbk=bk;
    console.log(no,'lbk:',lbk.data.no,lbk.h.substr(0,8),'->',lbk.data.ph.substr(0,8),'sender:',bk.sender.no,'txql',bk.data.txq.length)
  }
}



var bk_prod_cnt = 0;
async function bk_prod() {
  
  const lbk0=lbk;
  
  const bk={data:{no:lbk0.data.no+1,ph:lbk0.h,timestamp:Date.now()}}
  let txq=[]; if(opt.getTxq)txq=await opt.getTxq(bk);
  bk.data.txq=txq;
  bk.h=await hash256(JSON.stringify(bk.data))
  bk.sender={no:no,addr:addr}

  bk.sth = await hash256(JSON.stringify(bk.st))

  if(lbk0!=lbk && !stoped){console.log(no,'>>reprod>>',lbk0.data.no,lbk.data.no);setTimeout(bk_prod, 10);return;}

  if(!takebk(bk,true)){ console.log('bk_prod, error !takebk(bk,true)',bk);return; }
   
  checkChain(bk,true,lbk0);
  
  const bk_st=bk.st;  delete bk.st;

  await fnet.send({what:"bk",bk:bk,nonce:bk_prod_cnt})
  
  bk.st=bk_st

  if(!stoped)setTimeout(bk_prod, 1000+Math.floor(Math.random() * 2000));
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
  setTimeout(bk_prod,100);
  //setTimeout(testrpc_tick, 100);
  if(opt.onrun)opt.onrun();
}

this.getbk=(h)=>{return bks[h]}

this.getbks=()=>{return bks;}

}  // cons




export { cons as ForceConsSimpl }