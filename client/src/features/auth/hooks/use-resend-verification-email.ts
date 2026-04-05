import { useMutation } from "@tanstack/react-query";
import { resendVerificationEmail } from "@/api/auth-api";

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: resendVerificationEmail,
  });
}
