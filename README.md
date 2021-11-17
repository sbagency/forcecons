# forcecons
distributed protocols r&amp;d framework

### get started
```js
import {ForceNode} from 'forcenodesimpl.js'

(async ()=>{

const fn = await ForceNode()

fn.run()

})()

```
[debug_view](http://localhost:8000)


### local cluster
```js
import {ForceNode} from '../forcenodesimpl.js'
import {pause} from '../forceutil.js'


(async ()=>{
  
let N = 3; if(process.argv.length>=3) N = parseInt(process.argv[2])

const fns = []; for(let i=0;i<N;i++){ fns.push( await ForceNode({port:(10000+i),http_port:(8000+i)}) ) }

const accs = []; fns.forEach(fn=>{accs.push(fn.acc)})

await pause(1000);

for(let i=0;i<fns.length-1;i++){   fns[i].fnet.connect(accs.slice(i+1)) }

await pause(2000);

fns.forEach(fn=>fn.run())

})()

```
[debug_view_0](http://localhost:8000)
[debug_view_1](http://localhost:8001)
[debug_view_2](http://localhost:8002)

### custom tx
```js
import {ForceNode} from '../forcenodesimpl.js'
import {rndstr,hash256,pause} from '../forceutil.js'


(async ()=>{
  

let P = 10000; if(process.argv.length>=3) P = parseInt(process.argv[2])

// node

const fn = await ForceNode({
  ontx: async (tx,st)=>{
  console.log('ontx:',tx,st)
  switch(tx.data.func){
    case 'set':{
      const args=tx.data.args;
      const k=args[0],v=args[1];
      st[k]=v;
      return true;
    }
  }
  return false;
  }})

console.log(fn.acc)

await pause(1000);

fn.run()

// txs

const addrs=[];for(let i=0;i<16;i++)addrs.push(rndstr(32));
const kvs={}


var txcnt=0;
const txsender=async ()=>{
  const k=rndstr(16),v=Math.random();
  kvs[k]=v;
  const sender=addrs[Math.floor(Math.random() * addrs.length)]
  const tx={data:{func:'set',args:[k,v],sender,nonce:0,timestamp:Date.now()}}
  tx.h=await hash256(JSON.stringify(tx.data))
  fn.ftxmgr.push(tx)
  txcnt++
  setTimeout(txsender,Math.floor(Math.random() * 200))
}
setTimeout(txsender,500);


})()

```
[debug_view](http://localhost:8000)


### keys generation
```bash
#generate new keys
node utils/genkeyaddr.js --key keys/k0.json --port 10000 --bootnodes bootnodes.json --pwd keys/pwd

#test keys
node utils/testkeyaddr.js --key keys/k0.json --pwd keys/pwd

# generate 16 keys
./gen16_json.sh

# test 16 keys
./test16_json.sh
```


