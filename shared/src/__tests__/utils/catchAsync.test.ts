import catchAsync from '../../utils/catchAsync';

describe('utils/catchAsync', () => {
  it('forwards rejected promise to next(err)', async () => {
    const next = jest.fn();
    const req: any = {};
    const res: any = {};
    const handler = catchAsync(async () => {
      throw new Error('async boom');
    });
    await handler(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('async boom');
  });
});
