/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import crypto from 'crypto'

import {rndstr,hash256} from './forceutil.js'

function txmgr(opt) {
  
var txq=[],txqm={}; // inq
const txs={}; // processed
const that=this;

this.push=(tx)=>{
 if(txs[tx.h]){console.log('tx already processed',tx.h);return false;}
 if(txqm[tx.h]){console.log('tx already in queue',tx.h);return false;}
 tx.status='inq'; txqm[tx.h]=tx; txq.push(tx);return true;
}

this.pushBatch=(batch)=>{
 let n=0;
 for(let tx of batch){
   if(that.push(tx))n++;
 }
 return n;
}

this.get=(h)=>{
 let tx=txs[h];if(tx)return tx;
     tx=txqm[h];if(tx)return tx;
  return null;
}

this.getp=(h)=>{return txs[h]}


this.getq=()=>{ return txq }
this.getql=()=>{ return txq.length }
this.resetq=()=>{ txq=[]; txqm={}; }

this.gettxsl=()=>{ return Object.keys(txs).length }

this.store=(batch)=>{
 for(let tx of batch){
  if(txs[tx.h]){throw new Error(['store:tx in txs',tx.h].join(' '))}
  if(txqm[tx.h]){throw new Error(['store:tx in txq',tx.h].join(' '))}
  txs[tx.h]=tx;
 }
}

}


export {txmgr as ForceTxMgr}