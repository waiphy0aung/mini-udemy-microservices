import { errorConverter, errorHandler } from '../../middlewares/error';
import ApiError from '../../utils/ApiError';

describe('error middlewares', () => {
  it('converts generic Error to ApiError and handles it', () => {
    const next = jest.fn();
    const err = new Error('Kaboom');
    const req: any = {};
    const res: any = {
      statusCode: 0,
      payload: undefined as any,
      status(c: number) { this.statusCode = c; return this; },
      json(p: any) { this.payload = p; return this; }
    };

    errorConverter(err, req, res, next);
    expect(next).toHaveBeenCalled();
    const apiError = (next as jest.Mock).mock.calls[0][0];
    expect(apiError).toBeInstanceOf(ApiError);

    errorHandler(apiError, req, res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.payload.status).toBe('error');
    expect(res.payload.code).toBe(500);
    expect(res.payload.message).toBe('Kaboom');
  });

  it('passes ApiError through with same status', () => {
    const req: any = {};
    const res: any = {
      statusCode: 0,
      payload: undefined as any,
      status(c: number) { this.statusCode = c; return this; },
      json(p: any) { this.payload = p; return this; }
    };
    const next = jest.fn();

    const err = ApiError.forbidden('Nope');
    errorConverter(err, req, res, next);
    const apiError = (next as jest.Mock).mock.calls[0][0];
    errorHandler(apiError, req, res, jest.fn());
    expect(res.statusCode).toBe(403);
    expect(res.payload.code).toBe(403);
    expect(res.payload.message).toBe('Nope');
  });
});
