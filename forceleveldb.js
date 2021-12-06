/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import level from 'level'

import {rndstr,pause} from './forceutil.js'


function ldb(opt){

opt.dir =   opt.dir || 'db'
opt.opts = opt.opts || {}  // { keyEncoding: 'hex', valueEncoding: 'binary' }
const db = level(opt.dir,opt.opts);

var lock = false;

this.put=async (k,v)=>{
  while(lock)await pause(10);
  return db.put(k,v)
}
this.get=async (k)=>{
  while(lock)await pause(10);
  return db.get(k)
}

this.batch=async (b)=>{
  while(lock)await pause(10);
  return db.batch(b)
}

this.delete=async (k)=>{
  while(lock)await pause(10);
  return db.delete(k)
}


this.close=()=>{
  return db.close()
}
this.open=()=>{
  return db.open()
}

this.flush=async ()=>{
  lock=true;
  await db.close();
  await db.open();
  lock=false;
}

}


export { ldb as ForceLevelDB}
