import { Card, Empty, Space, Tabs, Typography } from "antd";
import { useTaskStore } from "../store/taskStore";

const { Paragraph, Text } = Typography;

// 结果展示组件：提供文本输出、原图预览占位、调试信息等区域
export function OCRResultViewer() {
  const { activeTask, result } = useTaskStore((state) => {
    const task = state.tasks.find((item) => item.id === state.activeTaskId);
    return {
      activeTask: task,
      result: task?.resultText ?? ""
    };
  });

  if (!activeTask) {
    return (
      <Card title="3️⃣ 识别结果" bordered={false}>
        <Empty description="请选择左侧任务查看详情" />
      </Card>
    );
  }

  return (
    <Card title="3️⃣ 识别结果" bordered={false}>
      <Tabs
        items={[
          {
            key: "text",
            label: "Markdown 文本",
            children: (
              <Paragraph>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Menlo, monospace" }}>{result || "尚无输出，请等待模型生成"}</pre>
              </Paragraph>
            )
          },
          {
            key: "meta",
            label: "任务信息",
            children: (
              <Space direction="vertical">
                <Text>任务 ID：{activeTask.id}</Text>
                <Text>文件名：{activeTask.filename}</Text>
                <Text>状态：{activeTask.status}</Text>
                <Text>创建时间：{activeTask.createdAt}</Text>
                <Text>进度：{Math.round(activeTask.progress)}%</Text>
                {activeTask.errorMessage && <Text type="danger">错误：{activeTask.errorMessage}</Text>}
              </Space>
            )
          }
        ]}
      />
    </Card>
  );
}
