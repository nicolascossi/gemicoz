"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"
import type { Shipment } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Package, Truck, MapPin, Calendar, FileText, Edit, Trash2, Mail, Printer, Save, X } from "lucide-react"

interface ShipmentDetailModalProps {
  shipment: Shipment
  isOpen: boolean
  onClose: () => void
}

export default function ShipmentDetailModal({ shipment, isOpen, onClose }: ShipmentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  const [editData, setEditData] = useState({
    client: shipment.client,
    clientAddress: shipment.clientAddress || "",
    transport: shipment.transport,
    packages: shipment.packages || 0,
    pallets: shipment.pallets || 0,
    weight: shipment.weight || 0,
    declaredValue: shipment.declaredValue || 0,
    invoiceNumber: shipment.invoiceNumber || "",
    remitNumber: shipment.remitNumber || "",
    notes: shipment.notes || "",
    deliveryNote: shipment.deliveryNote || "",
    isFragile: shipment.isFragile || false,
    isUrgent: shipment.isUrgent || false,
    hasColdChain: shipment.hasColdChain || false,
    status: shipment.status,
  })

  const handleSave = async () => {
    if (!editData.client || !editData.transport) {
      toast({
        title: "Error",
        description: "Cliente y transporte son obligatorios",
        variant: "destructive",
      })
      return
    }

    if (editData.packages === 0 && editData.pallets === 0) {
      toast({
        title: "Error",
        description: "Debe especificar al menos 1 bulto o 1 pallet",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const shipmentRef = doc(db, "shipments", shipment.id)
      await updateDoc(shipmentRef, {
        ...editData,
        updatedAt: Timestamp.fromDate(new Date()),
      })

      toast({
        title: "Éxito",
        description: "Envío actualizado correctamente",
      })

      setIsEditing(false)
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
    if (!confirm("¿Estás seguro de que quieres eliminar este envío?")) {
      return
    }

    setLoading(true)

    try {
      await deleteDoc(doc(db, "shipments", shipment.id))

      toast({
        title: "Éxito",
        description: "Envío eliminado correctamente",
      })

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
    setEmailLoading(true)

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
          packages: shipment.packages || 0,
          pallets: shipment.pallets || 0,
          weight: shipment.weight || 0,
          date: shipment.date,
          status: shipment.status,
          invoiceNumber: shipment.invoiceNumber,
          remitNumber: shipment.remitNumber,
          notes: shipment.notes,
          deliveryNote: shipment.deliveryNote,
          isFragile: shipment.isFragile,
          isUrgent: shipment.isUrgent,
          hasColdChain: shipment.hasColdChain,
          declaredValue: shipment.declaredValue,
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
      setEmailLoading(false)
    }
  }

  const handlePrintLabel = () => {
    window.open(`/print-labels/${shipment.id}`, "_blank")
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-blue-600">Envío #{shipment.shipmentNumber}</DialogTitle>
            {getStatusBadge(isEditing ? editData.status : shipment.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5 text-blue-600" />
                Cliente
              </div>
              {isEditing ? (
                <Input
                  value={editData.client}
                  onChange={(e) => setEditData((prev) => ({ ...prev, client: e.target.value }))}
                  placeholder="Nombre del cliente"
                />
              ) : (
                <p className="text-gray-900 font-medium">{shipment.client}</p>
              )}

              <div className="text-sm font-medium text-gray-600">Dirección:</div>
              {isEditing ? (
                <Textarea
                  value={editData.clientAddress}
                  onChange={(e) => setEditData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                  placeholder="Dirección del cliente"
                  rows={2}
                />
              ) : (
                <p className="text-gray-700">{shipment.clientAddress || "No especificada"}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="h-5 w-5 text-blue-600" />
                Transporte
              </div>
              {isEditing ? (
                <Input
                  value={editData.transport}
                  onChange={(e) => setEditData((prev) => ({ ...prev, transport: e.target.value }))}
                  placeholder="Nombre del transporte"
                />
              ) : (
                <p className="text-gray-900 font-medium">{shipment.transport}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Fecha: {format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</span>
              </div>
            </div>
          </div>

          {/* Detalles del envío */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              Detalles del Envío
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>Bultos</Label>
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
                  <p className="text-lg font-semibold">{shipment.packages || 0}</p>
                )}
              </div>

              <div>
                <Label>Pallets</Label>
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
                  <p className="text-lg font-semibold">{shipment.pallets || 0}</p>
                )}
              </div>

              <div>
                <Label>Peso (kg)</Label>
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
                  <p className="text-lg font-semibold">
                    {shipment.weight ? `${shipment.weight} kg` : "No especificado"}
                  </p>
                )}
              </div>

              <div>
                <Label>Valor Declarado</Label>
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
                  <p className="text-lg font-semibold">
                    ${shipment.declaredValue ? shipment.declaredValue.toFixed(2) : "0.00"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Documentos */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 text-lg font-semibold mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              Documentos
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Número de Factura</Label>
                {isEditing ? (
                  <Input
                    value={editData.invoiceNumber}
                    onChange={(e) => setEditData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="Ej: 001-001-00001234"
                  />
                ) : (
                  <p className="text-gray-900">{shipment.invoiceNumber || "No especificado"}</p>
                )}
              </div>

              <div>
                <Label>Número de Remito</Label>
                {isEditing ? (
                  <Input
                    value={editData.remitNumber}
                    onChange={(e) => setEditData((prev) => ({ ...prev, remitNumber: e.target.value }))}
                    placeholder="Ej: 001-001-00001234"
                  />
                ) : (
                  <p className="text-gray-900">{shipment.remitNumber || "No especificado"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Características especiales */}
          <div className="border-t pt-6">
            <div className="text-lg font-semibold mb-4">Características Especiales</div>

            {isEditing ? (
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isFragile"
                    checked={editData.isFragile}
                    onCheckedChange={(checked) => setEditData((prev) => ({ ...prev, isFragile: checked as boolean }))}
                  />
                  <Label htmlFor="edit-isFragile">Frágil</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isUrgent"
                    checked={editData.isUrgent}
                    onCheckedChange={(checked) => setEditData((prev) => ({ ...prev, isUrgent: checked as boolean }))}
                  />
                  <Label htmlFor="edit-isUrgent">Urgente</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-hasColdChain"
                    checked={editData.hasColdChain}
                    onCheckedChange={(checked) =>
                      setEditData((prev) => ({ ...prev, hasColdChain: checked as boolean }))
                    }
                  />
                  <Label htmlFor="edit-hasColdChain">Cadena de Frío</Label>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {shipment.isFragile && <Badge className="bg-red-100 text-red-800">Frágil</Badge>}
                {shipment.isUrgent && <Badge className="bg-yellow-100 text-yellow-800">Urgente</Badge>}
                {shipment.hasColdChain && <Badge className="bg-blue-100 text-blue-800">Cadena de Frío</Badge>}
                {!shipment.isFragile && !shipment.isUrgent && !shipment.hasColdChain && (
                  <span className="text-gray-500">Ninguna característica especial</span>
                )}
              </div>
            )}
          </div>

          {/* Estado */}
          {isEditing && (
            <div className="border-t pt-6">
              <Label>Estado</Label>
              <Select
                value={editData.status}
                onValueChange={(value: "pending" | "sent" | "delivered") =>
                  setEditData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-full">
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

          {/* Observaciones */}
          <div className="border-t pt-6">
            <div className="text-lg font-semibold mb-4">Observaciones</div>

            <div className="space-y-4">
              <div>
                <Label>Notas Generales</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observaciones adicionales"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{shipment.notes || "Sin observaciones"}</p>
                )}
              </div>

              <div>
                <Label>Nota de Entrega</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.deliveryNote}
                    onChange={(e) => setEditData((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                    placeholder="Instrucciones especiales para la entrega"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{shipment.deliveryNote || "Sin instrucciones especiales"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="border-t pt-6">
            <div className="flex flex-wrap gap-2 justify-end">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditData({
                        client: shipment.client,
                        clientAddress: shipment.clientAddress || "",
                        transport: shipment.transport,
                        packages: shipment.packages || 0,
                        pallets: shipment.pallets || 0,
                        weight: shipment.weight || 0,
                        declaredValue: shipment.declaredValue || 0,
                        invoiceNumber: shipment.invoiceNumber || "",
                        remitNumber: shipment.remitNumber || "",
                        notes: shipment.notes || "",
                        deliveryNote: shipment.deliveryNote || "",
                        isFragile: shipment.isFragile || false,
                        isUrgent: shipment.isUrgent || false,
                        hasColdChain: shipment.hasColdChain || false,
                        status: shipment.status,
                      })
                    }}
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Guardando..." : "Guardar"}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)} disabled={loading}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" onClick={handlePrintLabel} disabled={loading}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Etiqueta
                  </Button>
                  <Button variant="outline" onClick={handleSendEmail} disabled={emailLoading}>
                    <Mail className="h-4 w-4 mr-2" />
                    {emailLoading ? "Enviando..." : "Enviar Email"}
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
