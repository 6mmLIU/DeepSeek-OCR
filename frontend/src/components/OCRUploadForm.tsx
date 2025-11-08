import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Upload,
  message
} from "antd";
import type { RcFile } from "antd/es/upload";
import { useState } from "react";

export interface UploadFormValues {
  file?: RcFile;
  prompt: string;
  resolutionMode: string;
  enableCrop: boolean;
}

interface Props {
  loading: boolean;
  onSubmit: (values: UploadFormValues) => Promise<void>;
}

// OCR 上传表单：负责收集文件与参数，并调用父组件传入的 onSubmit 触发推理
export function OCRUploadForm({ loading, onSubmit }: Props) {
  const [form] = Form.useForm<UploadFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 处理提交逻辑：验证表单并调用 onSubmit
  const handleFinish = async () => {
    const values = await form.validateFields();
    if (!values.file) {
      message.error("请先选择需要识别的文件");
      return;
    }
    await onSubmit(values);
    setFileList([]);
    form.resetFields(["file"]);
  };

  // beforeUpload 返回 false 可阻止 Upload 组件自动上传
  const beforeUpload = (file: RcFile) => {
    setFileList([file]);
    form.setFieldValue("file", file);
    return false;
  };

  const removeFile = () => {
    setFileList([]);
    form.setFieldValue("file", undefined);
  };

  return (
    <Card title="1️⃣ 上传文件与参数" bordered={false} style={{ marginBottom: 24 }}>
      <Form<UploadFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          prompt: "<image>\n<|grounding|>Convert the document to markdown.",
          resolutionMode: "base",
          enableCrop: true
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item<UploadFormValues>
              name="file"
              valuePropName="file"
              rules={[{ required: true, message: "请上传图片或 PDF 文件" }]}
              getValueFromEvent={(e) => (Array.isArray(e) ? e[0] : e?.file)}
            >
              <Upload.Dragger
                multiple={false}
                accept=".png,.jpg,.jpeg,.pdf"
                beforeUpload={beforeUpload}
                fileList={fileList as UploadFile[]}
                onRemove={removeFile}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件至此完成上传</p>
                <p className="ant-upload-hint">支持 PNG/JPG/JPEG/PDF，文件大小建议控制在 20MB 内</p>
              </Upload.Dragger>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item<UploadFormValues>
              name="prompt"
              label="提示词 Prompt"
              rules={[{ required: true, message: "请输入 Prompt" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入模型提示词"
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<UploadFormValues>
              name="resolutionMode"
              label="分辨率模式"
              tooltip="需与后端 config.py 中的配置对应"
            >
              <Select
                options={[
                  { value: "tiny", label: "Tiny（最省资源）" },
                  { value: "base", label: "Base（推荐）" },
                  { value: "gundam", label: "Gundam（最高质量）" }
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<UploadFormValues>
              name="enableCrop"
              label="启用自动裁剪"
              valuePropName="checked"
            >
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end">
          <Button type="primary" loading={loading} onClick={handleFinish}>
            开始识别
          </Button>
        </Row>
      </Form>
    </Card>
  );
}
