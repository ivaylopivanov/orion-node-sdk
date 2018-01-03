// @ts-check
'use strict';

const ORION = require('../../');


module.exports.listen = function listen(callback) {
  const SVC = new ORION.Service('calc');

  SVC.handle('sum', (req, reply) => {
    reply(new ORION.Response(req.params.a + req.params.b));
  });

  if (callback) {
    SVC.listen(() => callback(SVC));
  } else {
    return SVC.listen().then(() => SVC);
  }
}

module.exports.close = function close(svc) {
  svc.close();
}


