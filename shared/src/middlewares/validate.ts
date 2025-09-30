import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";
import ApiError from "../utils/ApiError";

// returns a new object containing only the listed keys from obj
// Example
// pick({ a:1, b:2, c:3 }, ['a','c'])
// => { a:1, c:3 }
const pickFields = (obj: any, keys: readonly string[]) =>
  keys.reduce((acc: Record<string, any>, key: string) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key))
      acc[key] = obj[key];
    return acc;
  }, {});

type SchemaShape = {
  params?: ObjectSchema;
  query?: ObjectSchema;
  body?: ObjectSchema;
  headers?: ObjectSchema;
}

const validate = (schema: SchemaShape) => (req: Request, _res: Response, next: NextFunction) => {
  const validSchema = pickFields(schema, [
    "params",
    "query",
    "body",
    "headers"
  ]) as SchemaShape;

  const keys = Object.keys(validSchema) as (keyof SchemaShape)[];
  if (!keys.length) return next();

  const errors: string[] = [];

  for (const key of keys) {
    const rule = validSchema[key];
    if (!rule) continue;

    const target = (req as any)[key];
    const { value, error } = rule.validate(target, {
      abortEarly: false,
      stripUnknown: true,
      // allow unknown keys for headers/query by default, but still strip unknown from body
    });

    if (error) {
      errors.push(
        error.details
          .map((d) => d.message.replace(/\"/g, ""))
          .join(", ")
      );
      continue;
    }

    // assign the sanitized value back to the request
    (req as any)[key] = value;
  }

  if (errors.length) return next(ApiError.badRequest(errors.join(", ")));
  return next();
}

export default validate;
