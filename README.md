[![NPM version][npm-image]][npm-url] 
[![Build Status][travis-image]][travis-url] 
[![Test coverage][coveralls-image]][coveralls-url]
[![Greenkeeper badge](https://badges.greenkeeper.io/betit/orion-node-sdk.svg)](https://greenkeeper.io/)

## Installation


```sh
$ npm install @betit/orion-node-sdk
```

## Basic example

### Note - You will need to have running all of the orion [dependencies](https://github.com/betit/orion/tree/dev#development)

Add the following into `foo.js` and then run `node foo.js --verbose`

```js
const ORION = require('@betit/orion-node-sdk');
const FOO = new ORION.Service('foo');

FOO.handle('get', (req, reply) => {
  reply(new ORION.Response('foo'));
});

FOO.listen(() => FOO.logger.createMessage('ready').send());
```

Then add the following into `bar.js` and then run `node bar.js`

```js
const ORION = require('@betit/orion-node-sdk');
const BAR = new ORION.Service('bar');

const REQ = new ORION.Request('/foo/get');
BAR.call(REQ, res => {
  // do stuff
});
```

You can find more detailed examples in the `examples` folder.

# Documentation

Auto-generated documentation is located [here](https://betit.github.io/orion-node-sdk/).

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

[MIT](https://github.com/betit/orion-node-sdk/blob/master/LICENSE)

[npm-image]: https://badge.fury.io/js/%40betit%2Forion-node-sdk.svg
[npm-url]: https://www.npmjs.com/package/@betit/orion-node-sdk
[travis-image]: https://travis-ci.org/betit/orion-node-sdk.svg?branch=master
[travis-url]: https://travis-ci.org/betit/orion-node-sdk/
[coveralls-image]: https://coveralls.io/repos/betit/orion-node-sdk/badge.svg
[coveralls-url]: https://coveralls.io/r/betit/orion-node-sdk
