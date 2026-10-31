import type { Resolver, FieldErrors } from 'react-hook-form';
import type { z } from 'zod';

export function createZodResolver<T extends Record<string, any>>(
  schema: z.ZodType<T>
): Resolver<T> {
  return async (values) => {
    try {
      const result = await schema.safeParseAsync(values);

      if (result.success) {
        return {
          values: result.data,
          errors: {},
        };
      }

      const issues =
        result.error.issues ||
        (result.error as unknown as { errors?: typeof result.error.issues }).errors ||
        [];

      const errors: FieldErrors<T> = {};

      for (const issue of issues) {
        const key = (issue.path[0] as keyof T) || ('root' as keyof T);
        if (!errors[key]) {
          (errors as Record<string, unknown>)[key as string] = {
            type: issue.code || 'validate',
            message: issue.message,
          };
        }
      }

      return {
        values: {},
        errors,
      };
    } catch (err) {
      console.error('Validation resolver error:', err);
      return {
        values: {},
        errors: {
          root: {
            type: 'validate',
            message: err instanceof Error ? err.message : 'Помилка валідації',
          },
        } as unknown as FieldErrors<T>,
      };
    }
  };
}
