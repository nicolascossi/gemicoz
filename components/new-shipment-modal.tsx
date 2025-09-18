"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Calendar } from "lucide-react"
import { ref, push, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"
import type { Client, Transport } from "@/lib/types"

interface NewShipmentModalProps {
  onShipmentCreated: () => void
}

export default function NewShipmentModal({ onShipmentCreated }: NewShipmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    client: "",
    clientAddress: "",
    transport: "",
    date: format(new Date(), "yyyy-MM-dd"),
    packages: 0,
    pallets: 0,
    weight: 0,
    declaredValue: 0,
    invoiceNumber: "",
    remitNumber: "",
    notes: "",
    deliveryNote: "",
    hasColdChain: false,
    isUrgent: false,
    isFragile: false,
  })

  useEffect(() => {
    const fetchData = async () => {
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
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, toast])

  const generateShipmentNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const time = now.getTime().toString().slice(-6)
    return `GEM${year}${month}${day}${time}`
  }

  const generateRemitNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const sequence = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `R - 0006-${year}${month}-${sequence}`
  }

  const handleClientChange = (clientName: string) => {
    const selectedClient = clients.find((c) => c.name === clientName)
    setFormData((prev) => ({
      ...prev,
      client: clientName,
      clientAddress: selectedClient?.address || "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const shipmentNumber = generateShipmentNumber()
      const remitNumber = formData.remitNumber || generateRemitNumber()

      const shipmentData = {
        ...formData,
        shipmentNumber,
        remitNumber,
        status: "pending",
        createdAt: new Date().toISOString(),
        packages: Number(formData.packages),
        pallets: Number(formData.pallets),
        weight: Number(formData.weight),
        declaredValue: Number(formData.declaredValue),
      }

      const shipmentsRef = ref(rtdb, "shipments")
      await push(shipmentsRef, shipmentData)

      toast({
        title: "Éxito",
        description: `Envío ${shipmentNumber} creado correctamente`,
      })

      setFormData({
        client: "",
        clientAddress: "",
        transport: "",
        date: format(new Date(), "yyyy-MM-dd"),
        packages: 0,
        pallets: 0,
        weight: 0,
        declaredValue: 0,
        invoiceNumber: "",
        remitNumber: "",
        notes: "",
        deliveryNote: "",
        hasColdChain: false,
        isUrgent: false,
        isFragile: false,
      })

      setIsOpen(false)
      onShipmentCreated()
    } catch (error) {
      console.error("Error creating shipment:", error)
      toast({
        title: "Error",
        description: "Error al crear el envío",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Envío
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Envío</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente *</Label>
              <Select value={formData.client} onValueChange={handleClientChange} required>
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
              <Label htmlFor="transport">Transporte *</Label>
              <Select
                value={formData.transport}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, transport: value }))}
                required
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Fecha *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
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
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="packages">Cantidad de Bultos</Label>
              <Input
                id="packages"
                type="number"
                min="0"
                value={formData.packages}
                onChange={(e) => setFormData((prev) => ({ ...prev, packages: Number.parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="pallets">Cantidad de Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min="0"
                value={formData.pallets}
                onChange={(e) => setFormData((prev) => ({ ...prev, pallets: Number.parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
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
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, declaredValue: Number.parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Ej: FC-001-00001234"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="remitNumber">Número de Remito</Label>
            <Input
              id="remitNumber"
              value={formData.remitNumber}
              onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
              placeholder="Se generará automáticamente si se deja vacío"
            />
            <p className="text-xs text-gray-500 mt-1">Formato sugerido: R - 0006-YYMM-XXX</p>
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

          <div>
            <Label htmlFor="deliveryNote">Nota de Entrega</Label>
            <Textarea
              id="deliveryNote"
              value={formData.deliveryNote}
              onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
              placeholder="Instrucciones especiales para la entrega"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Características Especiales</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasColdChain"
                checked={formData.hasColdChain}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasColdChain: checked as boolean }))}
              />
              <Label htmlFor="hasColdChain" className="text-sm font-normal">
                Cadena de frío
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isUrgent"
                checked={formData.isUrgent}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isUrgent: checked as boolean }))}
              />
              <Label htmlFor="isUrgent" className="text-sm font-normal">
                Urgente
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFragile"
                checked={formData.isFragile}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFragile: checked as boolean }))}
              />
              <Label htmlFor="isFragile" className="text-sm font-normal">
                Frágil
              </Label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Envío"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
