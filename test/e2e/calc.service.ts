import * as ORION from '../../src/orion';

export function listen(callback) {
  const SVC = new ORION.Service('calc');

  SVC.handle('sum', (req, reply) => {
    reply(new ORION.Response(req.params.a + req.params.b));
  });

  SVC.listen(() => callback(SVC));
}

export function close(svc) {
  svc.close();
}


