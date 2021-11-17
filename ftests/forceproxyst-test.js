import util from 'util'
import {rndstr,hash256,mrgobj} from '../forceutil.js'
import {pxSt,mrgSt} from '../forceproxyst.js'

(async ()=>{
console.log('forcetxmgr tests...')

const bks={}

const kvs={}

const bk0={data:{no:0,ph:null,timestamp:Date.now(),nonce:rndstr(16)}}
bk0.h=await hash256(JSON.stringify(bk0.data))
bks[bk0.h]=bk0;

const newbk=async (pbk)=>{
  const bk={data:{no:pbk.data.no+1,ph:pbk.h,timestamp:Date.now(),nonce:rndstr(16)}}
  bk.h=await hash256(JSON.stringify(bk.data))
  bks[bk.h]=bk;
  return bk;
}

let pbk=bk0;

const ki={}

let bk;
let lbk;

for(let i=0;i<50;i++){
  
 bk=await newbk(pbk);
 
 const flag=Math.random()>0.5;
 
 if(flag){pbk=bk;lbk=bk;}
 
 bk.st={}

 for(let j=0;j<10;j++){
   const st={}
   const stctrl = new pxSt(bks,bk,st)
   const pst=stctrl.pst
   const k='k.'+Math.floor(Math.random() * 15)
   const v=pst[k]
   
   if(flag){
   if(kvs[k]==undefined)kvs[k]=0;else kvs[k]++;
   ki[k]=bk.data.no;
   }
   
   //console.log(k,v)
   if(v==undefined)pst[k]=0;
   else pst[k]++
   //console.log('tx.st',st)
   mrgobj(st,bk.st)
 }
 
 
 console.log(flag,i,bk.data.no,'bk.st',bk.st)
 
}

console.log(bk.data.no,lbk.data.no)

const stctrl = new pxSt(bks,lbk,{})
const pst=stctrl.pst
const bst=mrgSt(bks,lbk)


for(let k of Object.keys(kvs)){
  if(kvs[k]!=pst[k]){console.log('error: kvs[k]!=pst[k]',k,kvs[k],pst[k]);}
}

console.log('bst',bst)

for(let k of Object.keys(bst)){
  if(kvs[k]!=bst[k]){console.log('error: kvs[k]!=bst[k]',k,kvs[k],bst[k]);}
}

//console.log('kvs',kvs)
for(let k of Object.keys(kvs)){
  console.log(k,kvs[k],ki[k])
}
console.log('bks',Object.keys(bks).length)

})()
