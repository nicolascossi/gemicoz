"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { Client, Transport } from "@/lib/types"

interface NewShipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onShipmentCreated: () => void
}

export default function NewShipmentModal({ isOpen, onClose, onShipmentCreated }: NewShipmentModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [formData, setFormData] = useState({
    client: "",
    clientAddress: "",
    transport: "",
    packages: "",
    pallets: "",
    weight: "",
    declaredValue: "",
    invoiceNumber: "",
    remitNumber: "",
    notes: "",
    deliveryNote: "",
    isFragile: false,
    isUrgent: false,
    hasColdChain: false,
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

  const generateShipmentNumber = async (): Promise<string> => {
    try {
      const q = query(collection(db, "shipments"), orderBy("shipmentNumber", "desc"), limit(1))
      const querySnapshot = await getDocs(q)

      let lastNumber = 0
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0]
        const lastShipmentNumber = lastDoc.data().shipmentNumber
        const match = lastShipmentNumber.match(/GEM(\d+)/)
        if (match) {
          lastNumber = Number.parseInt(match[1])
        }
      }

      const newNumber = lastNumber + 1
      return `GEM${newNumber.toString().padStart(6, "0")}`
    } catch (error) {
      console.error("Error generating shipment number:", error)
      return `GEM${Date.now().toString().slice(-6)}`
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

    setLoading(true)

    try {
      const shipmentNumber = await generateShipmentNumber()

      const shipmentData = {
        shipmentNumber,
        client: formData.client,
        clientAddress: formData.clientAddress,
        transport: formData.transport,
        packages: formData.packages ? Number.parseInt(formData.packages) : 0,
        pallets: formData.pallets ? Number.parseInt(formData.pallets) : 0,
        weight: formData.weight ? Number.parseFloat(formData.weight) : 0,
        declaredValue: formData.declaredValue ? Number.parseFloat(formData.declaredValue) : 0,
        invoiceNumber: formData.invoiceNumber,
        remitNumber: formData.remitNumber,
        notes: formData.notes,
        deliveryNote: formData.deliveryNote,
        isFragile: formData.isFragile,
        isUrgent: formData.isUrgent,
        hasColdChain: formData.hasColdChain,
        status: "pending",
        date: Timestamp.now(),
        createdAt: Timestamp.now(),
      }

      await addDoc(collection(db, "shipments"), shipmentData)

      toast({
        title: "Éxito",
        description: `Envío ${shipmentNumber} creado correctamente`,
      })

      // Reset form
      setFormData({
        client: "",
        clientAddress: "",
        transport: "",
        packages: "",
        pallets: "",
        weight: "",
        declaredValue: "",
        invoiceNumber: "",
        remitNumber: "",
        notes: "",
        deliveryNote: "",
        isFragile: false,
        isUrgent: false,
        hasColdChain: false,
      })

      onShipmentCreated()
      onClose()
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="packages">Bultos</Label>
              <Input
                id="packages"
                type="number"
                min="0"
                value={formData.packages}
                onChange={(e) => setFormData((prev) => ({ ...prev, packages: e.target.value }))}
                placeholder="Número de bultos"
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
                placeholder="Número de pallets"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                placeholder="Peso total"
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
                onChange={(e) => setFormData((prev) => ({ ...prev, declaredValue: e.target.value }))}
                placeholder="Valor declarado"
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
                placeholder="Número de factura"
              />
            </div>

            <div>
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <Input
                id="remitNumber"
                value={formData.remitNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                placeholder="Número de remito"
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
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Características Especiales</Label>
            <div className="flex flex-col space-y-2">
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
