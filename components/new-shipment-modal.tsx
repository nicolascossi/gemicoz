"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import { generateShipmentNumber } from "@/lib/shipment-utils"

interface NewShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onShipmentCreated: () => void
}

interface Client {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

interface Transport {
  id: string
  name: string
  contact: string
  phone: string
}

export default function NewShipmentModal({ isOpen, onClose, onShipmentCreated }: NewShipmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])

  const [formData, setFormData] = useState({
    client: "",
    clientAddress: "",
    transport: "",
    packages: 0,
    pallets: 0,
    weight: 0,
    declaredValue: 0,
    invoiceNumber: "",
    remitNumber: "",
    notes: "",
    deliveryNote: "",
    isFragile: false,
    isUrgent: false,
    hasColdChain: false,
    status: "pending" as "pending" | "sent" | "delivered",
  })

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchTransports()
    }
  }, [isOpen])

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"))
      const clientsData: Client[] = []
      querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as Client)
      })
      setClients(clientsData)
    } catch (error) {
      console.error("Error fetching clients:", error)
    }
  }

  const fetchTransports = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "transports"))
      const transportsData: Transport[] = []
      querySnapshot.forEach((doc) => {
        transportsData.push({ id: doc.id, ...doc.data() } as Transport)
      })
      setTransports(transportsData)
    } catch (error) {
      console.error("Error fetching transports:", error)
    }
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

    if (!formData.client || !formData.transport) {
      toast({
        title: "Error",
        description: "Cliente y transporte son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (formData.packages === 0 && formData.pallets === 0) {
      toast({
        title: "Error",
        description: "Debe especificar al menos 1 bulto o 1 pallet",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const shipmentNumber = await generateShipmentNumber()

      const shipmentData = {
        ...formData,
        shipmentNumber,
        date: Timestamp.fromDate(new Date()),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      }

      await addDoc(collection(db, "shipments"), shipmentData)

      toast({
        title: "Éxito",
        description: `Envío ${shipmentNumber} creado correctamente`,
      })

      onShipmentCreated()
      onClose()

      // Reset form
      setFormData({
        client: "",
        clientAddress: "",
        transport: "",
        packages: 0,
        pallets: 0,
        weight: 0,
        declaredValue: 0,
        invoiceNumber: "",
        remitNumber: "",
        notes: "",
        deliveryNote: "",
        isFragile: false,
        isUrgent: false,
        hasColdChain: false,
        status: "pending",
      })
    } catch (error) {
      console.error("Error creating shipment:", error)
      toast({
        title: "Error",
        description: "Error al crear el envío",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Envío</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-4 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Ej: 001-001-00001234"
              />
            </div>

            <div>
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <Input
                id="remitNumber"
                value={formData.remitNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                placeholder="Ej: 001-001-00001234"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Observaciones adicionales"
              rows={2}
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

          <div className="space-y-2">
            <Label>Características Especiales</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={formData.isFragile}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFragile: checked as boolean }))}
                />
                <Label htmlFor="isFragile">Frágil</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUrgent"
                  checked={formData.isUrgent}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isUrgent: checked as boolean }))}
                />
                <Label htmlFor="isUrgent">Urgente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasColdChain"
                  checked={formData.hasColdChain}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, hasColdChain: checked as boolean }))}
                />
                <Label htmlFor="hasColdChain">Cadena de Frío</Label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "sent" | "delivered") =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Envío"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
