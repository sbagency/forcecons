# fexamples
Simple consensus examples

## fn-example1

### single node
```bash
node fexamples/fn-example1.js --key keys/k0.json --host 127.0.0.1 --port 10000 --http_host 127.0.0.1 --http_port 8000 --bootnodes  bootnodes.json --pwd keys/pwd
```
[debug_view_0](http://localhost:8000)


### node foreman
```bash
npm install -g foreman
```

### 3 nodes
```bash
nf -j fexamples/Procfile-example1 start
```
[debug_view_0](http://localhost:8000)
[debug_view_1](http://localhost:8001)
[debug_view_2](http://localhost:8002)

### 7 nodes
```bash
nf -j fexamples/Procfile-example1-7 start
```
[debug_view_0](http://localhost:8000)
[debug_view_1](http://localhost:8001)
[debug_view_2](http://localhost:8002)
[debug_view_3](http://localhost:8003)
[debug_view_4](http://localhost:8004)
[debug_view_5](http://localhost:8005)
