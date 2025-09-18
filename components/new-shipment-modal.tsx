"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Loader2, Package, FileText, Calendar, Hash } from "lucide-react"
import { ref, push, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment, Client, Transport } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"

interface NewShipmentModalProps {
  onShipmentCreated: (shipment: Shipment) => void
}

export default function NewShipmentModal({ onShipmentCreated }: NewShipmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [nextShipmentNumber, setNextShipmentNumber] = useState<string>("")
  const [nextRemitNumber, setNextRemitNumber] = useState<string>("")

  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    client: "",
    clientAddress: "",
    transport: "",
    packages: "",
    pallets: "",
    weight: "",
    declaredValue: "",
    shippingCost: "",
    invoiceNumber: "",
    remitNumber: "",
    deliveryNote: "",
    orderNote: "",
    notes: "",
    status: "pending" as const,
  })

  // Load clients and transports when modal opens
  useEffect(() => {
    if (isOpen) {
      loadClients()
      loadTransports()
      generateNextNumbers()
    }
  }, [isOpen])

  const loadClients = async () => {
    try {
      const clientsRef = ref(rtdb, "clients")
      const snapshot = await get(clientsRef)
      if (snapshot.exists()) {
        const clientsData = snapshot.val()
        const clientsArray = Object.keys(clientsData).map((key) => ({
          id: key,
          ...clientsData[key],
        }))
        setClients(clientsArray)
      }
    } catch (error) {
      console.error("Error loading clients:", error)
    }
  }

  const loadTransports = async () => {
    try {
      const transportsRef = ref(rtdb, "transports")
      const snapshot = await get(transportsRef)
      if (snapshot.exists()) {
        const transportsData = snapshot.val()
        const transportsArray = Object.keys(transportsData).map((key) => ({
          id: key,
          ...transportsData[key],
        }))
        setTransports(transportsArray)
      }
    } catch (error) {
      console.error("Error loading transports:", error)
    }
  }

  const generateNextNumbers = async () => {
    try {
      // Get all shipments to find the next number
      const shipmentsRef = ref(rtdb, "shipments")
      const snapshot = await get(shipmentsRef)

      let maxShipmentNum = 0
      let maxRemitNum = 0

      if (snapshot.exists()) {
        const shipmentsData = snapshot.val()
        Object.values(shipmentsData).forEach((shipment: any) => {
          // Extract shipment number
          if (shipment.shipmentNumber) {
            const shipmentMatch = shipment.shipmentNumber.match(/ENV-(\d+)/)
            if (shipmentMatch) {
              const num = Number.parseInt(shipmentMatch[1], 10)
              if (num > maxShipmentNum) {
                maxShipmentNum = num
              }
            }
          }

          // Extract remit number
          if (shipment.remitNumber) {
            const remitMatch = shipment.remitNumber.match(/R - 0006 - (\d+)/)
            if (remitMatch) {
              const num = Number.parseInt(remitMatch[1], 10)
              if (num > maxRemitNum) {
                maxRemitNum = num
              }
            }
          }
        })
      }

      const nextShipmentNum = maxShipmentNum + 1
      const nextRemitNum = maxRemitNum + 1

      setNextShipmentNumber(`ENV-${nextShipmentNum.toString().padStart(4, "0")}`)
      setNextRemitNumber(`R - 0006 - ${nextRemitNum.toString().padStart(4, "0")}`)

      // Set the remit number in form data
      setFormData((prev) => ({
        ...prev,
        remitNumber: `R - 0006 - ${nextRemitNum.toString().padStart(4, "0")}`,
      }))
    } catch (error) {
      console.error("Error generating next numbers:", error)
    }
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId)
    if (selectedClient) {
      setFormData((prev) => ({
        ...prev,
        client: selectedClient.businessName,
        clientAddress: selectedClient.address || "",
      }))
    }
  }

  const handleTransportChange = (transportId: string) => {
    const selectedTransport = transports.find((t) => t.id === transportId)
    if (selectedTransport) {
      setFormData((prev) => ({
        ...prev,
        transport: selectedTransport.name,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const shipmentData: Omit<Shipment, "id"> = {
        shipmentNumber: nextShipmentNumber,
        date: formData.date,
        client: formData.client,
        clientAddress: formData.clientAddress,
        transport: formData.transport,
        packages: Number.parseInt(formData.packages) || 0,
        pallets: Number.parseInt(formData.pallets) || 0,
        weight: Number.parseFloat(formData.weight) || 0,
        declaredValue: Number.parseFloat(formData.declaredValue) || 0,
        shippingCost: Number.parseFloat(formData.shippingCost) || 0,
        invoiceNumber: formData.invoiceNumber,
        remitNumber: formData.remitNumber,
        deliveryNote: formData.deliveryNote,
        orderNote: formData.orderNote,
        notes: formData.notes,
        status: formData.status,
        createdAt: new Date().toISOString(),
      }

      const shipmentsRef = ref(rtdb, "shipments")
      const newShipmentRef = await push(shipmentsRef, shipmentData)

      const newShipment: Shipment = {
        id: newShipmentRef.key!,
        ...shipmentData,
      }

      onShipmentCreated(newShipment)
      setIsOpen(false)
      resetForm()

      toast({
        title: "Envío creado",
        description: `El envío ${nextShipmentNumber} ha sido creado exitosamente.`,
      })
    } catch (error) {
      console.error("Error creating shipment:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el envío. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      client: "",
      clientAddress: "",
      transport: "",
      packages: "",
      pallets: "",
      weight: "",
      declaredValue: "",
      shippingCost: "",
      invoiceNumber: "",
      remitNumber: "",
      deliveryNote: "",
      orderNote: "",
      notes: "",
      status: "pending",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Envío
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Crear Nuevo Envío
            {nextShipmentNumber && (
              <Badge variant="outline" className="ml-2">
                {nextShipmentNumber}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-4 w-4" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select onValueChange={handleClientChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex flex-col">
                            <span>{client.businessName}</span>
                            <span className="text-xs text-muted-foreground">{client.clientCode}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clientAddress">Dirección del Cliente</Label>
                  <Textarea
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="Dirección de entrega"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="transport">Transporte</Label>
                  <Select onValueChange={handleTransportChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {transports.map((transport) => (
                        <SelectItem key={transport.id} value={transport.id}>
                          {transport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Package Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-4 w-4" />
                  Información del Paquete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="packages">Bultos</Label>
                    <Input
                      id="packages"
                      type="number"
                      min="0"
                      value={formData.packages}
                      onChange={(e) => setFormData((prev) => ({ ...prev, packages: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pallets">Pallets</Label>
                    <Input
                      id="pallets"
                      type="number"
                      min="0"
                      value={formData.pallets}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pallets: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="declaredValue">Valor Declarado ($)</Label>
                    <Input
                      id="declaredValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.declaredValue}
                      onChange={(e) => setFormData((prev) => ({ ...prev, declaredValue: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingCost">Costo de Envío ($)</Label>
                    <Input
                      id="shippingCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shippingCost}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shippingCost: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Document Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" />
                Información de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Número de Factura</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="Ej: FAC-001"
                  />
                </div>
                <div>
                  <Label htmlFor="remitNumber">Número de Remito</Label>
                  <Input
                    id="remitNumber"
                    value={formData.remitNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                    placeholder="Se generará automáticamente"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryNote">Nota de Entrega</Label>
                  <Textarea
                    id="deliveryNote"
                    value={formData.deliveryNote}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                    placeholder="Instrucciones especiales de entrega"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="orderNote">Nota de Pedido</Label>
                  <Textarea
                    id="orderNote"
                    value={formData.orderNote}
                    onChange={(e) => setFormData((prev) => ({ ...prev, orderNote: e.target.value }))}
                    placeholder="Información adicional del pedido"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-4 w-4" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "pending" | "sent") => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Observaciones adicionales"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Envío
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
