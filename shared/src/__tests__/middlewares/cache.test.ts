jest.mock('../../utils/cache', () => {
  const actual = jest.requireActual('../../utils/cache');
  return {
    ...actual,
    getJSON: jest.fn(),
    setJSON: jest.fn(),
  };
});

import cache from '../../middlewares/cache';
import { getJSON, setJSON } from '../../utils/cache';

describe('cache middleware', () => {
  beforeEach(() => {
    (getJSON as jest.Mock).mockReset();
    (setJSON as jest.Mock).mockReset();
  });

  it('serves cached hit when present', async () => {
    (getJSON as jest.Mock).mockResolvedValue({ status: 'success', code: 200, message: 'OK', data: { cached: true } });

    const req: any = { method: 'GET', headers: {}, path: '/items', query: {} };
    const res: any = {
      statusCode: 0,
      payload: undefined as any,
      status(c: number) { this.statusCode = c; return this; },
      json(p: any) { this.payload = p; return this; }
    };
    const next = jest.fn();

    await cache() (req as any, res as any, next);
    expect(res.statusCode).toBe(200);
    expect(res.payload.data).toEqual({ cached: true });
    expect(getJSON).toHaveBeenCalled();
    expect(setJSON).not.toHaveBeenCalled();
  });

  it('computes key and caches on miss', async () => {
    (getJSON as jest.Mock).mockResolvedValue(null);
    (setJSON as jest.Mock).mockResolvedValue('OK');

    const req: any = { method: 'GET', headers: {}, path: '/items', query: { b: 2, a: 1 } };
    const res: any = {
      statusCode: 0,
      payload: undefined as any,
      status(c: number) { this.statusCode = c; return this; },
      json(p: any) { this.payload = p; return this; }
    };
    const next = jest.fn(async () => {
      // use res.success provided by cache on miss path
      (res as any).success({ fresh: true }, 'OK', 200);
    });

    await cache({ prefix: 't', ttl: 10 }) (req as any, res as any, next);
    expect(res.statusCode).toBe(200);
    expect(res.payload.data).toEqual({ fresh: true });
    expect(setJSON).toHaveBeenCalled();
    const [keyArg] = (setJSON as jest.Mock).mock.calls[0];
    expect((keyArg as string).startsWith('t:')).toBe(true);
  });
});
