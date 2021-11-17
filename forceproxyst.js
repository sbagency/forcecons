/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import {rndstr,hash256,mrgobj} from './forceutil.js'


export function pxSt(bks,lbk,tst){

const c={}

const ctrl = {
get: function(st, k) {
 //console.log('get',st,k)
 const v=st[k];
 if(v != undefined){
   if(v==null) return undefined;
   return v;
 }
 let bk=lbk
 while(true){
   let v=bk.st[k];
   if(v != undefined) {c[k]=v;return v;}
   v=c[k];
   if(v != undefined) {return v;}
   if(!bk.data.ph)break;
   bk=bks[bk.data.ph]
   if(!bk || !bk.st || bk.stf)break;
 }
 return undefined;
},
set: function(st, k, v) {
 //console.log('set',st,k, v)
 st[k]=v;
 return true
},
deleteProperty: function(st, k) {
 st[k] = null;
 return true;
}
};

this.pst=new Proxy(tst, ctrl);
}

export function mrgSt(bks,lbk){
 let bk=lbk
 const st={}
 while(true){
  if(!bk || !bk.st || bk.stf)break;
  if(!bk.data.ph)break;
  for(let k of Object.keys(bk.st)){
    if(st[k]!=undefined)continue;
    const v=bk.st[k]
    if(v==null)continue;
    st[k]=v;
  }
  bk=bks[bk.data.ph];
 }
 return st;
}
