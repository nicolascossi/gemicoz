"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ref, push, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import type { Client, Transport } from "@/lib/types"

interface NewShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onShipmentCreated: () => void
}

export default function NewShipmentModal({ isOpen, onClose, onShipmentCreated }: NewShipmentModalProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [client, setClient] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [clientCity, setClientCity] = useState("")
  const [clientProvince, setClientProvince] = useState("")
  const [clientPostalCode, setClientPostalCode] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [transport, setTransport] = useState("")
  const [packages, setPackages] = useState("")
  const [pallets, setPallets] = useState("")
  const [weight, setWeight] = useState("")
  const [declaredValue, setDeclaredValue] = useState("")
  const [shippingCost, setShippingCost] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [remitNumber, setRemitNumber] = useState("")
  const [deliveryNote, setDeliveryNote] = useState("")
  const [orderNote, setOrderNote] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("pending")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchTransports()
    }
  }, [isOpen])

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

  const generateShipmentNumber = async () => {
    try {
      const shipmentsRef = ref(rtdb, "shipments")
      const snapshot = await get(shipmentsRef)

      let maxNumber = 0
      if (snapshot.exists()) {
        const shipments = snapshot.val()
        Object.values(shipments).forEach((shipment: any) => {
          if (shipment.shipmentNumber) {
            const number = Number.parseInt(shipment.shipmentNumber.replace("ENV-", ""))
            if (number > maxNumber) {
              maxNumber = number
            }
          }
        })
      }

      return `ENV-${(maxNumber + 1).toString().padStart(6, "0")}`
    } catch (error) {
      console.error("Error generating shipment number:", error)
      return `ENV-${Date.now().toString().slice(-6)}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const shipmentNumber = await generateShipmentNumber()

      const shipmentData = {
        shipmentNumber,
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
        createdAt: new Date().toISOString(),
        remitoTriplicado: false,
      }

      const shipmentsRef = ref(rtdb, "shipments")
      await push(shipmentsRef, shipmentData)

      toast({
        title: "Envío creado",
        description: `El envío ${shipmentNumber} ha sido creado exitosamente.`,
      })

      // Reset form
      setDate(new Date())
      setClient("")
      setClientAddress("")
      setClientCity("")
      setClientProvince("")
      setClientPostalCode("")
      setClientPhone("")
      setTransport("")
      setPackages("")
      setPallets("")
      setWeight("")
      setDeclaredValue("")
      setShippingCost("")
      setInvoiceNumber("")
      setRemitNumber("")
      setDeliveryNote("")
      setOrderNote("")
      setNotes("")
      setStatus("pending")

      onShipmentCreated()
      onClose()
    } catch (error) {
      console.error("Error creating shipment:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el envío. Por favor, intente de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Envío</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
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
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Select onValueChange={handleClientSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.businessName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientAddress">Dirección del Cliente</Label>
              <Input
                id="clientAddress"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Dirección"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCity">Ciudad</Label>
              <Input
                id="clientCity"
                value={clientCity}
                onChange={(e) => setClientCity(e.target.value)}
                placeholder="Ciudad"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientProvince">Provincia</Label>
              <Input
                id="clientProvince"
                value={clientProvince}
                onChange={(e) => setClientProvince(e.target.value)}
                placeholder="Provincia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPostalCode">Código Postal</Label>
              <Input
                id="clientPostalCode"
                value={clientPostalCode}
                onChange={(e) => setClientPostalCode(e.target.value)}
                placeholder="Código Postal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Teléfono"
              />
            </div>
          </div>

          {/* Transport Selection */}
          <div className="space-y-2">
            <Label htmlFor="transport">Transporte</Label>
            <Select onValueChange={handleTransportSelect}>
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

          {/* Package Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="packages">Bultos</Label>
              <Input
                id="packages"
                type="number"
                value={packages}
                onChange={(e) => setPackages(e.target.value)}
                placeholder="Número de bultos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                value={pallets}
                onChange={(e) => setPallets(e.target.value)}
                placeholder="Número de pallets"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Peso en kg"
              />
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="declaredValue">Valor Declarado</Label>
              <Input
                id="declaredValue"
                type="number"
                step="0.01"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(e.target.value)}
                placeholder="Valor declarado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCost">Costo de Envío</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="Costo de envío"
              />
            </div>
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Número de factura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <Input
                id="remitNumber"
                value={remitNumber}
                onChange={(e) => setRemitNumber(e.target.value)}
                placeholder="Número de remito"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryNote">Nota de Entrega</Label>
              <Input
                id="deliveryNote"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Nota de entrega"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderNote">Nota de Pedido</Label>
              <Input
                id="orderNote"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Nota de pedido"
              />
            </div>
          </div>

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Envío"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
