import level from 'level'
import crypto from 'crypto'

import {rndstr,hash256} from '../forceutil.js'


import commandLineArgs from 'command-line-args'
const opts = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'db', type: String},
  { name: 'keys', type: Boolean},
  { name: 'values', type: Boolean},
  { name: 'limit', type: Number},
  { name: 'gt', type: String},
  { name: 'gte', type: String},
  { name: 'lt', type: String},
  { name: 'lte', type: String},
  { name: 'reverse', type: Boolean},
  { name: 'clear', type: Boolean},
  { name: 'write', type: Number},
  { name: 'write2', type: Number},
  { name: 'bk', type: Boolean},
] )

console.log("options:",opts)
//process.exit(0)


if("help" in opts || !opts.db){
  console.log("Usage: --db dbs/db0")
  process.exit(0)
}


const open=(dir,options)=>{ return new Promise((resolve) => {
    level(dir,options,(err, db)=>{ if (err){reject({err});return;} resolve({db})})
  } ) }


(async () => {




const db_opts = {}; //{ keyEncoding: 'hex', valueEncoding: 'binary' }

const {db,err} = await open(opts.db,db_opts);

if(err)throw err;

//console.log(db.status)
//console.log(db.supports)

const streamOpts = {}

streamOpts.keys=!!opts.keys;
streamOpts.values=!!opts.values;
if(opts.limit)streamOpts.limit=opts.limit;
if(opts.reverse)streamOpts.reverse=opts.reverse;
if(opts.gt)streamOpts.gt=opts.gt;
if(opts.gte)streamOpts.gte=opts.gte;
if(opts.lt)streamOpts.lt=opts.lt;
if(opts.lte)streamOpts.lte=opts.lte;

console.log('streamOpts',streamOpts)

if(opts.clear){
  await db.clear()
  process.exit(0)
}

if(opts.write>0){
  for(let i=0;i<opts.write;i++){
    await db.put(i+'___'+rndstr(8),i+'+++'+rndstr(8))
  }
  await db.close()
  process.exit(0)
}

if(opts.write2>0){
  for(let i=0;i<opts.write2;i++){
    const key = i+'___'+rndstr(8)
    const value = i+'+++'+rndstr(8)
    await db.batch([
      {type:'put',key,value},
      {type:'put',key:'last',value:key}
    ])
  }
  await db.close()
  process.exit(0)
}


for await (const [key, value] of db.iterator(streamOpts)) {
//const iter = db.iterator(streamOpts)
//while (1) {
//  const data = await iter.next()
//  if(!data) break;
//  //console.log(data)
//  //break;
//  let key,value;
//  if(data[0])key=data[0];
//  if(data[1])value=data[1];

  const args=[]
  if(key)args.push(key)
  if(!opts.bk && value)args.push(value)
  if(opts.bk && value){
    let bk;try{bk=JSON.parse(value)}catch(e){bk=null;}
    if(bk)args.push(bk.data.no)
  }
  console.log(...args)

}

//db.createReadStream(streamOpts)
//  .on('data', function (data) {
//    console.log(data)
//  })
await db.close()

})()