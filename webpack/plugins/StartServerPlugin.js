const cp = require('child_process');
const path = require('path');
const watch = require('node-watch');

let server;
let started;
let serverReload;
const KOA_PATH = path.join(__dirname, '../../server/index');

const startServer = () => {

    // Define `restartServer`
    const restartServer = () => {
        console.log('restarting koa application');
        serverReload = true;
        server.kill('SIGTERM');
        return startServer();
    };

    // merge env for the new process
    const env = {...process.env, NODE_ENV: 'development', BABEL_ENV: 'server'};
    // start the server procress
    server = cp.fork('./node_modules/@babel/node/bin/babel-node', [KOA_PATH], {env})
    // when server is `online`
    server.once('message', (message) => {
        if (message.match(/^online$/)) {
            if (serverReload) {
                serverReload = false;
                //browserSync.reload();
            }
            if (!started) {
                started = true;

                // Listen for `rs` in stdin to restart server
                console.log('type `rs` in console for restarting koa application');
                process.stdin.setEncoding('utf8');
                process.stdin.on('data', (data) => {
                    const parsedData = (data + '').trim().toLowerCase();
                    if (parsedData === 'rs') return restartServer();
                });

                // Start watcher on server files and restart server on change
                const server_path = path.join(__dirname, '../../server');
                // const app_path = path.join(__dirname, '../../app');
                watch([server_path], { recursive: true }, () => restartServer());
            }
        }
    });
};

// kill server on exit
process.on('exit', () => server.kill('SIGTERM'));

module.exports = class StartServerPlugin {
    apply(compiler) {
        console.log("Please wait for app server startup (~60s)" +
            " after webpack server startup...")
        compiler.hooks.done.tap('StartServerPlugin', () => !server ? startServer() : () => ({}))
    }
}
