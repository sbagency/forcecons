/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import level from 'level'

function ldb(opt){

opt.dir =   opt.dir || 'db'
opt.opts = opt.opts || {}  // { keyEncoding: 'hex', valueEncoding: 'binary' }
const db = level(opt.dir,opt.opts);

this.put=async (k,v)=>{
  return db.put(k,v)
}
this.get=async (k)=>{
  return db.get(k)
}

this.delete=async (k)=>{
  delete db.delete(k)
}

}


export { ldb as ForceLevelDB}
