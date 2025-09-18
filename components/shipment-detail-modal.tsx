"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Package, Printer, Eye, Save } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Shipment, Client, Transport } from "@/lib/types"
import Link from "next/link"

interface ShipmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shipment: Shipment) => void
  shipment: Shipment | null
  clients: Client[]
  transports: Transport[]
}

export default function ShipmentDetailModal({
  isOpen,
  onClose,
  onSave,
  shipment,
  clients,
  transports,
}: ShipmentDetailModalProps) {
  const [formData, setFormData] = useState<Shipment | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (shipment) {
      setFormData({
        ...shipment,
        date: typeof shipment.date === "string" ? shipment.date : shipment.date.toISOString(),
      })
    }
  }, [shipment])

  const handleClientChange = (clientName: string) => {
    const client = clients.find((c) => c.name === clientName)
    if (formData) {
      setFormData({
        ...formData,
        client: clientName,
        clientAddress: client?.address || formData.clientAddress,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData || !formData.client || !formData.transport) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    onSave(formData)
    setIsEditing(false)
    onClose()
  }

  const handleStatusChange = (status: "pending" | "sent" | "delivered") => {
    if (formData) {
      setFormData({ ...formData, status })
    }
  }

  const validateRemitNumber = (remitNumber: string) => {
    // Validate remit number format: R - 0006-XXXXXXXX
    const remitPattern = /^R - 0006-\d{8}$/
    return remitPattern.test(remitNumber)
  }

  const getTotalLabels = () => {
    if (!formData) return 0

    // Si hay bultos, usar la cantidad de bultos
    if (formData.packages && formData.packages > 0) {
      return formData.packages
    }

    // Si no hay bultos pero hay pallets, usar la cantidad de pallets
    if (formData.pallets && formData.pallets > 0) {
      return formData.pallets
    }

    // Si no hay ni bultos ni pallets, generar al menos 1 etiqueta
    return 1
  }

  const getLabelType = (): "package" | "pallet" => {
    if (!formData) return "package"

    // Si hay bultos, las etiquetas son de bultos
    if (formData.packages && formData.packages > 0) {
      return "package"
    }

    // Si no hay bultos pero hay pallets, las etiquetas son de pallets
    return "pallet"
  }

  if (!formData) return null

  const totalLabels = getTotalLabels()
  const labelType = getLabelType()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Detalle del Envío - {formData.shipmentNumber}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Link href={`/print-labels/${formData.id}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir ({totalLabels})
                    </Button>
                  </Link>
                  <Link href={`/pedido/${formData.shipmentNumber}`} target="_blank">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Seguimiento
                    </Button>
                  </Link>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Label>Estado:</Label>
            <Select value={formData.status} onValueChange={handleStatusChange} disabled={!isEditing}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto text-sm text-gray-600">
              Etiquetas: {totalLabels} {labelType === "pallet" ? "pallet(s)" : "bulto(s)"}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipmentNumber">Número de Envío *</Label>
              <Input
                id="shipmentNumber"
                value={formData.shipmentNumber}
                onChange={(e) => setFormData({ ...formData, shipmentNumber: e.target.value })}
                disabled={!isEditing}
                required
              />
            </div>

            <div>
              <Label htmlFor="date">Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                    disabled={!isEditing}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date), "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.date)}
                    onSelect={(date) => date && setFormData({ ...formData, date: date.toISOString() })}
                    initialFocus
                    disabled={!isEditing}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.client} onValueChange={handleClientChange} disabled={!isEditing}>
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
            </div>

            <div>
              <Label htmlFor="clientAddress">Dirección del Cliente</Label>
              <Textarea
                id="clientAddress"
                value={formData.clientAddress || ""}
                onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                placeholder="Dirección de entrega"
                rows={2}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Transport Information */}
          <div>
            <Label htmlFor="transport">Transporte *</Label>
            <Select
              value={formData.transport}
              onValueChange={(value) => setFormData({ ...formData, transport: value })}
              disabled={!isEditing}
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
          </div>

          {/* Package Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="packages">Bultos</Label>
              <Input
                id="packages"
                type="number"
                min="0"
                value={formData.packages || 0}
                onChange={(e) => setFormData({ ...formData, packages: Number.parseInt(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min="0"
                value={formData.pallets || 0}
                onChange={(e) => setFormData({ ...formData, pallets: Number.parseInt(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight || 0}
                onChange={(e) => setFormData({ ...formData, weight: Number.parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="declaredValue">Valor Declarado ($)</Label>
              <Input
                id="declaredValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.declaredValue || 0}
                onChange={(e) => setFormData({ ...formData, declaredValue: Number.parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber || ""}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="F-001-00000123"
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <Input
                id="remitNumber"
                value={formData.remitNumber || ""}
                onChange={(e) => setFormData({ ...formData, remitNumber: e.target.value })}
                placeholder="R - 0006-00000001"
                disabled={!isEditing}
                className={formData.remitNumber && !validateRemitNumber(formData.remitNumber) ? "border-red-500" : ""}
              />
              {formData.remitNumber && !validateRemitNumber(formData.remitNumber) && (
                <p className="text-sm text-red-500 mt-1">Formato inválido. Use: R - 0006-XXXXXXXX</p>
              )}
            </div>
          </div>

          {/* Special Handling */}
          <div className="space-y-4">
            <Label>Manejo Especial</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={formData.isFragile || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFragile: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="isFragile">Frágil</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUrgent"
                  checked={formData.isUrgent || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, isUrgent: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="isUrgent">Urgente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasColdChain"
                  checked={formData.hasColdChain || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasColdChain: !!checked })}
                  disabled={!isEditing}
                />
                <Label htmlFor="hasColdChain">Cadena de Frío</Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notes">Observaciones</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observaciones adicionales"
                rows={3}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="deliveryNote">Nota de Entrega</Label>
              <Textarea
                id="deliveryNote"
                value={formData.deliveryNote || ""}
                onChange={(e) => setFormData({ ...formData, deliveryNote: e.target.value })}
                placeholder="Instrucciones especiales de entrega"
                rows={3}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <Button type="button" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
