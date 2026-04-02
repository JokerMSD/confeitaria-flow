import type { CreateUserInput, UpdateUserInput, UserItem } from "@shared/types";
import { httpClient } from "./http-client";

export function listUsers() {
  return httpClient<{ data: UserItem[] }>("/api/users");
}

export function getUser(id: string) {
  return httpClient<{ data: UserItem }>(`/api/users/${id}`);
}

export function createUser(data: CreateUserInput) {
  return httpClient<{ data: UserItem }>("/api/users", {
    method: "POST",
    body: { data },
  });
}

export function updateUser(id: string, data: UpdateUserInput) {
  return httpClient<{ data: UserItem }>(`/api/users/${id}`, {
    method: "PUT",
    body: { data },
  });
}

export function activateUser(id: string) {
  return httpClient<{ data: UserItem }>(`/api/users/${id}/activate`, {
    method: "POST",
    body: { data: { isActive: true } },
  });
}

export function deactivateUser(id: string) {
  return httpClient<{ data: UserItem }>(`/api/users/${id}/deactivate`, {
    method: "POST",
    body: { data: { isActive: false } },
  });
}

export function deleteUser(id: string) {
  return httpClient<void>(`/api/users/${id}`, { method: "DELETE" });
}
