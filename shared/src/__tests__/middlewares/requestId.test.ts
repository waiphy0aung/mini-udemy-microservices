import requestId from '../../middlewares/requestId';

describe('requestId middleware', () => {
  it('extracts id from x-request-id header', () => {
    const req: any = { headers: { 'x-request-id': 'abc-123' } };
    const res: any = {};
    const next = jest.fn();

    requestId(req as any, res as any, next);
    expect(req.id).toBe('abc-123');
    expect(next).toHaveBeenCalled();
  });
});
