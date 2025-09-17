"use client"

import type React from "react"
import { useState } from "react"
import { Modal, Form, Input, Button } from "antd"

const NewShipmentModal: React.FC = () => {
  const [visible, setVisible] = useState(false)

  const generateRemitNumber = () => {
    const timestamp = Date.now().toString().slice(-6)
    return `R - 0006${timestamp}`
  }

  const showModal = () => {
    setVisible(true)
  }

  const handleOk = () => {
    setVisible(false)
  }

  const handleCancel = () => {
    setVisible(false)
  }

  return (
    <div>
      <Button type="primary" onClick={showModal}>
        New Shipment
      </Button>
      <Modal title="Create New Shipment" visible={visible} onOk={handleOk} onCancel={handleCancel}>
        <Form>
          <Form.Item label="Remit Number">
            <Input value={generateRemitNumber()} disabled />
          </Form.Item>
          <Form.Item label="Recipient Name">
            <Input />
          </Form.Item>
          <Form.Item label="Recipient Address">
            <Input />
          </Form.Item>
          {/* rest of code here */}
        </Form>
      </Modal>
    </div>
  )
}

export default NewShipmentModal
