import { type } from "arktype";

export const UserRoleSchema = type("'ADMIN' | 'PLAYER'");
export type UserRole = typeof UserRoleSchema.infer;

export const UserResponseSchema = type({
  id: "number",
  username: "string",
  role: UserRoleSchema,
});
export type UserResponse = typeof UserResponseSchema.infer;
