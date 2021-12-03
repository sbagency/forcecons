import util from 'util'
import {rndstr,hash256} from '../forceutil.js'
import crypto from 'crypto'

import {ForceAppendDB} from '../forcedb.js'

(async ()=>{
console.log('forcedb tests...')

const db = new ForceAppendDB({file:'tmp/db1'});

const no=724;
const addr=rndstr(32);

const bk={data:{no:42,ph:null,timestamp:Date.now()}}

const txa=[]
for(let i=0;i<128;i++){
  const k=rndstr(16),v=Math.random();
  const sender=rndstr(32)
  const tx={data:{func:'set',args:[k,v],sender,nonce:0,timestamp:Date.now()}}
  tx.h=await hash256(JSON.stringify(tx.data))
  txa.push(tx)
}

bk.data.txq=txa;
bk.h=await hash256(JSON.stringify(bk.data))
bk.sender={no:no,addr:addr}
bk.proof={nonce:rndstr(8)}
  

await db.put(bk.h, JSON.stringify(bk))

const bk2 = JSON.parse( await db.get(bk.h) )

console.log('bk',bk)
console.log('bk2',bk2)
console.log(bk.h == await hash256(JSON.stringify(bk2.data)) )
})()