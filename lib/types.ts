export interface Client {
  id: string
  businessName: string
  clientCode: string
  email?: string
  phone?: string
  addresses: ClientAddress[]
}

export interface ClientAddress {
  id: string
  street: string
  city?: string
  title?: string
  isDefault?: boolean
}

export interface Transport {
  id: string
  name: string
  email?: string
  phone?: string
}

export interface Shipment {
  id: string
  shipmentNumber: string
  client: string
  clientCode?: string
  clientEmail?: string
  clientPhone?: string
  clientAddress?: string
  clientAddressId?: string
  clientAddressTitle?: string
  transport: string
  transportEmail?: string
  transportPhone?: string
  date: string
  packages: number
  pallets?: number
  weight?: number
  declaredValue?: number
  shippingCost?: number
  status: "pending" | "sent"
  invoiceNumber?: string
  remitNumber?: string
  deliveryNote?: string
  orderNote?: string
  notes?: string
  hasColdChain?: boolean
  isUrgent?: boolean
  isFragile?: boolean
  attachments?: string[]
  createdAt?: string
  remitoTriplicado?: boolean
}

export interface EmailLog {
  id: string
  to: string
  subject: string
  sentAt: string
  status: "sent" | "failed"
  error?: string
  shipmentId?: string
}
