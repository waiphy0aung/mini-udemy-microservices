import ApiError from '../../utils/ApiError';

describe('ApiError', () => {
  it('constructors set status codes', () => {
    expect(ApiError.badRequest().statusCode).toBe(400);
    expect(ApiError.unauthorized().statusCode).toBe(401);
    expect(ApiError.forbidden().statusCode).toBe(403);
    expect(ApiError.notFound().statusCode).toBe(404);
  });
});

