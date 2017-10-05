
let CLSContext = require('zipkin-context-cls');
let {
  BatchRecorder,
  Tracer: ZipkinTracer,
  TraceId,
  Request: ZipkinRequest,
  Annotation,
  HttpHeaders: Header,
  option
} = require('zipkin');
let { HttpLogger } = require('zipkin-transport-http');

import { Request } from '../request/request';

export class Tracer {

  private _ctxImpl = new CLSContext('zipkin');
  private _reporter: any;
  private _tracer: any;

  constructor(private _serviceName: string) {
    const ZIPKIN_HOST = this._getZipkinHost();
    this._reporter = new BatchRecorder({
      logger: new HttpLogger({
        endpoint: ZIPKIN_HOST
      })
    });
    this._tracer = new ZipkinTracer({
      ctxImpl: this._ctxImpl,
      recorder: this._reporter,
      traceId128Bit: true,
    });
  }

  public trace(req: Request): Function {
    let headers = this._getHeadersFromRequest(req);
    let lastId;
    let tracer = this._tracer;
    tracer.scoped(() => {
      if (headers[Header.TraceId]) {
        const SPAN_ID = headers[Header.SpanId];
        let parentSpanId = headers[Header.ParentSpanId];
        const TRACE_ID = headers[Header.TraceId];
        const SAMPLED = headers[Header.Sampled];
        tracer.setId(tracer.createRootId());
        const CURRENT = tracer.id;
        if (!parentSpanId) {
          parentSpanId = headers[Header.SpanId];
        }
        const ID = new TraceId({
          traceId: new option.Some(TRACE_ID),
          parentId: new option.Some(SPAN_ID),
          spanId: CURRENT.spanId,
          sampled: new option.Some(SAMPLED),
          flags: option.None
        });
        tracer.setId(ID);
      } else {
        tracer.setId(tracer.createRootId());
        const CURRENT = tracer.id;
        const FLAGS = new TraceId({
          traceId: new option.Some(CURRENT.traceId),
          parentId: option.None,
          spanId: CURRENT.spanId,
          sampled: CURRENT.sampled,
          flags: option.None
        });
        tracer.setId(FLAGS);
      }

      let data = {headers: {}};
      ZipkinRequest.addZipkinHeaders(data, tracer.id);
      tracer.recordServiceName(this._serviceName);
      tracer.recordRpc(req.path);
      lastId = tracer.id;

      req.meta['x-trace-id'] = data.headers[Header.TraceId];
      req.tracerData = this._getHeadersForRequest(data.headers);
    });

    return () => {
      tracer.setId(lastId);
      tracer.recordAnnotation(new Annotation.ServerSend());
    };
  }

  private _getHeadersFromRequest(req: Request): any {
    let headers = {};
    let data = req.tracerData;
    // TODO - simplify that mess
    // handle go
    if (data[Header.TraceId] && Array.isArray(data[Header.TraceId])) {
      headers[Header.TraceId] = data[Header.TraceId][0];
    }
    if (data[Header.SpanId] && Array.isArray(data[Header.SpanId])) {
      headers[Header.SpanId] = data[Header.SpanId][0];
    }
    if (data[Header.ParentSpanId] && Array.isArray(data[Header.ParentSpanId])) {
      headers[Header.ParentSpanId] = data[Header.ParentSpanId][0];
    }
    if (data[Header.Sampled] && Array.isArray(data[Header.Sampled])) {
      headers[Header.Sampled] = data[Header.Sampled][0];
    }

    // go specific
    if (data['X-B3-Traceid'] && Array.isArray(data['X-B3-Traceid'])) {
      headers[Header.TraceId] = data['X-B3-Traceid'][0];
    }
    if (data['X-B3-Spanid'] && Array.isArray(data['X-B3-Spanid'])) {
      headers[Header.SpanId] = data['X-B3-Spanid'][0];
    }
    if (data['X-B3-Parentspanid'] && Array.isArray(data['X-B3-Parentspanid'])) {
      headers[Header.ParentSpanId] = data['X-B3-Parentspanid'][0];
    }
    if (headers[Header.Sampled] === 'true') {
      headers[Header.Sampled] = '1';
    }
    return headers;
  }

  private _getHeadersForRequest(data: any): any {
    let headers = {};
    headers[Header.traceid] = [data[Header.TraceId]];
    headers[Header.spanid] = [data[Header.SpanId]];
    headers[Header.Sampled] = [data[Header.Sampled]];
    const PARENT_SPAIN_ID = data[Header.ParentSpanId];
    if (PARENT_SPAIN_ID !== undefined) {
      headers[Header.Parentspanid] = [PARENT_SPAIN_ID];
    }
    if (headers[Header.Sampled] === '1') {
      headers[Header.Sampled] = 'true';
    }
    return headers;
  }

  private _readHeader(headers, header): any {
    const val = headers[header];
    if (val != null) {
      return new option.Some(val);
    } else {
      return option.None;
    }
  }

  private _getZipkinHost(): string {
    const HOST = process.env.ORION_TRACER_ENDPOINT || 'http://localhost:9411';
    return HOST + '/api/v1/spans';
  }

}
