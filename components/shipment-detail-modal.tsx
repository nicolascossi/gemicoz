"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Save, Loader2, Package, FileText, Calendar, Hash, Edit, Trash2, Printer, Eye, EyeOff } from "lucide-react"
import { ref, update, remove, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment, Client, Transport } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface ShipmentDetailModalProps {
  shipment: Shipment
  onClose: () => void
  onShipmentUpdated?: (shipment: Shipment) => void
  onShipmentDeleted?: (shipmentId: string) => void
  showPrintButton?: boolean
}

export default function ShipmentDetailModal({
  shipment,
  onClose,
  onShipmentUpdated,
  onShipmentDeleted,
  showPrintButton = true,
}: ShipmentDetailModalProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    date: shipment.date,
    client: shipment.client,
    clientAddress: shipment.clientAddress || "",
    transport: shipment.transport,
    packages: shipment.packages?.toString() || "",
    pallets: shipment.pallets?.toString() || "",
    weight: shipment.weight?.toString() || "",
    declaredValue: shipment.declaredValue?.toString() || "",
    shippingCost: shipment.shippingCost?.toString() || "",
    invoiceNumber: shipment.invoiceNumber || "",
    remitNumber: shipment.remitNumber || "",
    deliveryNote: shipment.deliveryNote || "",
    orderNote: shipment.orderNote || "",
    notes: shipment.notes || "",
    status: shipment.status,
  })

  // Load clients and transports when editing
  useEffect(() => {
    if (isEditing) {
      loadClients()
      loadTransports()
    }
  }, [isEditing])

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

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const updatedData = {
        ...shipment,
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
        updatedAt: new Date().toISOString(),
      }

      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      await update(shipmentRef, updatedData)

      if (onShipmentUpdated) {
        onShipmentUpdated(updatedData)
      }

      setIsEditing(false)
      toast({
        title: "Envío actualizado",
        description: `El envío ${shipment.shipmentNumber} ha sido actualizado exitosamente.`,
      })
    } catch (error) {
      console.error("Error updating shipment:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el envío. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("¿Está seguro de que desea eliminar este envío? Esta acción no se puede deshacer.")) {
      return
    }

    setIsDeleting(true)

    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      await remove(shipmentRef)

      if (onShipmentDeleted) {
        onShipmentDeleted(shipment.id)
      }

      onClose()
      toast({
        title: "Envío eliminado",
        description: `El envío ${shipment.shipmentNumber} ha sido eliminado exitosamente.`,
      })
    } catch (error) {
      console.error("Error deleting shipment:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el envío. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    router.push(`/print-labels/${shipment.id}`)
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return "$0.00"
    return `$${value.toFixed(2)}`
  }

  const formatWeight = (value: number | undefined) => {
    if (!value) return "0.00 kg"
    return `${value.toFixed(2)} kg`
  }

  const getStatusBadge = (status: string) => {
    return status === "sent" ? (
      <Badge className="bg-green-500">Enviado</Badge>
    ) : (
      <Badge variant="secondary">Pendiente</Badge>
    )
  }

  // Check if remit number follows the new pattern R - 0006 - XXXX
  const isNewRemitFormat = (remitNumber: string) => {
    return /^R - 0006 - \d{4}$/.test(remitNumber)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles del Envío
              <Badge variant="outline">{shipment.shipmentNumber}</Badge>
              {getStatusBadge(shipment.status)}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                title={showSensitiveInfo ? "Ocultar información sensible" : "Mostrar información sensible"}
              >
                {showSensitiveInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {showPrintButton && (
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              )}
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
                {isEditing ? (
                  <>
                    <div>
                      <Label htmlFor="date">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="client">Cliente</Label>
                      <Select
                        value={clients.find((c) => c.businessName === formData.client)?.id || ""}
                        onValueChange={handleClientChange}
                      >
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
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="transport">Transporte</Label>
                      <Select
                        value={transports.find((t) => t.name === formData.transport)?.id || ""}
                        onValueChange={handleTransportChange}
                      >
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
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Fecha:</span>
                      <span className="text-sm">{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Cliente:</span>
                      <span className="text-sm">{shipment.client}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Dirección:</span>
                      <span className="text-sm text-right max-w-[200px]">
                        {shipment.clientAddress || "No especificada"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Transporte:</span>
                      <span className="text-sm">{shipment.transport}</span>
                    </div>
                  </>
                )}
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
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="packages">Bultos</Label>
                        <Input
                          id="packages"
                          type="number"
                          min="0"
                          value={formData.packages}
                          onChange={(e) => setFormData((prev) => ({ ...prev, packages: e.target.value }))}
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
                      />
                    </div>

                    {showSensitiveInfo && (
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
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Bultos:</span>
                      <span className="text-sm">{shipment.packages || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Pallets:</span>
                      <span className="text-sm">{shipment.pallets || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Peso:</span>
                      <span className="text-sm">{formatWeight(shipment.weight)}</span>
                    </div>
                    {showSensitiveInfo && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Valor Declarado:</span>
                          <span className="text-sm">{formatCurrency(shipment.declaredValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Costo de Envío:</span>
                          <span className="text-sm">{formatCurrency(shipment.shippingCost)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}
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
              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">Número de Factura</Label>
                      <Input
                        id="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="remitNumber">Número de Remito</Label>
                      <Input
                        id="remitNumber"
                        value={formData.remitNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
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
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="orderNote">Nota de Pedido</Label>
                      <Textarea
                        id="orderNote"
                        value={formData.orderNote}
                        onChange={(e) => setFormData((prev) => ({ ...prev, orderNote: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Factura:</span>
                      <span className="text-sm">{shipment.invoiceNumber || "No especificada"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Remito:</span>
                      <span className="text-sm">{shipment.remitNumber || "No especificado"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Nota de Entrega:</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        {shipment.deliveryNote || "Sin nota de entrega"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Nota de Pedido:</span>
                      <p className="text-sm text-muted-foreground mt-1">{shipment.orderNote || "Sin nota de pedido"}</p>
                    </div>
                  </div>
                </div>
              )}
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
              {isEditing ? (
                <>
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
                      rows={3}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    {getStatusBadge(shipment.status)}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Observaciones:</span>
                    <p className="text-sm text-muted-foreground mt-1">{shipment.notes || "Sin observaciones"}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>
              {!isEditing && (
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
