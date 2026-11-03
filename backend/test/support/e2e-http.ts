/* eslint-disable @typescript-eslint/no-explicit-any */
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface CallOptions {
  token?: string;
  body?: object;
  query?: Record<string, string>;
  accept?: number | number[];
}

export interface RawResult {
  status: number;
  body: any;
}

// Thin supertest wrapper. Every request carries a distinct X-Forwarded-For address
// (the app is run with `trust proxy`), so the real rate limiter never throttles the
// test while it stays enabled and untouched.
export class ApiClient {
  private requestCount = 0;

  constructor(private readonly app: INestApplication) {}

  private nextClientIp(): string {
    this.requestCount += 1;
    const n = this.requestCount;
    return `10.${(n >> 16) & 255}.${(n >> 8) & 255}.${n & 255}`;
  }

  async raw(
    method: HttpMethod,
    path: string,
    options: CallOptions = {},
  ): Promise<RawResult> {
    const agent = request(this.app.getHttpServer());
    let req = agent[method](path).set('X-Forwarded-For', this.nextClientIp());
    if (options.token) {
      req = req.set('Authorization', `Bearer ${options.token}`);
    }
    if (options.query) {
      req = req.query(options.query);
    }
    if (options.body) {
      req = req.send(options.body);
    }
    const res = await req;
    return { status: res.status, body: res.body };
  }

  // Returns the unwrapped `data` of the { success, data } envelope and fails with the
  // full response body when the status is not accepted.
  async call<T = any>(
    method: HttpMethod,
    path: string,
    options: CallOptions = {},
  ): Promise<T> {
    const accepted =
      options.accept === undefined
        ? [200, 201]
        : Array.isArray(options.accept)
          ? options.accept
          : [options.accept];
    const res = await this.raw(method, path, options);
    if (!accepted.includes(res.status)) {
      throw new Error(
        `${method.toUpperCase()} ${path} returned ${res.status}\n${JSON.stringify(res.body, null, 2)}`,
      );
    }
    return res.body?.data as T;
  }
}