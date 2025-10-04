import Joi from 'joi';
import validate from '../../middlewares/validate';
import ApiError from '../../utils/ApiError';

describe('validate middleware', () => {
  const schema = {
    body: Joi.object({
      name: Joi.string().min(2).required(),
      age: Joi.number().integer().min(0).required()
    })
  };

  it('passes with valid payload and strips unknown keys', async () => {
    const req: any = { body: { name: 'Alice', age: 20, extra: 'ignore' } };
    const res: any = {};
    const next = jest.fn();

    validate(schema)(req as any, res as any, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ name: 'Alice', age: 20 });
  });

  it('fails with bad payload and aggregates messages', async () => {
    const req: any = { body: { name: 'A' } };
    const res: any = {};
    const next = jest.fn();

    validate(schema)(req as any, res as any, next);
    expect(next).toHaveBeenCalled();
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
  });
});
