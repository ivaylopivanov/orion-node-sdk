// @ts-check
'use strict';

const ORION = require('../../');


module.exports.listen = function listen(callback) {
  const SVC = new ORION.Service('calc');

  SVC.handle('sum', (req, reply) => {
    reply(new ORION.Response(req.params.a + req.params.b));
  });

  SVC.listen(() => callback(SVC));
}

module.exports.close = function close(svc) {
  svc.close();
}


