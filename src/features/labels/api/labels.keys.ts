export const labelKeys = {
  all: ["labels"] as const,
  lists: () => [...labelKeys.all, "list"] as const,
  list: (projectId: string) => [...labelKeys.lists(), projectId] as const
}

export const taskLabelKeys = {
  all: ["taskLabels"] as const,
  lists: () => [...taskLabelKeys.all, "list"] as const,
  list: (taskId: string) => [...taskLabelKeys.lists(), taskId] as const
}
