# forcecons
distributed protocols r&amp;d framework

### components
```js
/*
forceutil - keys management, utilities
forceverifier - sign/verify messages
forcenet - networking (secure sessions, send/recieve messages)
forcenet-rpc - rpc functions
forceconssimpl - simple stateless consensus, longest chain rule, confirmations are next blocks, finality after n blocks
forcetxmgr - transaction manager (pool)
forcenodesimpl - (forcenet,forceconssimpl,forcetxmgr,...) composed together

./static - visualisation web app (websocket)
*/
```


visualisation for consensus protocols r&d
![forcecons blockchain graph](forcecons-blockchain-graph.png)

### keys generation
```bash
# generate new keys
node utils/genkeyaddr.js --key keys/k0.json --port 10000 --bootnodes bootnodes.json --pwd keys/pwd
# test keys
node utils/testkeyaddr.js --key keys/k0.json --pwd keys/pwd

# generate 16 keys
./gen16_json.sh
# test 16 keys
./test16_json.sh
```
