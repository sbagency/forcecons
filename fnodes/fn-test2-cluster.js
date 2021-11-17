import {ForceNode} from '../forcenodesimpl.js'
import {pause} from '../forceutil.js'


(async ()=>{
  
const name = process.argv[1].split('/')

console.log(name[name.length-1].split('.')[0])

let N = 3; if(process.argv.length>=3) N = parseInt(process.argv[2])

const fns = []; for(let i=0;i<N;i++){ fns.push( await ForceNode({port:(10000+i),http_port:(8000+i)}) ) }

const accs = []; fns.forEach(fn=>{accs.push(fn.acc)})

await pause(1000);

for(let i=0;i<fns.length-1;i++){   fns[i].fnet.connect(accs.slice(i+1)) }

await pause(2000);

fns.forEach(fn=>fn.run())


})()
