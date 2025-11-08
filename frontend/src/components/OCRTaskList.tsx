import { Badge, Card, Empty, List, Progress, Space, Tag, Typography } from "antd";
import { useTaskStore, type OcrTask } from "../store/taskStore";

const { Text } = Typography;

interface Props {
  onSelectTask: (taskId: string) => void;
}

// 任务状态对应的颜色标签，便于快速区分
const statusColorMap: Record<OcrTask["status"], string> = {
  idle: "default",
  pending: "processing",
  processing: "blue",
  finished: "green",
  failed: "red"
};

// 任务列表组件：展示历史任务及其状态，可点击切换查看详情
export function OCRTaskList({ onSelectTask }: Props) {
  const { tasks, activeTaskId } = useTaskStore((state) => ({
    tasks: state.tasks,
    activeTaskId: state.activeTaskId
  }));

  return (
    <Card title="2️⃣ 任务队列" bordered={false} style={{ marginBottom: 24 }}>
      {tasks.length === 0 ? (
        <Empty description="暂无任务，请先发起识别" />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              style={{
                cursor: "pointer",
                background: task.id === activeTaskId ? "#f0f5ff" : "#fff",
                borderRadius: 8,
                marginBottom: 12,
                padding: 16,
                border: "1px solid #f0f0f0"
              }}
              onClick={() => onSelectTask(task.id)}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space wrap size="small">
                  <Text strong>{task.filename}</Text>
                  <Tag color={statusColorMap[task.status]}>{task.status}</Tag>
                  <Text type="secondary">{task.createdAt}</Text>
                </Space>
                <Text type="secondary">Prompt：{task.prompt}</Text>
                <Space wrap>
                  <Badge status="processing" text={`分辨率模式：${task.resolutionMode}`} />
                  <Badge status={task.cropMode ? "success" : "default"} text={task.cropMode ? "裁剪：开启" : "裁剪：关闭"} />
                </Space>
                <Progress percent={Math.round(task.progress)} size="small" status={task.status === "failed" ? "exception" : undefined} />
                {task.errorMessage && (
                  <Text type="danger">错误信息：{task.errorMessage}</Text>
                )}
              </Space>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
