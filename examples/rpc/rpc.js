// @ts-check
'use strict';

const ORION = require('../../');
const LOGGER_LEVELS = require('../../lib/logger/levels')

const SERVICE = new ORION.Service('examples-node');

SERVICE.handle('delay', (req, reply) => {
  const RESULT = {
    timeOfRequest: req.meta.time,
    passedDate: req.params,
  };
  setTimeout(() => {
    reply(new ORION.Response(RESULT, new ORION.Error("404", "Not Found")));
  }, 1000);
  SERVICE.logger.createMessage('delay').setLevel(LOGGER_LEVELS.INFO).setParams(RESULT).send();
});

SERVICE.handle('dummy', (req, reply) => {
  console.log('dummy handle', req)
  req.path = '/examples-go/dummy';
  req.params = {
    bar: {
      foo: "baz",
      n: 2,
      now: new Date().toString(),
    }
  };
  SERVICE.call(req, (res) => {
    reply(new ORION.Response(req.params));
  });
});

SERVICE.handle('primitive', (req, reply) => {
  setTimeout(() => {
    reply(new ORION.Response('some string'));
  }, 1000);
});

SERVICE.listen(makeRequests);

function makeRequests() {
  example1();
  example2();
  example3();
}

function example1() {
  const NOW = new Date();
  const PARAMS = new Date(NOW.setDate(NOW.getDate() + 1)).toString();
  const PATH = '/examples-node/delay';
  const REQ = new ORION.Request(PATH, PARAMS);
  REQ.meta.time = new Date().toString();
  REQ.callTimeout = 1100;
  SERVICE.call(REQ, (res) => {
    console.log('/examples-node/delay request id', REQ.getId());
    console.log('/examples-node/delay response', res.payload);
    console.log('/examples-node/delay error', res.error.message);
  });
}

function example2() {
  const PARAMS = {
    bar: {
      foo: "baz",
      n: 2,
      now: new Date().toString(),
    }
  };
  const PATH = '/examples-go/dummy';
  const REQ = new ORION.Request(PATH, PARAMS);
  REQ.meta.time = new Date().toString();
  SERVICE.call(REQ, (res) => {
    console.log('/examples-go/dummy request id', REQ.getId());
    console.log('/examples-go/dummy response', res.payload);
  });
}

function example3() {
  const PARAMS = {
    bar: {
      foo: "baz",
      n: 2,
      now: new Date().toString(),
    }
  };
  const PATH = '/examples-node/dummy';
  const REQ = new ORION.Request(PATH, PARAMS);
  REQ.meta.time = new Date().toString();
  SERVICE.call(REQ, (res) => {
    console.log('/examples-node/dummy request id', REQ.getId());
    console.log('/examples-node/dummy response', res.payload);
  });
}

function example4() {
  const PATH = '/examples-node/primitive';
  const REQ = new ORION.Request(PATH);
  REQ.meta.time = new Date().toString();
  SERVICE.call(REQ, (res) => {
    console.log('/examples-node/primitive request id', REQ.getId());
    console.log('/examples-node/primitive response', res.payload);
  });
}
