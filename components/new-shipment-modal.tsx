"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { ref, push, get, query, orderByChild, limitToLast } from "firebase/database"
import { rtdb } from "@/lib/firebase"
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
  const [attachments, setAttachments] = useState<string[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const [formData, setFormData] = useState({
    shipmentNumber: "",
    date: new Date(),
    client: "",
    clientAddress: "",
    clientEmail: "",
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
  })

  const [remitType, setRemitType] = useState<"R" | "X" | "RM">("R")
  const [remitNumber, setRemitNumber] = useState("")
  const [invoiceType, setInvoiceType] = useState<"A" | "B" | "E">("A")
  const [invoiceNumber, setInvoiceNumber] = useState("")

  useEffect(() => {
    if (isOpen) {
      fetchClients()
      fetchTransports()
      generateShipmentNumber()
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (remitNumber) {
      if (remitType === "R") {
        setFormData((prev) => ({
          ...prev,
          remitNumber: `${remitType} - 00006 - ${remitNumber}`,
        }))
      } else if (remitType === "X") {
        setFormData((prev) => ({
          ...prev,
          remitNumber: `${remitType} - R00001 - ${remitNumber}`,
        }))
      } else if (remitType === "RM") {
        setFormData((prev) => ({
          ...prev,
          remitNumber: `${remitType} - ${remitNumber}`,
        }))
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        remitNumber: "",
      }))
    }
  }, [remitType, remitNumber])

  useEffect(() => {
    if (invoiceNumber) {
      let prefix = ""
      if (invoiceType === "A") {
        prefix = "A 00001-"
      } else if (invoiceType === "B") {
        prefix = "B 00001-"
      } else if (invoiceType === "E") {
        prefix = "E 00004-"
      }

      setFormData((prev) => ({
        ...prev,
        invoiceNumber: `${prefix}${invoiceNumber}`,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: "",
      }))
    }
  }, [invoiceType, invoiceNumber])

  const resetForm = () => {
    setFormData({
      shipmentNumber: "",
      date: new Date(),
      client: "",
      clientAddress: "",
      clientEmail: "",
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
    })
    setRemitType("R")
    setRemitNumber("")
    setInvoiceType("A")
    setInvoiceNumber("")
    setAttachments([])
  }

  const fetchClients = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
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
      const { collection, getDocs } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
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

  const generateShipmentNumber = async () => {
    try {
      const shipmentsRef = ref(rtdb, "shipments")
      const lastShipmentQuery = query(shipmentsRef, orderByChild("createdAt"), limitToLast(1))
      const snapshot = await get(lastShipmentQuery)

      let nextNumber = 1
      if (snapshot.exists()) {
        const shipments = snapshot.val()
        const lastShipment = Object.values(shipments)[0] as any
        if (lastShipment.shipmentNumber) {
          const match = lastShipment.shipmentNumber.match(/GEM(\d+)/)
          if (match) {
            nextNumber = Number.parseInt(match[1]) + 1
          }
        }
      }

      const shipmentNumber = `GEM${nextNumber.toString().padStart(6, "0")}`
      setFormData((prev) => ({ ...prev, shipmentNumber }))
    } catch (error) {
      console.error("Error generating shipment number:", error)
      const fallbackNumber = `GEM${Date.now().toString().slice(-6)}`
      setFormData((prev) => ({ ...prev, shipmentNumber: fallbackNumber }))
    }
  }

  const handleClientChange = (clientName: string) => {
    const selectedClient = clients.find((c) => c.name === clientName)
    setFormData((prev) => ({
      ...prev,
      client: clientName,
      clientAddress: selectedClient?.address || "",
      clientEmail: selectedClient?.email || "",
    }))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFiles(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const data = await response.json()
          uploadedUrls.push(data.url)
        } else {
          throw new Error(`Error uploading ${file.name}`)
        }
      }

      setAttachments((prev) => [...prev, ...uploadedUrls])
      toast({
        title: "Archivos subidos",
        description: `${uploadedUrls.length} archivo(s) subido(s) correctamente`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Error",
        description: "Error al subir los archivos",
        variant: "destructive",
      })
    } finally {
      setUploadingFiles(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
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
      const shipmentData = {
        ...formData,
        date: formData.date.toISOString(),
        status: "pending" as const,
        attachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const shipmentsRef = ref(rtdb, "shipments")
      await push(shipmentsRef, shipmentData)

      toast({
        title: "Éxito",
        description: "Envío creado correctamente",
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Envío</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipmentNumber">Número de Envío</Label>
              <Input id="shipmentNumber" value={formData.shipmentNumber} readOnly />
            </div>
            <div>
              <Label>Fecha de Despacho</Label>
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

            <div>
              <Label htmlFor="clientEmail">Email del Cliente</Label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))}
                placeholder="email@cliente.com"
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="packages">Bultos</Label>
              <Input
                id="packages"
                type="number"
                min="0"
                value={formData.packages || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, packages: Number.parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min="0"
                value={formData.pallets || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, pallets: Number.parseInt(e.target.value) || 0 }))}
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
                value={formData.weight || ""}
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
                value={formData.declaredValue || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, declaredValue: Number.parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          {/* Document Numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de Factura</Label>
              <div className="flex gap-2">
                <Select value={invoiceType} onValueChange={(value) => setInvoiceType(value as "A" | "B" | "E")}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="invoiceNumber"
                  placeholder="Número"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
              {formData.invoiceNumber && (
                <p className="text-sm text-muted-foreground">Formato: {formData.invoiceNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="remitNumber">Número de Remito</Label>
              <div className="flex gap-2">
                <Select value={remitType} onValueChange={(value) => setRemitType(value as "R" | "X" | "RM")}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">R</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                    <SelectItem value="RM">RM</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="remitNumber"
                  placeholder="Número"
                  value={remitNumber}
                  onChange={(e) => setRemitNumber(e.target.value)}
                  className="flex-1"
                />
              </div>
              {formData.remitNumber && <p className="text-sm text-muted-foreground">Formato: {formData.remitNumber}</p>}
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
          <div className="grid grid-cols-2 gap-4">
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

          {/* File Attachments */}
          <div className="space-y-4">
            <Label>Archivos Adjuntos</Label>
            <div className="flex items-center gap-4">
              <Input type="file" multiple onChange={handleFileUpload} disabled={uploadingFiles} className="flex-1" />
              <Button type="button" disabled={uploadingFiles} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {uploadingFiles ? "Subiendo..." : "Subir"}
              </Button>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{attachment.split("/").pop()}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
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
