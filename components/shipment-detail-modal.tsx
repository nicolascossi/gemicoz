"use client"

import { useState } from "react"
import { Modal, Form, Input, Button } from "antd"

const ShipmentDetailModal = ({ visible, onCancel, shipment }) => {
  const [editedShipment, setEditedShipment] = useState(shipment)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedShipment({ ...editedShipment, [name]: value })
  }

  const handleFormSubmit = () => {
    // Validation logic here
    if (editedShipment.packages < 0) {
      alert("Packages cannot be negative")
      return
    }
    // Submit logic here
    console.log("Shipment updated:", editedShipment)
    onCancel()
  }

  return (
    <Modal visible={visible} onCancel={onCancel} footer={null}>
      <Form onFinish={handleFormSubmit}>
        <Form.Item label="Shipment ID" name="id">
          <Input value={editedShipment.id} disabled />
        </Form.Item>
        <Form.Item label="Packages" name="packages">
          <Input type="number" value={editedShipment.packages} onChange={handleInputChange} min="0" />
        </Form.Item>
        {/* Additional form items here */}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Update Shipment
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ShipmentDetailModal
