/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */


import fs from 'fs'
import crypto from 'crypto'

const encPk=(opt)=>{
return crypto.publicEncrypt(opt.pk, opt.data);
}

const decSk=(opt)=>{
return crypto.secretDecrypt(opt.sk, opt.data);
}

const encK=(opt)=>{
  
const iv = opt.iv || crypto.randomBytes(16);

opt.algo = opt.algo || 'aes-256-ctr';

const key = crypto.createHash('sha256').update(opt.key).digest()
  
const cipher = crypto.createCipheriv(opt.algo, key, iv);

const data = Buffer.concat([cipher.update(opt.data), cipher.final()]);

return {data, iv}
  
}

const decK=(opt)=>{

opt.algo = opt.algo || 'aes-256-ctr';

const key = crypto.createHash('sha256').update(opt.key).digest()
  
const decipher = crypto.createDecipheriv(opt.algo, key, opt.iv);

const decrpyted = Buffer.concat([decipher.update(opt.data), decipher.final()]);

return decrpyted;
}


export {encPk,decSk,encK,decK}
