/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'
import crypto from 'crypto'

import {ForceVerifier,ForceSigner} from '../forceverifier.js'
import {rndstr,hash256,getPwdFromFileOrConsole} from '../forceutil.js'

import commandLineArgs from 'command-line-args'
const opts = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'key', type: String, defaultValue: "keys/k0"},
  { name: 'algo', type: String, defaultValue: "ed25519"},
  { name: 'pwd', type: String},
] )

//console.log("options:",opts)

if("help" in opts || !opts.key){
  console.log("Usage: --key k0.json --algo ed25519 --pwd keys/pwd")
  process.exit(0)
}



(async () => {


const pwd=await getPwdFromFileOrConsole(opts.pwd)
const acc = JSON.parse(fs.readFileSync(opts.key))

const fsi=new ForceSigner({acc,pwd})

console.log({pk:fsi.getPublicKey().toString('base64'), addr:acc.addr})

const mo={data:{what:'test',nonce:rndstr(32)}}
fsi.sign(mo)

console.log(mo)

const keys={}
keys[acc.addr]=fsi.getPublicKey()

const fve=new ForceVerifier({keys})
if(fve.verify(mo))console.log({ok:1})
else console.log({err:'verify failed'})

})()