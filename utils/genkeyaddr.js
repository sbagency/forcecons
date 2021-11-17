/*
 * Copyright(c) 2021 <web3scout@gmail.com>
 */

import fs from 'fs'
import crypto from 'crypto'
import readline from 'readline'

import {rndstr,hash256,getPwdFromFileOrConsole,genNewAcc} from '../forceutil.js'


import commandLineArgs from 'command-line-args'
const opts = commandLineArgs([
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'key', type: String, defaultValue: "./keys/k0.json"},
  { name: 'algo', type: String, defaultValue: "ed25519"},
  { name: 'genopts', type: String},
  { name: 'scrypt', type: Boolean},
  { name: 'scryptopts', type: String},
  { name: 'pwd', type: String},
  { name: 'host', type: String, defaultValue: "127.0.0.1"},
  { name: 'port', type: Number, defaultValue: 10000},
  { name: 'bootnodes', type: String}
] )

console.log("options:",opts)

if("help" in opts || !opts.key){
  console.log("Usage: --key keys/k0.json --algo ed25519 --genopts '{}' --pwd keys/pwd")
  process.exit(0)
}

const timestamp = () => {return Date.now()}; // number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.


(async () => {

const pwd=await getPwdFromFileOrConsole(opts.pwd)
let genopts={};
if(opts.genopts)genopts=JSON.parse(opts.genopts)
console.log(genopts)
const algo=opts.algo || 'ed25519';
const genNewAccOpts = {pwd,algo,genopts}
if(opts.scrypt){
  genNewAccOpts.scrypt=true;
  if(opts.scryptopts){
    const scryptopts=JSON.parse(opts.scryptopts)
    if(Object.keys(scryptopts).length>0){
      console.log(scryptopts)
      genNewAccOpts.scryptopts=scryptopts;
    }
  }
}

const acc = genNewAcc(genNewAccOpts)
console.log(acc)

fs.writeFileSync(opts.key,JSON.stringify(acc));


if(opts.bootnodes){
 let bootnodes;try{bootnodes=JSON.parse(fs.readFileSync(opts.bootnodes))}catch(e){bootnodes=[]};
 let modified=0
 for(let i=0;i<bootnodes.length;i++){ // {addr:"RG7DKH1Wj3bhyP6JwuzRSmKMlwPLjuSmgtQGW3sEr/0=",host:"127.0.0.1",port:10000}
  const node =  bootnodes[i]
  if(node.host == opts.host && node.port == opts.port){
    bootnodes[i]={addr:acc.addr,host:opts.host,port:opts.port}
    modified=1
    break;
  }
 } // for
 if(modified==0){
   bootnodes.push({addr:acc.addr,host:opts.host,port:opts.port})
 }
 fs.writeFileSync(opts.bootnodes,JSON.stringify(bootnodes,null,' '));
} // opts.bootnodes

})()