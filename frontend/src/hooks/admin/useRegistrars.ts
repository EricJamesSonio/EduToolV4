import { type UseMutationResult } from "@tanstack/react-query";
import { useAsyncMutation, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { registrarApi, type CreateRegistrarRequest } from "@/api/admin/registrar.api";
import type { Registrar } from "@/types/admin/registrar.types";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────
export const useCreateRegistrar = (): UseMutationResult<
  { id: string; username: string; fullName?: string; email: string; plainPassword: string },
  Error,
  CreateRegistrarRequest
> =>
  useMutationWithInvalidation<
    { id: string; username: string; fullName?: string; email: string; plainPassword: string },
    Error,
    CreateRegistrarRequest
  >(
    (data) => registrarApi.create(data),
    {
      invalidateKeys: [queryKeys.admin.registrars.all],
      onSuccess: () => {
        toast.success("Registrar account created successfully");
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to create registrar account",
        );
      },
    },
  );

// ─────────────────────────────────────────────
// UPDATE STATUS (suspend / activate)
// ─────────────────────────────────────────────
export const useUpdateRegistrarStatus = (): UseMutationResult<
  Registrar,
  Error,
  { id: string; status: string }
> =>
  useMutationWithInvalidation<Registrar, Error, { id: string; status: string }>(
    ({ id, status }) => registrarApi.updateStatus(id, status),
    {
      invalidateKeys: [queryKeys.admin.registrars.all],
      onSuccess: (_data, variables) => {
        toast.success(
          variables.status === "active"
            ? "Registrar account activated"
            : "Registrar account suspended",
        );
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update registrar");
      },
    },
  );

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
export const useDeleteRegistrar = (): UseMutationResult<void, Error, string> =>
  useMutationWithInvalidation<void, Error, string>(
    (id) => registrarApi.delete(id),
    {
      invalidateKeys: [queryKeys.admin.registrars.all],
      onSuccess: () => {
        toast.success("Registrar account deleted");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to delete registrar");
      },
    },
  );

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
export const useResetRegistrarPassword = (): UseMutationResult<
  { id: string; plainPassword: string },
  Error,
  string
> =>
  useAsyncMutation<{ id: string; plainPassword: string }, Error, string>(
    (id) => registrarApi.resetPassword(id),
    {
      onSuccess: () => {
        toast.success("Password reset successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to reset password");
      },
    },
  );