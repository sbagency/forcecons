/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import {rndstr,hash256,mrgobj} from './forceutil.js'

//import {ForceRevSt} from '../forcerevst.js'
import {pxSt} from './forceproxyst.js'

function stmgr(opt){

const no=opt.no
const ftxmgr=opt.ftxmgr
  
console.log('stmgr..',opt)



this.onbk = async (bk,self)=>{
  const q=bk.data.txq;
  console.log(no,'stmgr.onbk:',bk.data.no,'sender',bk.sender.no,'txql:',q.length)
  if(self){
    return true;
  }
  bk.st={}
  const txok=[]
  for(let tx of q){
    if(ftxmgr.getp(tx.h)){console.log('stmgr.onbk tx already processed',tx); delete bk.st; return false;}
    ftxmgr.popf(tx) // pop from failed if so

    const st={}; const stctrl = new pxSt(bks,bk,st); const pst=stctrl.pst;

    if(!await opt.ontx(tx,pst)){ console.log('stmgr.onbk tx processing error',tx); delete bk.st; return false;}
    mrgobj(st,bk.st);
    
  }
  ftxmgr.store(txok);
  //console.log(no,'stmgr.onbk: bk.st:',bk.st)
  return true;
}

this.onlbk = async (lbk,self)=>{
  // merge st
}

//setInterval(()=>{console.log('st',Object.keys(st).length)},3000)

this.getTxq=async (bk)=>{

  //console.log(no,'getTxq:',ftxmgr.getql(),ftxmgr.gettxsl(),ftxmgr.gettxfl())
  
  const bks=this.getbks();
  
  let q=ftxmgr.getq(); ftxmgr.resetq()
  bk.st={}
  const txf=[],txok=[]
  for(let tx of q){
    if(ftxmgr.getp(tx.h)){continue;} // already processed
    ftxmgr.popf(tx) // pop from failed if so
    
    const st={}; const stctrl = new pxSt(bks,bk,st); const pst=stctrl.pst;
    
    if(!await opt.ontx(tx,pst)){txf.push(tx); continue;}
    mrgobj(st,bk.st); txok.push(tx);
  }
  //console.log(no,'stmgr.getTxq: bk.st:',bk.st)
  ftxmgr.store(txok); ftxmgr.storef(txf);
  
  return txok;
  
}

//this.getbks;


}

export {stmgr as ForceStMgr}
