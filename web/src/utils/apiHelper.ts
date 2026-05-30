import { type } from "arktype";

export function validateResponse<T>(
  schema: (data: unknown) => T | type.errors,
  data: unknown,
  endpointName: string
): T {
  const parsed = schema(data);
  if (parsed instanceof type.errors) {
    throw new Error(`Invalid ${endpointName} response: ${parsed.summary}`);
  }
  return parsed;
}
