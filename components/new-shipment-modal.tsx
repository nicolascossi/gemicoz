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
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Shipment, Client, Transport } from "@/lib/types"

interface NewShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shipment: Omit<Shipment, "id">) => void
  clients: Client[]
  transports: Transport[]
}

export default function NewShipmentModal({ isOpen, onClose, onSave, clients, transports }: NewShipmentModalProps) {
  const [formData, setFormData] = useState({
    shipmentNumber: "",
    client: "",
    clientAddress: "",
    transport: "",
    date: new Date(),
    packages: 0,
    pallets: 0,
    weight: 0,
    declaredValue: 0,
    status: "pending" as const,
    invoiceNumber: "",
    remitNumber: "",
    notes: "",
    deliveryNote: "",
    isFragile: false,
    isUrgent: false,
    hasColdChain: false,
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Generate shipment number on modal open
  useEffect(() => {
    if (isOpen) {
      const generateShipmentNumber = () => {
        const year = new Date().getFullYear()
        const month = String(new Date().getMonth() + 1).padStart(2, "0")
        const day = String(new Date().getDate()).padStart(2, "0")
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")
        return `GEM-${year}${month}${day}-${random}`
      }

      const generateRemitNumber = () => {
        const year = new Date().getFullYear()
        const random = Math.floor(Math.random() * 100000)
          .toString()
          .padStart(8, "0")
        return `R - 0006-${random}`
      }

      setFormData((prev) => ({
        ...prev,
        shipmentNumber: generateShipmentNumber(),
        remitNumber: generateRemitNumber(),
      }))
    }
  }, [isOpen])

  const handleClientChange = (clientName: string) => {
    const client = clients.find((c) => c.name === clientName)
    setSelectedClient(client || null)
    setFormData((prev) => ({
      ...prev,
      client: clientName,
      clientAddress: client?.address || "",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.client || !formData.transport) {
      alert("Por favor complete los campos obligatorios")
      return
    }

    onSave({
      ...formData,
      date: formData.date.toISOString(),
    })

    // Reset form
    setFormData({
      shipmentNumber: "",
      client: "",
      clientAddress: "",
      transport: "",
      date: new Date(),
      packages: 0,
      pallets: 0,
      weight: 0,
      declaredValue: 0,
      status: "pending",
      invoiceNumber: "",
      remitNumber: "",
      notes: "",
      deliveryNote: "",
      isFragile: false,
      isUrgent: false,
      hasColdChain: false,
    })
    setSelectedClient(null)
    onClose()
  }

  const handleClose = () => {
    setFormData({
      shipmentNumber: "",
      client: "",
      clientAddress: "",
      transport: "",
      date: new Date(),
      packages: 0,
      pallets: 0,
      weight: 0,
      declaredValue: 0,
      status: "pending",
      invoiceNumber: "",
      remitNumber: "",
      notes: "",
      deliveryNote: "",
      isFragile: false,
      isUrgent: false,
      hasColdChain: false,
    })
    setSelectedClient(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Envío
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipmentNumber">Número de Envío *</Label>
              <Input
                id="shipmentNumber"
                value={formData.shipmentNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, shipmentNumber: e.target.value }))}
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
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.client} onValueChange={handleClientChange}>
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
                value={formData.clientAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                placeholder="Dirección de entrega"
                rows={2}
              />
            </div>
          </div>

          {/* Transport Information */}
          <div>
            <Label htmlFor="transport">Transporte *</Label>
            <Select
              value={formData.transport}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, transport: value }))}
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
                value={formData.packages}
                onChange={(e) => setFormData((prev) => ({ ...prev, packages: Number.parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min="0"
                value={formData.pallets}
                onChange={(e) => setFormData((prev) => ({ ...prev, pallets: Number.parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="declaredValue">Valor Declarado ($)</Label>
              <Input
                id="declaredValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.declaredValue}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, declaredValue: Number.parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="F-001-00000123"
              />
            </div>

            <div>
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <Input
                id="remitNumber"
                value={formData.remitNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                placeholder="R - 0006-00000001"
              />
            </div>
          </div>

          {/* Special Handling */}
          <div className="space-y-4">
            <Label>Manejo Especial</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={formData.isFragile}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFragile: !!checked }))}
                />
                <Label htmlFor="isFragile">Frágil</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isUrgent: !!checked }))}
                />
                <Label htmlFor="isUrgent">Urgente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasColdChain"
                  checked={formData.hasColdChain}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasColdChain: !!checked }))}
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
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones adicionales"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="deliveryNote">Nota de Entrega</Label>
              <Textarea
                id="deliveryNote"
                value={formData.deliveryNote}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                placeholder="Instrucciones especiales de entrega"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">Crear Envío</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
