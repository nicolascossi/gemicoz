"use client"

import { useState, useEffect } from "react"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Package, Truck, MapPin, FileText, Trash2, Mail, Printer, Eye } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment, Client, Transport } from "@/lib/types"

interface ShipmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  shipment: Shipment | null
  onShipmentUpdated: () => void
  onShipmentDeleted: () => void
}

export default function ShipmentDetailModal({
  isOpen,
  onClose,
  shipment,
  onShipmentUpdated,
  onShipmentDeleted,
}: ShipmentDetailModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [transports, setTransports] = useState<Transport[]>([])
  const [formData, setFormData] = useState<Partial<Shipment>>({})

  useEffect(() => {
    if (shipment && isOpen) {
      setFormData({
        client: shipment.client,
        clientAddress: shipment.clientAddress,
        transport: shipment.transport,
        packages: shipment.packages,
        pallets: shipment.pallets,
        weight: shipment.weight,
        declaredValue: shipment.declaredValue,
        invoiceNumber: shipment.invoiceNumber,
        remitNumber: shipment.remitNumber,
        notes: shipment.notes,
        deliveryNote: shipment.deliveryNote,
        isFragile: shipment.isFragile,
        isUrgent: shipment.isUrgent,
        hasColdChain: shipment.hasColdChain,
        status: shipment.status,
      })
      fetchClients()
      fetchTransports()
    }
  }, [shipment, isOpen])

  const fetchClients = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore")
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
      clientAddress: selectedClient?.address || prev.clientAddress,
    }))
  }

  const handleUpdate = async () => {
    if (!shipment?.id) return

    setLoading(true)
    try {
      const updateData = {
        ...formData,
        packages: formData.packages || 0,
        pallets: formData.pallets || 0,
        weight: formData.weight || 0,
        declaredValue: formData.declaredValue || 0,
      }

      await updateDoc(doc(db, "shipments", shipment.id), updateData)

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
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!shipment?.id) return

    setLoading(true)
    try {
      await deleteDoc(doc(db, "shipments", shipment.id))

      toast({
        title: "Éxito",
        description: "Envío eliminado correctamente",
      })

      onShipmentDeleted()
      onClose()
    } catch (error) {
      console.error("Error deleting shipment:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el envío",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!shipment) return

    setLoading(true)
    try {
      const response = await fetch("/api/send-email-plantilla", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          client: shipment.client,
          transport: shipment.transport,
          packages: shipment.packages,
          pallets: shipment.pallets,
          weight: shipment.weight,
          declaredValue: shipment.declaredValue,
          date: shipment.date,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Email enviado correctamente",
        })
      } else {
        throw new Error("Error al enviar email")
      }
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Error",
        description: "Error al enviar el email",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrintLabels = () => {
    if (shipment?.id) {
      window.open(`/print-labels/${shipment.id}`, "_blank")
    }
  }

  const handleViewTracking = () => {
    if (shipment?.shipmentNumber) {
      window.open(`/pedido/${shipment.shipmentNumber}`, "_blank")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800">Enviado</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "delivered":
        return <Badge className="bg-blue-100 text-blue-800">Entregado</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>
    }
  }

  if (!shipment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">Envío #{shipment.shipmentNumber}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge(shipment.status)}
                <span className="text-sm text-gray-500">
                  {format(new Date(shipment.date), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleViewTracking}>
                <Eye className="h-4 w-4 mr-1" />
                Ver Seguimiento
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintLabels}>
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail} disabled={loading}>
                <Mail className="h-4 w-4 mr-1" />
                Enviar Email
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="edit">Editar</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-semibold">{shipment.client}</p>
                    {shipment.clientAddress && <p className="text-sm text-gray-600">{shipment.clientAddress}</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transporte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{shipment.transport}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalles del Envío
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Bultos</p>
                    <p className="font-semibold">{shipment.packages || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pallets</p>
                    <p className="font-semibold">{shipment.pallets || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Peso (kg)</p>
                    <p className="font-semibold">{shipment.weight || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Valor Declarado</p>
                    <p className="font-semibold">${(shipment.declaredValue || 0).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(shipment.invoiceNumber || shipment.remitNumber) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {shipment.invoiceNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Factura</p>
                        <p className="font-semibold">{shipment.invoiceNumber}</p>
                      </div>
                    )}
                    {shipment.remitNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Remito</p>
                        <p className="font-semibold">{shipment.remitNumber}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(shipment.isFragile || shipment.isUrgent || shipment.hasColdChain) && (
              <Card>
                <CardHeader>
                  <CardTitle>Características Especiales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {shipment.isFragile && <Badge variant="destructive">Frágil</Badge>}
                    {shipment.isUrgent && <Badge className="bg-orange-100 text-orange-800">Urgente</Badge>}
                    {shipment.hasColdChain && <Badge className="bg-blue-100 text-blue-800">Cadena de Frío</Badge>}
                  </div>
                </CardContent>
              </Card>
            )}

            {(shipment.notes || shipment.deliveryNote) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shipment.notes && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Observaciones</p>
                      <p className="text-sm">{shipment.notes}</p>
                    </div>
                  )}
                  {shipment.deliveryNote && (
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Nota de Entrega</p>
                      <p className="text-sm">{shipment.deliveryNote}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-client">Cliente</Label>
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
                <Label htmlFor="edit-transport">Transporte</Label>
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
              <Label htmlFor="edit-clientAddress">Dirección del Cliente</Label>
              <Textarea
                id="edit-clientAddress"
                value={formData.clientAddress || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                placeholder="Dirección de entrega"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-packages">Bultos</Label>
                <Input
                  id="edit-packages"
                  type="number"
                  min="0"
                  value={formData.packages || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, packages: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-pallets">Pallets</Label>
                <Input
                  id="edit-pallets"
                  type="number"
                  min="0"
                  value={formData.pallets || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pallets: Number.parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-weight">Peso (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weight: Number.parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-declaredValue">Valor Declarado ($)</Label>
                <Input
                  id="edit-declaredValue"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-invoiceNumber">Número de Factura</Label>
                <Input
                  id="edit-invoiceNumber"
                  value={formData.invoiceNumber || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-remitNumber">Número de Remito</Label>
                <Input
                  id="edit-remitNumber"
                  value={formData.remitNumber || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value as "pending" | "sent" | "delivered" }))
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

            <div>
              <Label htmlFor="edit-notes">Observaciones</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-deliveryNote">Nota de Entrega</Label>
              <Textarea
                id="edit-deliveryNote"
                value={formData.deliveryNote || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Características Especiales</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isFragile"
                    checked={formData.isFragile || false}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFragile: checked as boolean }))}
                  />
                  <Label htmlFor="edit-isFragile">Frágil</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isUrgent"
                    checked={formData.isUrgent || false}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isUrgent: checked as boolean }))}
                  />
                  <Label htmlFor="edit-isUrgent">Urgente</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-hasColdChain"
                    checked={formData.hasColdChain || false}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, hasColdChain: checked as boolean }))
                    }
                  />
                  <Label htmlFor="edit-hasColdChain">Cadena de Frío</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El envío será eliminado permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading}>
                      {loading ? "Eliminando..." : "Eliminar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdate} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
