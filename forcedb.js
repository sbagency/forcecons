/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'

function mdb(opt){
  
const db={}

this.put=async (k,v)=>{
  return db[k]=v
}

this.get=async (k)=>{
  return db[k]
}

this.delete=async (k)=>{
  delete db[k]
}
  
}


function appdb(opt){

opt.file =   opt.file || 'db'
opt.dbopts = opt.dbopts || {}
opt.appendInteval = opt.appendInteval || 3000;
opt.appendOver = opt.appendOver || 16;
let db = {}

this.put=async (k,v)=>{
  db[k]=v
}
this.get=async (k)=>{
  return db[k]
}

this.delete=async (k)=>{
  db[k]=null
}

setInterval(function(){
  if(Object.keys(db).length>opt.appendOver){
    fs.appendFile(db.file, JSON.stringify(db), 'utf8', (err)=> { if (err) throw err; });
    db={}
  }
},opt.appendInteval)

}



export { mdb as ForceMemDB, appdb as ForceAppendDB }
