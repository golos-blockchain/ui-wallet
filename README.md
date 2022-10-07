# Wallet UI

React.js web interface to the blockchain-based wallet service. It uses [Golos blockchain](https://github.com/golos-blockchain/chain-node), a fork of Steem blockchain powered by Graphene 2.0 technology to store JSON-based content for a plethora of web applications. 

## Installation

We recommend using docker to run in production. This is how we run the live site and it is the most supported method of both building and running application. We will always have the latest version available on [Docker Hub](https://hub.docker.com/r/golosblockchain/wallet-ui/tags).

#### Clone the repository
```bash
git clone https://github.com/golos-blockchain/ui-wallet &&
cd ui-wallet
```

Run all services (production mode):
```
sudo docker-compose up
```

#### Install for Development mode

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -

sudo apt-get install -y nodejs

npm install -g yarn

yarn install

yarn dev
```

You now have your development front end running at localhost:8080, connected to the public GOLOS blockchain.

### Production
Generate a new crypto_key and save under server_session_secret in /config/default.json.

```bash
node
> crypto.randomBytes(32).toString('base64')
```
