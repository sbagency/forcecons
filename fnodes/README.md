# fnodes
Simple consensus nodes tests

### fn-test1
```js
import {ForceNode} from 'forcenodesimpl.js'

(async ()=>{

const fn = await ForceNode()

fn.run()

})()

```
### run
```bash
node fnodes/fn-test1.js
```

[debug_view](http://localhost:8000)


### fn-test2-cluster.js
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
### run
```bash
node fnodes/fn-test2-cluster.js
```

[debug_view_0](http://localhost:8000)
[debug_view_1](http://localhost:8001)
[debug_view_2](http://localhost:8002)

### fn-test3-onfbk
```js

const st={}

const onfbk = async (fbk,no,addr)=>{
  console.log('onfbk',fbk)
  const txq=fbk.data.txq;
  for(let i in txq){
    const tx=txq[i]
    switch(tx.data.func){
      case 'set':{
        const args=tx.data.args;
        const k=args[0],v=args[1];
        st[k]=v;
      }
    }
    console.log(no,i,tx)
  }
  return true;
}


const fn = await ForceNode({onfbk})

console.log(fn.acc)

await pause(1000);

fn.run()

```
[debug_view](http://localhost:8000)

