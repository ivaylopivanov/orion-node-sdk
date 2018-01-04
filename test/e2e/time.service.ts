import * as ORION from '../../src/orion';


export function listen(callback) {
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

export function close(svc) {
  svc.close();
}


