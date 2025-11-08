import { useEffect, useRef } from "react";
import { buildStreamUrl } from "../api/ocr";
import type { OcrTask } from "../store/taskStore";
import { useTaskStore } from "../store/taskStore";

interface StreamPayload {
  status: string;
  text?: string;
  progress?: number;
  error?: string;
}

// 自定义 Hook：根据任务列表自动维护 SSE 连接池，实现多任务的流式接收
export function useTaskStream(tasks: OcrTask[]) {
  const { appendResult, updateTask } = useTaskStore((state) => ({
    appendResult: state.appendResult,
    updateTask: state.updateTask
  }));
  const streamsRef = useRef<Record<string, EventSource>>({});

  useEffect(() => {
    tasks.forEach((task) => {
      const shouldSubscribe = ["pending", "processing"].includes(task.status);
      const hasSubscribed = Boolean(streamsRef.current[task.id]);
      if (shouldSubscribe && !hasSubscribed) {
        const streamUrl = buildStreamUrl(task.id);
        const eventSource = new EventSource(streamUrl);
        streamsRef.current[task.id] = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const payload: StreamPayload = JSON.parse(event.data);
            if (payload.text) {
              appendResult(task.id, payload.text);
            }
            updateTask(task.id, {
              status: payload.status as never,
              progress: payload.progress ?? task.progress,
              errorMessage: payload.error
            });
            if (["finished", "failed"].includes(payload.status)) {
              eventSource.close();
              delete streamsRef.current[task.id];
            }
          } catch (error) {
            console.error("解析 SSE 数据失败", error);
          }
        };

        eventSource.onerror = (event) => {
          console.warn(`任务 ${task.id} 的 SSE 连接异常`, event);
          eventSource.close();
          delete streamsRef.current[task.id];
        };
      }

      if (!shouldSubscribe && hasSubscribed) {
        streamsRef.current[task.id]?.close();
        delete streamsRef.current[task.id];
      }
    });

    return () => {
      Object.values(streamsRef.current).forEach((eventSource) => eventSource.close());
      streamsRef.current = {};
    };
  }, [appendResult, tasks, updateTask]);
}
