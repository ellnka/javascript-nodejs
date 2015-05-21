var co = require('co');
var readHostFromSSHConfig = require('../lib/readHostFromSSHConfig');
var sshConnect = require('../lib/sshConnect');
var sshExec = require('../lib/sshExec');
var config = require('config');
var gutil = require('gulp-util');

module.exports = function() {

  var args = require('yargs')
    .example('gulp deploy:update --host nightly')
    .demand(['host'])
    .argv;

  return function() {

    return co(function*() {

      var client = yield* sshConnect(args.host);

      yield* client.runInTarget(`git reset --hard`);
      yield* client.runInTarget(`git fetch origin production`);
      yield* client.runInTarget(`git merge origin/production --no-edit`);

      yield* client.runInTarget(`/usr/local/bin/pm2 startOrGracefulReload ecosystem.json --env production`);
      yield* client.runInTarget(`gulp cache:clean`);
      yield* client.runInTarget(`gulp cloudflare:clean | bunyan`);
      yield* client.runInTarget(`gulp config:nginx --prefix /etc/nginx --env production --root /js/javascript-nodejs --sslEnabled`);
      yield* client.runInTarget(`/etc/init.d/nginx reload`);

      client.end();

    });

  };
};
