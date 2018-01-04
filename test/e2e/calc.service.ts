import * as ORION from '../../src/orion';

export function listen(callback) {
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

export function close(svc) {
  svc.close();
}


