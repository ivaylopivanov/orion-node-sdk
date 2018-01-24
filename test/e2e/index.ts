import * as ORION from '../../src/orion';
import * as CALC_SERVICE from './calc.service';
import * as TIME_SERVICE from './time.service';
import * as chai from 'chai';

const EXPECT = chai.expect;

const SERVICE_NAME = 'e2e';
const SVC = new ORION.Service(SERVICE_NAME);

async function sleep(ms) {
  return new Promise((res, rej) => {
      setTimeout(res, ms);
  });
}

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

  it('Should work for asynchronous calls', async () => {
    const instance = await CALC_SERVICE.listen();
    const a = ~~(Math.random() * 65535);
    const b = ~~(Math.random() * 65535);
    const REQ = new ORION.Request('/calc/sum', {a, b});

    const res = await SVC.call(REQ);
    EXPECT(res.payload).equal(a + b);
    CALC_SERVICE.close(instance);
  });

  it('Should work for asynchronous events', async () => {
    const PAYLOAD = 'payload';
    const TOPIC = 'topic2';

    const producer = SVC.onAsync(TOPIC);

    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD + '1');
    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD + '2');
    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD + '3');
    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD + '4');
    SVC.emit(SERVICE_NAME + ':' + TOPIC, PAYLOAD + '5');

    // Wait some time ticks for events to come.
    const maximumWait = 200;
    let waited = 0;
    while (waited < maximumWait && producer.length < 5) {
      waited += 10;
      await sleep(10);
    }

    EXPECT(producer.length).to.be.eq(5);

    EXPECT(await producer.consume()).to.be.eq(PAYLOAD + '1');
    EXPECT(await producer.consume()).to.be.eq(PAYLOAD + '2');
    EXPECT(await producer.consume()).to.be.eq(PAYLOAD + '3');
    EXPECT(await producer.consume()).to.be.eq(PAYLOAD + '4');
    EXPECT(await producer.consume()).to.be.eq(PAYLOAD + '5');

    EXPECT(producer.length).to.be.eq(0);
  });
});