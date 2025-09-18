"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Package, Truck, MapPin, FileText, Printer, Edit, Save, X } from "lucide-react"
import { ref, update, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import type { Shipment, Client, Transport } from "@/lib/types"
import Link from "next/link"

interface ShipmentDetailModalProps {
  shipment: Shipment | null
  isOpen: boolean
  onClose: () => void
  onShipmentUpdated: () => void
}

export default function ShipmentDetailModal({
  shipment,
  isOpen,
  onClose,
  onShipmentUpdated,
}: ShipmentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const { toast } = useToast()

  const [editData, setEditData] = useState<Partial<Shipment>>({})

  useEffect(() => {
    if (shipment && isOpen) {
      setEditData({
        client: shipment.client,
        clientAddress: shipment.clientAddress,
        transport: shipment.transport,
        date: shipment.date,
        packages: shipment.packages,
        pallets: shipment.pallets,
        weight: shipment.weight,
        declaredValue: shipment.declaredValue,
        invoiceNumber: shipment.invoiceNumber,
        remitNumber: shipment.remitNumber,
        notes: shipment.notes,
        deliveryNote: shipment.deliveryNote,
        hasColdChain: shipment.hasColdChain,
        isUrgent: shipment.isUrgent,
        isFragile: shipment.isFragile,
        status: shipment.status,
      })
    }
  }, [shipment, isOpen])

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return

      try {
        // Fetch clients
        const clientsRef = ref(rtdb, "clients")
        const clientsSnapshot = await get(clientsRef)
        if (clientsSnapshot.exists()) {
          const clientsData = Object.entries(clientsSnapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setClients(clientsData)
        }

        // Fetch transports
        const transportsRef = ref(rtdb, "transports")
        const transportsSnapshot = await get(transportsRef)
        if (transportsSnapshot.exists()) {
          const transportsData = Object.entries(transportsSnapshot.val()).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setTransports(transportsData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
  }, [isOpen])

  const handleClientChange = (clientName: string) => {
    const selectedClient = clients.find((c) => c.name === clientName)
    setEditData((prev) => ({
      ...prev,
      client: clientName,
      clientAddress: selectedClient?.address || prev.clientAddress,
    }))
  }

  const handleSave = async () => {
    if (!shipment) return

    setIsLoading(true)
    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      const updateData = {
        ...editData,
        packages: Number(editData.packages) || 0,
        pallets: Number(editData.pallets) || 0,
        weight: Number(editData.weight) || 0,
        declaredValue: Number(editData.declaredValue) || 0,
        updatedAt: new Date().toISOString(),
      }

      await update(shipmentRef, updateData)

      toast({
        title: "Éxito",
        description: "Envío actualizado correctamente",
      })

      setIsEditing(false)
      onShipmentUpdated()
    } catch (error) {
      console.error("Error updating shipment:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el envío",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: "pending" | "sent" | "delivered") => {
    if (!shipment) return

    setIsLoading(true)
    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      await update(shipmentRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })

      toast({
        title: "Éxito",
        description: "Estado actualizado correctamente",
      })

      onShipmentUpdated()
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!shipment) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "sent":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "sent":
        return "Enviado"
      case "delivered":
        return "Entregado"
      default:
        return "Desconocido"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Envío {shipment.shipmentNumber}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(shipment.status)}>{getStatusText(shipment.status)}</Badge>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Update */}
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Label>Cambiar Estado:</Label>
              <Select value={shipment.status} onValueChange={handleStatusChange} disabled={isLoading}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="client">Cliente</Label>
                {isEditing ? (
                  <Select value={editData.client} onValueChange={handleClientChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.name}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{shipment.client}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="transport">Transporte</Label>
                {isEditing ? (
                  <Select
                    value={editData.transport}
                    onValueChange={(value) => setEditData((prev) => ({ ...prev, transport: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar transporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {transports.map((transport) => (
                        <SelectItem key={transport.id} value={transport.name}>
                          {transport.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Truck className="h-4 w-4 text-gray-500" />
                    <span>{shipment.transport}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="date">Fecha</Label>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.date}
                    onChange={(e) => setEditData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="packages">Bultos</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={editData.packages}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, packages: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-center font-semibold">{shipment.packages || 0}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="pallets">Pallets</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      value={editData.pallets}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, pallets: Number.parseInt(e.target.value) || 0 }))
                      }
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-center font-semibold">{shipment.pallets || 0}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.weight}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-center font-semibold">
                      {shipment.weight ? `${shipment.weight.toFixed(2)} kg` : "0.00 kg"}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="declaredValue">Valor Declarado ($)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData.declaredValue}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, declaredValue: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                  ) : (
                    <div className="p-2 bg-gray-50 rounded text-center font-semibold">
                      ${shipment.declaredValue ? shipment.declaredValue.toFixed(2) : "0.00"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="clientAddress">Dirección del Cliente</Label>
            {isEditing ? (
              <Textarea
                value={editData.clientAddress}
                onChange={(e) => setEditData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                rows={2}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded min-h-[60px]">{shipment.clientAddress || "No especificada"}</div>
            )}
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              {isEditing ? (
                <Input
                  value={editData.invoiceNumber}
                  onChange={(e) => setEditData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="Ej: FC-001-00001234"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{shipment.invoiceNumber || "No especificado"}</span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="remitNumber">Número de Remito</Label>
              {isEditing ? (
                <Input
                  value={editData.remitNumber}
                  onChange={(e) => setEditData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                  placeholder="R - 0006-YYMM-XXX"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>{shipment.remitNumber || "No especificado"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Observaciones</Label>
              {isEditing ? (
                <Textarea
                  value={editData.notes}
                  onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded min-h-[80px]">{shipment.notes || "Sin observaciones"}</div>
              )}
            </div>
            <div>
              <Label htmlFor="deliveryNote">Nota de Entrega</Label>
              {isEditing ? (
                <Textarea
                  value={editData.deliveryNote}
                  onChange={(e) => setEditData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                  rows={3}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded min-h-[80px]">
                  {shipment.deliveryNote || "Sin nota de entrega"}
                </div>
              )}
            </div>
          </div>

          {/* Special Characteristics */}
          <div>
            <Label>Características Especiales</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              {isEditing ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasColdChain"
                      checked={editData.hasColdChain}
                      onCheckedChange={(checked) =>
                        setEditData((prev) => ({ ...prev, hasColdChain: checked as boolean }))
                      }
                    />
                    <Label htmlFor="hasColdChain" className="text-sm font-normal">
                      Cadena de frío
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isUrgent"
                      checked={editData.isUrgent}
                      onCheckedChange={(checked) => setEditData((prev) => ({ ...prev, isUrgent: checked as boolean }))}
                    />
                    <Label htmlFor="isUrgent" className="text-sm font-normal">
                      Urgente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFragile"
                      checked={editData.isFragile}
                      onCheckedChange={(checked) => setEditData((prev) => ({ ...prev, isFragile: checked as boolean }))}
                    />
                    <Label htmlFor="isFragile" className="text-sm font-normal">
                      Frágil
                    </Label>
                  </div>
                </>
              ) : (
                <>
                  {shipment.hasColdChain && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      ❄️ Cadena de frío
                    </Badge>
                  )}
                  {shipment.isUrgent && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      ⚡ Urgente
                    </Badge>
                  )}
                  {shipment.isFragile && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ⚠️ Frágil
                    </Badge>
                  )}
                  {!shipment.hasColdChain && !shipment.isUrgent && !shipment.isFragile && (
                    <span className="text-gray-500 text-sm">Sin características especiales</span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <Label>Creado</Label>
              <div className="p-2 bg-gray-50 rounded">
                {format(new Date(shipment.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
              </div>
            </div>
            {shipment.updatedAt && (
              <div>
                <Label>Última actualización</Label>
                <div className="p-2 bg-gray-50 rounded">
                  {format(new Date(shipment.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Link href={`/print-labels/${shipment.id}`} target="_blank">
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Etiquetas
                </Button>
              </Link>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-1" />
                    {isLoading ? "Guardando..." : "Guardar"}
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
