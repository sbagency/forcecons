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
(debug_view)[http://localhost:8000]


### get started
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
(debug_view_0)[http://localhost:8000]
(debug_view_1)[http://localhost:8001]
(debug_view_2)[http://localhost:8002]


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


