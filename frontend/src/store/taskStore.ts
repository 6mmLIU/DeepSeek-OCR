import { create } from "zustand";

// 定义任务状态类型，方便在全局管理多个 OCR 请求
export type TaskStatus = "idle" | "pending" | "processing" | "finished" | "failed";

export interface OcrTask {
  id: string;
  filename: string;
  status: TaskStatus;
  prompt: string;
  resolutionMode: string;
  cropMode: boolean;
  createdAt: string;
  resultText: string;
  progress: number;
  errorMessage?: string;
}

interface TaskStoreState {
  tasks: OcrTask[];
  activeTaskId?: string;
  addTask: (task: OcrTask) => void;
  updateTask: (taskId: string, patch: Partial<OcrTask>) => void;
  appendResult: (taskId: string, textChunk: string) => void;
  setActiveTask: (taskId?: string) => void;
}

// 使用 Zustand 创建轻量状态管理，方便在多个组件之间共享任务数据
export const useTaskStore = create<TaskStoreState>((set) => ({
  tasks: [],
  activeTaskId: undefined,
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
      activeTaskId: task.id
    })),
  updateTask: (taskId, patch) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch
            }
          : task
      )
    })),
  appendResult: (taskId, textChunk) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              resultText: `${task.resultText}${textChunk}`
            }
          : task
      )
    })),
  setActiveTask: (taskId) =>
    set(() => ({
      activeTaskId: taskId
    }))
}));
