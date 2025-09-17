"use client"
import { Modal, Form, Input, Button } from "antd"

const ShipmentDetailModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm()
  const remitPattern = /^R - 0006\d{6}$/

  const onFinish = (values) => {
    console.log("Received values of form: ", values)
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      title="Shipment Details"
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" htmlType="submit" form="shipmentForm">
          Submit
        </Button>,
      ]}
    >
      <Form form={form} name="shipmentForm" onFinish={onFinish}>
        <Form.Item
          name="remit"
          label="Remit"
          rules={[
            {
              required: true,
              message: "Please input your remit!",
            },
            {
              pattern: remitPattern,
              message: "Remit must match the pattern R - 0006 followed by 6 digits!",
            },
          ]}
        >
          <Input />
        </Form.Item>
        {/* rest of code here */}
      </Form>
    </Modal>
  )
}

export default ShipmentDetailModal
