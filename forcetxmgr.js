/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import crypto from 'crypto'

import {rndstr,hash256} from './forceutil.js'

function txmgr(opt) {
  
var txq=[],txqm={}; // inq
const txs={}; // processed
const txf={}; // failed

this.push=(tx)=>{
 if(txs[tx.h]){console.log('tx already processed',tx.h);return false;}
 if(txqm[tx.h]){console.log('tx already in queue',tx.h);return false;}
 if(txf[tx.h]){delete txf[tx.h]}
 tx.status='inq'; txqm[tx.h]=tx; txq.push(tx);return true;
}

this.pushBatch=(batch)=>{
 let n=0;
 for(let tx of batch){
   if(this.push(tx))n++;
 }
 return n;
}

this.get=(h)=>{
 let tx=txs[h];if(tx)return tx;
     tx=txf[h];if(tx)return tx;
     tx=txqm[h];if(tx)return tx;
  return null;
}

this.getp=(h)=>{return txs[h]}
this.getf=(h)=>{return txf[h]}
this.popf=(h)=>{const tx=txf[h]; if(tx){delete txf[h];} return tx;}


this.getq=()=>{ return txq }
this.getql=()=>{ return txq.length }
this.resetq=()=>{ txq=[]; txqm={}; }

this.gettxsl=()=>{ return Object.keys(txs).length }
this.gettxfl=()=>{ return Object.keys(txf).length }




this.store=(batch,f)=>{
 for(let tx of batch){
  if(txs[tx.h]){throw new Error(['store:tx in txs',tx.h].join(' '))}
  if(txqm[tx.h]){throw new Error(['store:tx in txq',tx.h].join(' '))}
  if(txf[tx.h]){throw new Error(['store:tx in txf',tx.h].join(' '))}
  if(f){txf[tx.h]=tx;tx.status='failed';}
  else {txs[tx.h]=tx;tx.status='processed';}
 }
}

this.storef=(batch)=>{this.store(batch,true);}

}


export {txmgr as ForceTxMgr}