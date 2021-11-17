/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import crypto from 'crypto'


function signer(opt){

const acc = opt.acc;
if(!acc){console.log('signer: !acc',opt);process.exit(1);}
if(acc.scryptopts){
  const salt=Buffer.from(acc.salt,'base64')
  opt.pwd = crypto.scryptSync(opt.pwd, salt, 64, acc.scryptopts);
}


const pwd = opt.pwd;
const createOpts = {key: Buffer.from(acc.sk,'base64'), format: 'der',type: 'pkcs8'}
if(pwd)createOpts.passphrase=pwd
const privateKeyObj = crypto.createPrivateKey(createOpts);
const publicKeyObj = crypto.createPublicKey({key: privateKeyObj});
const publicKeyBuf = publicKeyObj.export({ format: 'der', type: 'spki' })
const publicKeyStr = publicKeyBuf.toString('base64')
const my_addr = crypto.createHash('sha256').update(publicKeyBuf).digest().toString('base64');

if(acc.pk!=publicKeyStr){
  console.log('signer: public keys comparison error',acc,publicKeyStr)
  process.exit(1)
}

if(my_addr != acc.addr){
  console.log('signer: my_addr != acc.addr',my_addr,acc.addr)
  process.exit(1)
}


if(acc.sign){
const signBuf = Buffer.from(acc.sign,'base64')
delete(acc.sign)
const acch = crypto.createHash('sha256').update(JSON.stringify(acc)).digest()
if(!crypto.verify(null, acch, publicKeyObj, signBuf)){
  console.log('!crypto.verify(null, acch, publicKeyObj, signBuf)',acch, publicKeyBuf, signBuf)
  process.exit(1)
}
}


this.sign=(mo)=>{
  // mo : {data:{...}, sigs:{...}}
 if(!mo.data){console.log(mo);throw new Error('signer.sign: !mo.data')}
 const mh = crypto.createHash('sha256').update(JSON.stringify(mo.data)).digest();
 const signature = crypto.sign(null, mh, privateKeyObj).toString('base64');
 mo.sigs = mo.sigs || {};
 mo.sigs[my_addr]={pk:publicKeyStr,sig:signature}
 return mo;
}



this.getPublicKey=()=>{
  return publicKeyBuf
}

  
}

function verifier(opt){
  
opt = opt || {};
const keys={};

if(opt.keys){ // opt.keys[addr]=key
  for(let addr of Object.keys(opt.keys)){
    keys[addr]=crypto.createPublicKey({key: Buffer.from(opt.keys[addr],'base64'), format: 'der',type: 'spki'})
  }
}

this.verify=(mo)=>{
  // mo : {data:{...}, sigs:{...}}
 if(!mo.data){console.log(mo);throw new Error('verifier.verify: !mo.data')}
 const sigs = mo.sigs;
 if(!sigs){console.log(mo);throw new Error('verifier.verify: !mo.sigs')}
 const mh = crypto.createHash('sha256').update(JSON.stringify(mo.data)).digest();
 if(Object.keys(sigs).length==0){console.log(mo);throw new Error('verifier.verify: Object.keys(sigs).length==0')}
 for(let addr of Object.keys(sigs) ){
  const sig=sigs[addr].sig;
  const signature=Buffer.from(sig,'base64')
  let publicKeyObj=keys[addr];
  if(!publicKeyObj){
    publicKeyObj=crypto.createPublicKey({key: Buffer.from(sigs[addr].pk,'base64'), format: 'der',type: 'spki'});
    keys[addr]=publicKeyObj;
  }
  if(!crypto.verify(null, mh, publicKeyObj, signature)){ throw new Error(`verifier: !crypto.verify',${addr},${sig}`);}
 }
 return true;
}

this.setKey=(addr,pk)=>{
  keys[addr]=crypto.createPublicKey({key: Buffer.from(pk,'base64'), format: 'der',type: 'spki'})
}
  
}

export { verifier as ForceVerifier, signer as ForceSigner }
