import { apiClient } from "@/lib/api/client"

/**
 * The full `Label` row — `label.repository.ts` uses a bare `findMany`/`create`/`update` with
 * no `select`, so all six fields travel on the wire even though the UI ignores the timestamps.
 */
export interface Label {
  id: string
  name: string
  color: string
  projectId: string
  createdAt: string
  updatedAt: string
}

export interface CreateLabelInput {
  name: string
  color: string
}

export type UpdateLabelInput = Partial<CreateLabelInput>

/** The join row `POST /tasks/:taskId/labels/:labelId` returns — not a `Label`. */
export interface TaskLabel {
  taskId: string
  labelId: string
}

export const labelsApi = {
  list: async (projectId: string) => (await apiClient.get<Label[]>(`/projects/${projectId}/labels`)).data,

  create: async (projectId: string, input: CreateLabelInput) =>
    (await apiClient.post<Label>(`/projects/${projectId}/labels`, input)).data,

  update: async (labelId: string, input: UpdateLabelInput) =>
    (await apiClient.patch<Label>(`/labels/${labelId}`, input)).data,

  remove: async (labelId: string): Promise<void> => {
    await apiClient.delete(`/labels/${labelId}`)
  }
}

export const taskLabelsApi = {
  list: async (taskId: string) => (await apiClient.get<Label[]>(`/tasks/${taskId}/labels`)).data,

  attach: async (taskId: string, labelId: string) =>
    (await apiClient.post<TaskLabel>(`/tasks/${taskId}/labels/${labelId}`)).data,

  detach: async (taskId: string, labelId: string): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}/labels/${labelId}`)
  }
}
