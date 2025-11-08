import axios from "axios";

// 从环境变量中读取后端 API 地址，便于在不同环境之间切换
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// 创建 Axios 实例，统一处理请求头、超时等参数
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000
});

export interface CreateTaskPayload {
  file: File;
  prompt: string;
  resolutionMode: string;
  enableCrop: boolean;
}

export interface TaskResponse {
  task_id: string;
}

export interface TaskDetailResponse {
  status: string;
  result?: string;
  progress?: number;
  error?: string;
}

// 创建任务：将文件与表单参数封装为 multipart/form-data 发往后端
export async function createTask(payload: CreateTaskPayload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("prompt", payload.prompt);
  formData.append("resolution_mode", payload.resolutionMode);
  formData.append("enable_crop", String(payload.enableCrop));

  const { data } = await apiClient.post<TaskResponse>("/api/ocr", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

// 轮询任务：后端需返回任务状态、进度与当前结果摘要
export async function fetchTaskDetail(taskId: string) {
  const { data } = await apiClient.get<TaskDetailResponse>(`/api/ocr/${taskId}`);
  return data;
}

// 构造 SSE 地址，前端通过 EventSource 与后端建立长连接
export function buildStreamUrl(taskId: string) {
  const base = API_BASE_URL || window.location.origin;
  return `${base}/api/ocr/${taskId}/stream`;
}
