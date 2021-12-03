import {ForceNode} from '../forcenodesimpl.js'


(async ()=>{

console.log('fn-test1..')

const fn = await ForceNode()

console.log('fn:',fn)

fn.run()

  
})()
