import crypto from 'crypto'

import {rndstr,hash256} from './forceutil.js'


function ForceRevSt(st0){
const tst = st0 || {}
const hist={}
this.getHist = ()=>{return hist;}

this.bk=0;
this.tx=0;

const save=(st,k,v)=>{
  const {bk,tx}=this;
  if(!hist[bk])hist[bk]={}; if(!hist[bk][tx])hist[bk][tx]={};
  if(hist[bk][tx][k])return; // already saved
  hist[bk][tx][k]=st[k];//save
}

this.revt=()=>{
  const {bk,tx}=this;
  if(!hist[bk])return; if(!hist[bk][tx])return;
  const hkt=hist[bk][tx]
  for(let k of Object.keys(hkt)){
    if(hkt[k] == undefined) delete tst[k]
    else tst[k]=hkt[k] // restore
    delete hkt[k] // delete k
  }
  delete hist[bk][tx] // delete all keys
}



this.revb=()=>{
  while(1){
    this.revt()
    if(this.tx==0)break;
    this.tx--
  }
  delete hist[this.bk]
}


const ctrl = {
get: function(st, k) {
 return st[k]
},
set: function(st, k, v) {
 save(st,k)
 st[k]=v
 return true
},
deleteProperty: function(st, k) {
 save(st,k)
 delete(st[k])
 return true;
}
};
  
this.st = new Proxy(tst, ctrl);

}



function ForceMvSt(){

const tst = {}

this.tx; // tx:{data:{},no,h,ph,bh}

const that=this;

const vlt={}


this.revt=(tx)=>{
}

this.revb=(bk)=>{
}


const ctrl = {
get: function(st, k) {
 const {tx}=that;
 const vk=vlt[k]
 if(!vk)return undefined;
 return vk.d[vk.last];
},
set: function(st, k, v) {
 const {tx}=that;
 const h=tx.h;
 console.log('set:',k,v)
 let vk=vlt[k]
 if(!vk){vk={d:{},last:null};vlt[k]=vk;}
 const last=vk.last
 const d=vk.d
 if(d[h]){ d[h].v=v; return true; }
 d[h]={v:v,prev:last}
 vk.last=h
 return true
},
deleteProperty: function(st, k) {
 return this.set(st,k,null)
}
};


  
this.st = new Proxy(tst, ctrl);
this.tst = vlt;

}


export {ForceRevSt,ForceMvSt}