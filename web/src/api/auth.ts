import client from "./client";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthResponseSchema,
  ChangePasswordRequest,
} from "../schemas/auth";
import { validateResponse } from "../utils/apiHelper";

export async function register(data: RegisterRequest): Promise<void> {
  await client.post("/auth/register", data);
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await client.post("/auth/login", data);
  return validateResponse(AuthResponseSchema, res.data, "login");
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await client.patch("/users/me/password", data);
}
