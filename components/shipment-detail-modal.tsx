"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Printer, Trash2, Save, X } from "lucide-react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ref, update, remove, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import type { Shipment, Client, Transport } from "@/lib/types"
import Link from "next/link"

interface ShipmentDetailModalProps {
  shipment: Shipment
  onClose: () => void
  onUpdate?: () => void
  onDelete?: () => void
  showPrintButton?: boolean
}

export default function ShipmentDetailModal({
  shipment,
  onClose,
  onUpdate,
  onDelete,
  showPrintButton = true,
}: ShipmentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [date, setDate] = useState<Date>(new Date(shipment.date))
  const [client, setClient] = useState(shipment.client)
  const [clientAddress, setClientAddress] = useState(shipment.clientAddress || "")
  const [clientCity, setClientCity] = useState(shipment.clientCity || "")
  const [clientProvince, setClientProvince] = useState(shipment.clientProvince || "")
  const [clientPostalCode, setClientPostalCode] = useState(shipment.clientPostalCode || "")
  const [clientPhone, setClientPhone] = useState(shipment.clientPhone || "")
  const [transport, setTransport] = useState(shipment.transport)
  const [packages, setPackages] = useState(shipment.packages?.toString() || "")
  const [pallets, setPallets] = useState((shipment as any).pallets?.toString() || "")
  const [weight, setWeight] = useState(shipment.weight?.toString() || "")
  const [declaredValue, setDeclaredValue] = useState(shipment.declaredValue?.toString() || "")
  const [shippingCost, setShippingCost] = useState((shipment as any).shippingCost?.toString() || "")
  const [invoiceNumber, setInvoiceNumber] = useState(shipment.invoiceNumber || "")
  const [remitNumber, setRemitNumber] = useState(shipment.remitNumber || "")
  const [deliveryNote, setDeliveryNote] = useState(shipment.deliveryNote || "")
  const [orderNote, setOrderNote] = useState(shipment.orderNote || "")
  const [notes, setNotes] = useState(shipment.notes || "")
  const [status, setStatus] = useState(shipment.status)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    if (isEditing) {
      fetchClients()
      fetchTransports()
    }
  }, [isEditing])

  const fetchClients = async () => {
    try {
      const clientsRef = ref(rtdb, "clients")
      const snapshot = await get(clientsRef)
      if (snapshot.exists()) {
        const clientsData = snapshot.val()
        const clientsList = Object.keys(clientsData).map((key) => ({
          id: key,
          ...clientsData[key],
        }))
        setClients(clientsList)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchTransports = async () => {
    try {
      const transportsRef = ref(rtdb, "transports")
      const snapshot = await get(transportsRef)
      if (snapshot.exists()) {
        const transportsData = snapshot.val()
        const transportsList = Object.keys(transportsData).map((key) => ({
          id: key,
          ...transportsData[key],
        }))
        setTransports(transportsList)
      }
    } catch (error) {
      console.error("Error fetching transports:", error)
    }
  }

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId)
    if (selectedClient) {
      setClient(selectedClient.businessName)
      setClientAddress(selectedClient.address || "")
      setClientCity(selectedClient.city || "")
      setClientProvince(selectedClient.province || "")
      setClientPostalCode(selectedClient.postalCode || "")
      setClientPhone(selectedClient.phone || "")
    }
  }

  const handleTransportSelect = (transportId: string) => {
    const selectedTransport = transports.find((t) => t.id === transportId)
    if (selectedTransport) {
      setTransport(selectedTransport.name)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      const updatedData = {
        date: date.toISOString(),
        client,
        clientAddress,
        clientCity,
        clientProvince,
        clientPostalCode,
        clientPhone,
        transport,
        packages: packages ? Number.parseInt(packages) : 0,
        pallets: pallets ? Number.parseInt(pallets) : 0,
        weight: weight ? Number.parseFloat(weight) : 0,
        declaredValue: declaredValue ? Number.parseFloat(declaredValue) : 0,
        shippingCost: shippingCost ? Number.parseFloat(shippingCost) : 0,
        invoiceNumber,
        remitNumber,
        deliveryNote,
        orderNote,
        notes,
        status,
        updatedAt: new Date().toISOString(),
      }

      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      await update(shipmentRef, updatedData)

      toast({
        title: "Envío actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      })

      setIsEditing(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Error updating shipment:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el envío. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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

      toast({
        title: "Envío eliminado",
        description: "El envío ha sido eliminado exitosamente.",
      })

      if (onDelete) onDelete()
      onClose()
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalles del Envío - {shipment.shipmentNumber}</DialogTitle>
            <div className="flex space-x-2">
              {showPrintButton && (
                <Link href={`/print-labels/${shipment.id}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </Link>
              )}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} size="sm">
                  Editar
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={isSubmitting} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              {isEditing ? (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        if (newDate) {
                          setDate(newDate)
                          setIsCalendarOpen(false)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="p-2 bg-gray-50 rounded">{format(parseISO(shipment.date), "PPP", { locale: es })}</div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              {isEditing ? (
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 bg-gray-50 rounded">{status === "sent" ? "Enviado" : "Pendiente"}</div>
              )}
            </div>
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            {isEditing ? (
              <Select onValueChange={handleClientSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={client || "Seleccionar cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((clientItem) => (
                    <SelectItem key={clientItem.id} value={clientItem.id}>
                      {clientItem.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 bg-gray-50 rounded">{client}</div>
            )}
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Dirección del Cliente</Label>
              {isEditing ? (
                <Input
                  id="clientAddress"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{clientAddress || "No especificada"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCity">Ciudad</Label>
              {isEditing ? (
                <Input
                  id="clientCity"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="Ciudad"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{clientCity || "No especificada"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientProvince">Provincia</Label>
              {isEditing ? (
                <Input
                  id="clientProvince"
                  value={clientProvince}
                  onChange={(e) => setClientProvince(e.target.value)}
                  placeholder="Provincia"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{clientProvince || "No especificada"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPostalCode">Código Postal</Label>
              {isEditing ? (
                <Input
                  id="clientPostalCode"
                  value={clientPostalCode}
                  onChange={(e) => setClientPostalCode(e.target.value)}
                  placeholder="Código Postal"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{clientPostalCode || "No especificado"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono</Label>
              {isEditing ? (
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Teléfono"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{clientPhone || "No especificado"}</div>
              )}
            </div>
          </div>

          {/* Transport */}
          <div className="space-y-2">
            <Label htmlFor="transport">Transporte</Label>
            {isEditing ? (
              <Select onValueChange={handleTransportSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={transport || "Seleccionar transporte"} />
                </SelectTrigger>
                <SelectContent>
                  {transports.map((transportItem) => (
                    <SelectItem key={transportItem.id} value={transportItem.id}>
                      {transportItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-2 bg-gray-50 rounded">{transport}</div>
            )}
          </div>

          {/* Package Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packages">Bultos</Label>
              {isEditing ? (
                <Input
                  id="packages"
                  type="number"
                  value={packages}
                  onChange={(e) => setPackages(e.target.value)}
                  placeholder="Número de bultos"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{packages || "0"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pallets">Pallets</Label>
              {isEditing ? (
                <Input
                  id="pallets"
                  type="number"
                  value={pallets}
                  onChange={(e) => setPallets(e.target.value)}
                  placeholder="Número de pallets"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{pallets || "0"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              {isEditing ? (
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Peso en kg"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{weight || "0"} kg</div>
              )}
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="declaredValue">Valor Declarado</Label>
              {isEditing ? (
                <Input
                  id="declaredValue"
                  type="number"
                  step="0.01"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="Valor declarado"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">${declaredValue || "0.00"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Costo de Envío</Label>
              {isEditing ? (
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="Costo de envío"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">${shippingCost || "0.00"}</div>
              )}
            </div>
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              {isEditing ? (
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Número de factura"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{invoiceNumber || "No especificado"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="remitNumber">Número de Remito</Label>
              {isEditing ? (
                <Input
                  id="remitNumber"
                  value={remitNumber}
                  onChange={(e) => setRemitNumber(e.target.value)}
                  placeholder="Número de remito"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{remitNumber || "No especificado"}</div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryNote">Nota de Entrega</Label>
              {isEditing ? (
                <Input
                  id="deliveryNote"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Nota de entrega"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{deliveryNote || "No especificada"}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNote">Nota de Pedido</Label>
              {isEditing ? (
                <Input
                  id="orderNote"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Nota de pedido"
                />
              ) : (
                <div className="p-2 bg-gray-50 rounded">{orderNote || "No especificada"}</div>
              )}
            </div>
          </div>

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales"
                rows={3}
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded min-h-[80px]">{notes || "Sin observaciones"}</div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
