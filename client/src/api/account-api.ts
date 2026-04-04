import type {
  AccountOrdersResponse,
  AccountProfileResponse,
  ChangeAccountPasswordRequest,
  UpdateAccountProfileRequest,
  UploadAccountPhotoRequest,
  UploadAccountPhotoResponse,
} from "@shared/types";
import { httpClient } from "./http-client";

export function getAccountProfile() {
  return httpClient<AccountProfileResponse>("/api/account");
}

export function getAccountOrders() {
  return httpClient<AccountOrdersResponse>("/api/account/orders");
}

export function updateAccountProfile(payload: UpdateAccountProfileRequest) {
  return httpClient<AccountProfileResponse>("/api/account/profile", {
    method: "PUT",
    body: payload,
  });
}

export function changeAccountPassword(payload: ChangeAccountPasswordRequest) {
  return httpClient<{ data: { ok: true } }>("/api/account/password", {
    method: "PUT",
    body: payload,
  });
}

export function uploadAccountPhoto(payload: UploadAccountPhotoRequest) {
  return httpClient<UploadAccountPhotoResponse>("/api/account/photo", {
    method: "POST",
    body: payload,
  });
}
