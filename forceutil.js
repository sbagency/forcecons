/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'
import crypto from 'crypto'
import readline from 'readline'

const rndstr=(n)=>{
  return crypto.randomBytes(n).toString('hex')
}

const hash256=(data)=>{
 return new Promise((resolve) => {
 resolve(crypto.createHash('sha256').update(data).digest('hex'));
 });
}


const getPwdFromFileOrConsole = (fpwd)=>{

return new Promise( (resolve, reject) => {

if(fpwd){
   let pwd=fs.readFileSync(fpwd).toString()
   let l=pwd.length
   if(l<1){reject(new Error('empty pwd file'));return;}
   let pb=Buffer.from(pwd)
   if(pb[l-1] == 10 || pb[l-1] == 13) pwd=pwd.slice(0,l-1)
   if(pwd.length<1){reject(new Error('empty pwd'));return;}
   resolve(pwd)
} else {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  rl.question('enter password:', (pwd) => {
      rl.close();
      console.log();
      if(pwd.length<1){reject(new Error('empty pwd'));return;}
      resolve(pwd)
  })
  rl._writeToOutput = (s)=>{};
}


}) // promise

}


const genNewAcc = (opt)=>{

if(!opt)opt={}

const algo=opt.algo || 'ed25519';

const genOpts={
  publicKeyEncoding: {type: 'spki', format: 'der'},
  privateKeyEncoding: {type: 'pkcs8',format: 'der'}
}

const salt = crypto.randomBytes(32)
if(opt.scrypt){
  const scryptopts=opt.scryptopts || {}
  opt.pwd = crypto.scryptSync(opt.pwd, salt, 64, scryptopts);
}

if(opt.pwd){
  genOpts.privateKeyEncoding.cipher='aes-256-cbc'
  genOpts.privateKeyEncoding.passphrase=opt.pwd
}

if(opt.genopts){
for(let k of Object.keys(opt.genopts)){
  genOpts[k]=opt.genopts[k]
}
} else opt.genopts={}

if(algo=='rsa'){
  if(!genOpts['modulusLength'])genOpts['modulusLength']=4096;
}

//console.log('genOpts:',genOpts)


const { err, publicKey, privateKey } = crypto.generateKeyPairSync(algo,genOpts);
if(err){console.error(err);process.exit(1);}

const addr = crypto.createHash('sha256').update(publicKey).digest()

const acc = {
  v : "0.0.1",
  date : (new Date()).toISOString(),
  algo,
  genopts:opt.genopts,
  sk : privateKey.toString('base64'),
  pk : publicKey.toString('base64'),
  addr : addr.toString('base64'),
}

if(opt.scrypt){
  acc.scryptopts=opt.scryptopts || {};
  acc.salt=salt.toString('base64');
}

const acch = crypto.createHash('sha256').update(JSON.stringify(acc)).digest()
const privateKeyOpts = {key: privateKey, format: 'der',type: 'pkcs8'}
if(opt.pwd)privateKeyOpts.passphrase = opt.pwd;

const privateKeyObj = crypto.createPrivateKey(privateKeyOpts);
const signatureBuf = crypto.sign(null, acch, privateKeyObj);
const publicKeyObj = crypto.createPublicKey({key: privateKeyObj});

if(!crypto.verify(null, acch, publicKeyObj, signatureBuf)){
  console.log('!crypto.verify(null, acch, publicKeyObj, signatureBuf)',acch, publicKey, signatureBuf)
  process.exit(1)
}
acc.sign = signatureBuf.toString('base64')
return acc;
}


const pause=(ms)=>{ return new Promise((resolve) => { setTimeout( () => { resolve(); }, ms); }); }

const mrgobj=(o1,o2)=>{
  for(let k of Object.keys(o1)){
    o2[k]=o1[k]
  }
}

export {rndstr,hash256,getPwdFromFileOrConsole,genNewAcc,pause,mrgobj}
