import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { register, login, changePassword } from "../api/auth";
import { RegisterRequest, LoginRequest, ChangePasswordRequest } from "../types";

// Single-purpose mutation: Register
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
  });
}

// Single-purpose mutation: Login (caches token & user info in useAuthStore)
export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.token, data.username, data.role, data.username);
    },
  });
}

// Admin login mutation
export function useAdminLogin() {
  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: LoginRequest) => {
      const data = await login({ username, password });
      useAuthStore.getState().setAuth(data.token, username, data.role, username);
      return data;
    },
  });
}

// Change Password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  });
}
