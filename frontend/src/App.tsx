import {
  CloudUploadOutlined,
  ControlOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import {
  App as AntdApp,
  Col,
  ConfigProvider,
  Layout,
  Row,
  Statistic,
  Typography
} from "antd";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { useMemo, useState } from "react";
import { createTask, fetchTaskDetail } from "./api/ocr";
import { OCRResultViewer } from "./components/OCRResultViewer";
import { OCRTaskList } from "./components/OCRTaskList";
import { OCRUploadForm, type UploadFormValues } from "./components/OCRUploadForm";
import { useTaskStream } from "./hooks/useTaskStream";
import { useTaskStore } from "./store/taskStore";

dayjs.locale("zh-cn");

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

function DashboardHeader() {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={8}>
        <Statistic
          title="流程概览"
          valueRender={() => (
            <Paragraph>
              <CloudUploadOutlined style={{ marginRight: 8, color: "#1677ff" }} />
              上传图像/PDF → 触发后端推理 → 实时接收流式输出
            </Paragraph>
          )}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="支持能力"
          valueRender={() => (
            <Paragraph>
              <ControlOutlined style={{ marginRight: 8, color: "#52c41a" }} />
              自定义 Prompt、分辨率与裁剪策略，适配不同场景
            </Paragraph>
          )}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="实时反馈"
          valueRender={() => (
            <Paragraph>
              <ThunderboltOutlined style={{ marginRight: 8, color: "#faad14" }} />
              通过 SSE 监听任务进度，支持多任务并行
            </Paragraph>
          )}
        />
      </Col>
    </Row>
  );
}

// 内部组件：包含业务逻辑与页面布局，确保能获取 Ant Design 的上下文
function InnerApp() {
  const [creating, setCreating] = useState(false);
  const { tasks, addTask, updateTask, setActiveTask } = useTaskStore((state) => ({
    tasks: state.tasks,
    addTask: state.addTask,
    updateTask: state.updateTask,
    setActiveTask: state.setActiveTask
  }));
  const { message } = AntdApp.useApp();

  // 启动 SSE Hook，实时同步所有任务状态
  useTaskStream(tasks);

  const handleSubmit = async (values: UploadFormValues) => {
    if (!values.file) {
      message.error("请选择文件");
      return;
    }
    try {
      setCreating(true);
      const response = await createTask({
        file: values.file,
        prompt: values.prompt,
        resolutionMode: values.resolutionMode,
        enableCrop: values.enableCrop
      });

      const taskId = response.task_id;
      addTask({
        id: taskId,
        filename: values.file.name,
        status: "pending",
        prompt: values.prompt,
        resolutionMode: values.resolutionMode,
        cropMode: values.enableCrop,
        createdAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        resultText: "",
        progress: 0
      });

      // 创建任务后立即进行一次轮询，确保初始状态被刷新
      const detail = await fetchTaskDetail(taskId);
      updateTask(taskId, {
        status: detail.status as never,
        progress: detail.progress ?? 0,
        resultText: detail.result ?? "",
        errorMessage: detail.error
      });
      message.success("任务已创建，正在排队识别");
    } catch (error) {
      console.error(error);
      message.error("任务创建失败，请检查后端服务");
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const finished = tasks.filter((task) => task.status === "finished").length;
    const running = tasks.filter((task) => ["pending", "processing"].includes(task.status)).length;
    return { total, finished, running };
  }, [tasks]);

  return (
    <Layout>
      <Header style={{ background: "transparent" }}>
        <Title level={3} style={{ color: "#fff" }}>
          DeepSeek-OCR 控制台
        </Title>
      </Header>
      <Content style={{ padding: "24px 48px" }}>
        <DashboardHeader />
        <Row gutter={24}>
          <Col span={10}>
            <OCRUploadForm loading={creating} onSubmit={handleSubmit} />
            <OCRTaskList onSelectTask={(taskId) => setActiveTask(taskId)} />
          </Col>
          <Col span={14}>
            <OCRResultViewer />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Statistic title="任务总数" value={stats.total} suffix="个" />
          </Col>
          <Col span={8}>
            <Statistic title="已完成" value={stats.finished} suffix="个" valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col span={8}>
            <Statistic title="进行中" value={stats.running} suffix="个" valueStyle={{ color: "#1677ff" }} />
          </Col>
        </Row>
      </Content>
      <Footer style={{ textAlign: "center" }}>Powered by DeepSeek-OCR · 前端基于 React + Ant Design + Vite</Footer>
    </Layout>
  );
}

// 主组件：配置主题与语言后渲染业务组件
export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: "#722ed1" } }}>
      <AntdApp>
        <InnerApp />
      </AntdApp>
    </ConfigProvider>
  );
}
