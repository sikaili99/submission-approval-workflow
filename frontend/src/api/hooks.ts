import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';
import type {
  Action,
  ApplicationDetail,
  ApplicationSummary,
  Category,
  Status,
} from './types.js';

export interface ApplicationInput {
  title: string;
  category: Category;
  description?: string;
  amount?: number | null;
}

export function useApplications(status?: Status | 'ALL') {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['applications', status ?? 'ALL'],
    queryFn: () =>
      api.get<{ applications: ApplicationSummary[] }>(`/applications${query}`).then((r) => r.applications),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: ['application', id],
    enabled: Boolean(id),
    queryFn: () =>
      api.get<{ application: ApplicationDetail }>(`/applications/${id}`).then((r) => r.application),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ApplicationInput) =>
      api.post<{ application: ApplicationSummary }>('/applications', input).then((r) => r.application),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdateApplication(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ApplicationInput>) =>
      api.patch<{ application: ApplicationSummary }>(`/applications/${id}`, input).then((r) => r.application),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['application', id] });
      void qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useTransition(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { action: Action; comment?: string }) =>
      api
        .post<{ application: ApplicationDetail }>(`/applications/${id}/transition`, vars)
        .then((r) => r.application),
    onSuccess: (data) => {
      qc.setQueryData(['application', id], data);
      void qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUploadAttachment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return api
        .upload<{ application: ApplicationSummary }>(`/applications/${id}/attachment`, fd)
        .then((r) => r.application);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['application', id] });
    },
  });
}
