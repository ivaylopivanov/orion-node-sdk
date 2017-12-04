import { Request } from '../request/request';

// codec

export interface Codec {
  encoding?: string;
  contentType?: string;
  encode(data: any);
  decode(data: any);
}

// transport

export interface Transport {
  listen(callback: Function);
  publish(topic: string, message: any);
  subscribe(topic: string, group: string, callback: Function);
  handle(route: string, group: string, callback: Function);
  request(route: string, payload: any, callback: Function, timeout: number);
  close();
  onClose(callback: (...args: any[]) => void);
}

// client

export interface Client {
  emit(topic: string, message: any);
  call(request: Request, callback: Function);
}

// service

export interface Service {
  emit(topic: string, message: any);
  on(topic: string, callback: Function);
  handle(method: string, callback: Function);
}

// Tracer
export interface Tracer {
  trace(req: Request): Function;
}

// Logger
export interface Logger {
  createMessage(message: string): Message;
  send(m: RawMessage);
}

export interface Message {
  setId(id: string): Message;
  setParams(params: any): Message;
  setLevel(level: number): Message;
  send();
}

export interface RawMessage {
  level: number;
  timestamp: number;
  params: any;
  message: string;
  host: string;
  'x-trace-id': string;
}

// client-service

export interface Options {
  codec?: Codec;
  tracer?: Tracer;
  transport?: Transport;
  logger?: Logger;
  timeout?: number;
  timeouts?: {};
  service?: string;
}
