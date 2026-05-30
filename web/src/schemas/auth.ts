import { type } from "arktype";

export const RegisterRequestSchema = type({
  username: "string",
  password: "string",
});
export type RegisterRequest = typeof RegisterRequestSchema.infer;

export const LoginRequestSchema = type({
  username: "string",
  password: "string",
});
export type LoginRequest = typeof LoginRequestSchema.infer;

export const AuthResponseSchema = type({
  token: "string",
  username: "string",
  role: "string",
});
export type AuthResponse = typeof AuthResponseSchema.infer;

export const ChangePasswordRequestSchema = type({
  currentPassword: "string",
  newPassword: "string",
});
export type ChangePasswordRequest = typeof ChangePasswordRequestSchema.infer;
