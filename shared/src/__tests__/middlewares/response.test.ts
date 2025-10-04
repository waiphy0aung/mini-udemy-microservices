import responseEnvelope from '../../middlewares/response';

describe('responseEnvelope middleware', () => {
  it('adds res.success and returns enveloped response', () => {
    const req: any = {};
    const res: any = {
      statusCode: 0,
      body: undefined as any,
      status(code: number) { this.statusCode = code; return this; },
      json(payload: any) { this.body = payload; return this; }
    };
    const next = jest.fn();

    responseEnvelope(req as any, res as any, next);
    expect(typeof res.success).toBe('function');

    (res as any).success({ hello: 'world' }, 'All good', 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      status: 'success',
      code: 201,
      message: 'All good',
      data: { hello: 'world' }
    });
  });
});
