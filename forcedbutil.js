/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'

const lastBoKey = 'last_bo_key-7332-9098-42ff-ab56'

const fdb_put=async (bo,h)=>{
  fdb.put(h,JSON.stringify(bo))
  fdb.put(lastBoKey,h)
}

const fdb_get_last=async (prefix)=>{ // bk,tx,..
  const h = await fdb.get(prefix + lastBoKey)
  if(!h) return null;
  const bin = await fdb.get(h)
  if(!bin) return null;
  let bo;try{ bo=JSON.parse(bin); }catch(e){console.log(e); return null;}
  return bo;
}

const fdb_get=async (h)=>{
  const bin = await fdb.get(h);
  if(!bin) return null;
  let bo;try{ bo=JSON.parse(bin); }catch(e){console.log(e); return null;}
  return bo;
}


export { mdb as ForceMemDB, appdb as ForceAppendDB }
