// @ts-check
'use strict';

const ORION = require('../../');

const SERVICE = new ORION.Service('examples');

SERVICE.on('node', (payload) => {
  console.log(payload);
  console.log(payload.nested.time);
});

SERVICE.emit('examples:node', {nested: {time: new Date().toString()}});
SERVICE.emit('examples:go', {nested: {time: new Date().toString()}});
