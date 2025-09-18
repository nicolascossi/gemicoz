"use client"

import { useState } from "react"
import { Modal, Form, Input, Button } from "antd"

const NewShipmentModal = () => {
  const [visible, setVisible] = useState(false)
  const [formData, setFormData] = useState({
    packages: 0,
    // other form fields here
  })

  const handleOk = () => {
    setVisible(false)
    // handle form submission here
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    if (formData.packages < 0) {
      // handle validation error here
      return false
    }
    // other validations here
    return true
  }

  return (
    <div>
      <Button type="primary" onClick={() => setVisible(true)}>
        Create New Shipment
      </Button>
      <Modal title="Create New Shipment" visible={visible} onOk={handleOk} onCancel={handleCancel}>
        <Form>
          <Form.Item label="Packages">
            <Input type="number" name="packages" value={formData.packages} onChange={handleChange} min="0" />
          </Form.Item>
          {/* other form items here */}
        </Form>
      </Modal>
    </div>
  )
}

export default NewShipmentModal
