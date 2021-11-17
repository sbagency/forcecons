PORT=10000
for i in {0..15};
do
 let P=$PORT+$i
 node utils/genkeyaddr.js --key keys/k$i.json --port $P --bootnodes bootnodes.json --pwd keys/pwd
done
