// @ts-check
'use strict';

const ORION = require('../../');
const CALC_SERVICE = require('./calc.service');
const TIME_SERVICE = require('./time.service');
const EXPECT = require('chai').expect;

const SERVICE_NAME = 'e2e';
const SVC = new ORION.Service(SERVICE_NAME);

SVC.listen(() => {});

describe(SERVICE_NAME, () => {

  after(() => SVC.close());

  it('Should sum two numbers', next => {
    CALC_SERVICE.listen(instance => {

      const REQ = new ORION.Request('/calc/sum', {a: 1, b: 2});
      
      SVC.call(REQ, res => {
        EXPECT(res.payload).equal(3);
        CALC_SERVICE.close(instance);
        next();
      });
      
    });
  });
  
  it('Should get the time', next => {
    TIME_SERVICE.listen(instance => {
      
      const REQ = new ORION.Request('/time/get');
      
      SVC.call(REQ, res => {
        EXPECT(res.payload).instanceOf(Date);
        TIME_SERVICE.close(instance);
        next();
      });

    });
  });

  it('Should timeout', next => {
    TIME_SERVICE.listen(instance => {
      
      const REQ = new ORION.Request('/time/shouldTimeout');
      
      SVC.call(REQ, res => {
        EXPECT(res.error.code).equal('ORION_TRANSPORT');
        TIME_SERVICE.close(instance);
        next();
      });

    });
  });

  it('Should not timeout', next => {
    TIME_SERVICE.listen(instance => {
      
      let req = new ORION.Request('/time/shouldNotTimeout');
      req.timeout = 300;

      SVC.call(req, res => {
        EXPECT(res.error).equal(null);
        TIME_SERVICE.close(instance);
        next();
      });

    });
  });

  it('Should pubsub and get event', next => {
    const PAYLOAD = 'payload';
    const TOPIC = 'topic';

    SVC.on(TOPIC, data => {
      EXPECT(data).equal(PAYLOAD);
      next();
    });
  
    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD);
  });

});
