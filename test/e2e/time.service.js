// @ts-check
'use strict';

const ORION = require('../../');

module.exports.listen = function listen(callback) {
  const SVC = new ORION.Service('time');
  
  SVC.handle('get', (req, reply) => {
    reply(new ORION.Response(new Date()));
  });

  SVC.handle('shouldTimeout', (req, reply) => {

  });

  SVC.handle('shouldNotTimeout', (req, reply) => {
    setTimeout(() => {
      reply(new ORION.Response(null));
    }, 201);
  });

  SVC.listen(() => callback(SVC));
}

module.exports.close = function close(svc) {
  svc.close();
}


