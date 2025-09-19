"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Printer, Mail, Trash2, AlertCircle, ExternalLink, Download } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment } from "@/lib/types"
import { ref, update, remove } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface ShipmentDetailModalProps {
  shipment: Shipment | null
  onClose: () => void
  onUpdate?: (updatedShipment: Shipment) => void
  onDelete?: (deletedShipmentId: string) => void
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
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editedShipment, setEditedShipment] = useState<Shipment | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [remitType, setRemitType] = useState<"R" | "X" | "RM">("R")
  const [remitNumber, setRemitNumber] = useState("")
  const [invoiceType, setInvoiceType] = useState<"A" | "B" | "E">("A")
  const [invoiceNumber, setInvoiceNumber] = useState("")

  useEffect(() => {
    if (shipment) {
      setEditedShipment({ ...shipment })
      setError(null)

      // Parse existing remit number
      if (shipment.remitNumber) {
        const remitMatch = shipment.remitNumber.match(/^(R|X|RM)\s*-\s*(?:00006\s*-\s*|R00001\s*-\s*)?(.+)$/)
        if (remitMatch) {
          setRemitType(remitMatch[1] as "R" | "X" | "RM")
          setRemitNumber(remitMatch[2])
        }
      }

      // Parse existing invoice number
      if (shipment.invoiceNumber) {
        const invoiceMatch = shipment.invoiceNumber.match(/^([ABE])\s*00001-(.+)$/)
        if (invoiceMatch) {
          setInvoiceType(invoiceMatch[1] as "A" | "B" | "E")
          setInvoiceNumber(invoiceMatch[2])
        }
      }
    }
  }, [shipment])

  useEffect(() => {
    if (editedShipment && remitNumber) {
      if (remitType === "R") {
        setEditedShipment((prev) => ({
          ...prev!,
          remitNumber: `${remitType} - 00006 - ${remitNumber}`,
        }))
      } else if (remitType === "X") {
        setEditedShipment((prev) => ({
          ...prev!,
          remitNumber: `${remitType} - R00001 - ${remitNumber}`,
        }))
      } else if (remitType === "RM") {
        setEditedShipment((prev) => ({
          ...prev!,
          remitNumber: `${remitType} - ${remitNumber}`,
        }))
      }
    } else if (editedShipment) {
      setEditedShipment((prev) => ({
        ...prev!,
        remitNumber: "",
      }))
    }
  }, [remitType, remitNumber])

  useEffect(() => {
    if (editedShipment && invoiceNumber) {
      let prefix = ""
      if (invoiceType === "A") {
        prefix = "A 00001-"
      } else if (invoiceType === "B") {
        prefix = "B 00001-"
      } else if (invoiceType === "E") {
        prefix = "E 00004-"
      }

      setEditedShipment((prev) => ({
        ...prev!,
        invoiceNumber: `${prefix}${invoiceNumber}`,
      }))
    } else if (editedShipment) {
      setEditedShipment((prev) => ({
        ...prev!,
        invoiceNumber: "",
      }))
    }
  }, [invoiceType, invoiceNumber])

  if (!shipment) return null

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedShipment({ ...shipment })
    setError(null)
  }

  const handleSave = async () => {
    if (!editedShipment) return

    setIsLoading(true)
    setError(null)

    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      const updateData = {
        ...editedShipment,
        updatedAt: new Date().toISOString(),
      }

      await update(shipmentRef, updateData)

      if (onUpdate) {
        onUpdate(editedShipment)
      }

      toast({
        title: "Envío actualizado",
        description: "Los cambios se han guardado correctamente.",
        duration: 3000,
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating shipment:", error)
      setError("Error al actualizar el envío. Por favor, intente de nuevo.")
      toast({
        title: "Error",
        description: "No se pudo actualizar el envío.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar este envío? Esta acción no se puede deshacer.")) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      await remove(shipmentRef)

      if (onDelete) {
        onDelete(shipment.id)
      }

      toast({
        title: "Envío eliminado",
        description: "El envío ha sido eliminado correctamente.",
        duration: 3000,
      })

      onClose()
    } catch (error) {
      console.error("Error deleting shipment:", error)
      setError("Error al eliminar el envío. Por favor, intente de nuevo.")
      toast({
        title: "Error",
        description: "No se pudo eliminar el envío.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    setError(null)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shipment),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el correo")
      }

      toast({
        title: "Correo enviado",
        description: "La notificación ha sido enviada al cliente.",
        duration: 3000,
      })
    } catch (error: any) {
      console.error("Error sending email:", error)
      setError(`Error al enviar el correo: ${error.message}`)
      toast({
        title: "Error",
        description: "No se pudo enviar el correo de notificación.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handlePrintLabels = () => {
    router.push(`/print-labels/${shipment.id}`)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  const getTotalLabels = (): number => {
    if (editedShipment?.packages && editedShipment.packages > 0) {
      return editedShipment.packages
    } else if (editedShipment?.pallets && editedShipment.pallets > 0) {
      return editedShipment.pallets
    } else {
      return 1
    }
  }

  const currentShipment = editedShipment || shipment

  return (
    <Dialog open={!!shipment} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalles del Envío</span>
            <Badge variant={currentShipment.status === "sent" ? "default" : "secondary"}>
              {currentShipment.status === "sent" ? "Enviado" : "Pendiente"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Envío #{currentShipment.shipmentNumber} - {formatDate(currentShipment.date)}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipmentNumber">Número de Envío</Label>
              <Input id="shipmentNumber" value={currentShipment.shipmentNumber} readOnly />
            </div>
            <div>
              <Label htmlFor="date">Fecha de Despacho</Label>
              <Input
                id="date"
                type="date"
                value={currentShipment.date?.split("T")[0] || ""}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    date: e.target.value,
                  }))
                }
                readOnly={!isEditing}
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Input id="client" value={currentShipment.client} readOnly />
            </div>
            <div>
              <Label htmlFor="clientAddress">Dirección del Cliente</Label>
              <Textarea
                id="clientAddress"
                value={currentShipment.clientAddress || ""}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    clientAddress: e.target.value,
                  }))
                }
                readOnly={!isEditing}
                rows={2}
              />
            </div>
          </div>

          {/* Transport Information */}
          <div>
            <Label htmlFor="transport">Transporte</Label>
            <Input id="transport" value={currentShipment.transport} readOnly />
          </div>

          {/* Package Information */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="packages">Bultos</Label>
              <Input
                id="packages"
                type="number"
                min="0"
                value={currentShipment.packages || 0}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    packages: Number.parseInt(e.target.value) || 0,
                  }))
                }
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="pallets">Pallets</Label>
              <Input
                id="pallets"
                type="number"
                min="0"
                value={currentShipment.pallets || 0}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    pallets: Number.parseInt(e.target.value) || 0,
                  }))
                }
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={currentShipment.weight || 0}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    weight: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                readOnly={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="declaredValue">Valor Declarado ($)</Label>
              <Input
                id="declaredValue"
                type="number"
                step="0.01"
                min="0"
                value={currentShipment.declaredValue || 0}
                onChange={(e) =>
                  isEditing &&
                  setEditedShipment((prev) => ({
                    ...prev!,
                    declaredValue: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                readOnly={!isEditing}
              />
            </div>
          </div>

          {/* Document Numbers */}
          {isEditing ? (
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
                {currentShipment.invoiceNumber && (
                  <p className="text-sm text-muted-foreground">Formato guardado: {currentShipment.invoiceNumber}</p>
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
                {currentShipment.remitNumber && (
                  <p className="text-sm text-muted-foreground">Formato guardado: {currentShipment.remitNumber}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNumber">Número de Factura</Label>
                <Input id="invoiceNumber" value={currentShipment.invoiceNumber || ""} readOnly />
              </div>
              <div>
                <Label htmlFor="remitNumber">Número de Remito</Label>
                <Input id="remitNumber" value={currentShipment.remitNumber || ""} readOnly />
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <Label htmlFor="status">Estado</Label>
            <Select
              value={currentShipment.status}
              onValueChange={(value) =>
                isEditing &&
                setEditedShipment((prev) => ({
                  ...prev!,
                  status: value as "pending" | "sent",
                }))
              }
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Note */}
          <div>
            <Label htmlFor="deliveryNote">Nota de Entrega</Label>
            <Input
              id="deliveryNote"
              value={currentShipment.deliveryNote || ""}
              onChange={(e) =>
                isEditing &&
                setEditedShipment((prev) => ({
                  ...prev!,
                  deliveryNote: e.target.value,
                }))
              }
              readOnly={!isEditing}
            />
          </div>

          {/* Special Handling */}
          <div className="space-y-4">
            <Label>Manejo Especial</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFragile"
                  checked={currentShipment.isFragile || false}
                  onCheckedChange={(checked) =>
                    isEditing &&
                    setEditedShipment((prev) => ({
                      ...prev!,
                      isFragile: !!checked,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="isFragile">Frágil</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUrgent"
                  checked={currentShipment.isUrgent || false}
                  onCheckedChange={(checked) =>
                    isEditing &&
                    setEditedShipment((prev) => ({
                      ...prev!,
                      isUrgent: !!checked,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="isUrgent">Urgente</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasColdChain"
                  checked={currentShipment.hasColdChain || false}
                  onCheckedChange={(checked) =>
                    isEditing &&
                    setEditedShipment((prev) => ({
                      ...prev!,
                      hasColdChain: !!checked,
                    }))
                  }
                  disabled={!isEditing}
                />
                <Label htmlFor="hasColdChain">Cadena de Frío</Label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              value={currentShipment.notes || ""}
              onChange={(e) =>
                isEditing &&
                setEditedShipment((prev) => ({
                  ...prev!,
                  notes: e.target.value,
                }))
              }
              readOnly={!isEditing}
              rows={3}
            />
          </div>

          {/* Attachments */}
          {currentShipment.attachments && currentShipment.attachments.length > 0 && (
            <div>
              <Label>Archivos Adjuntos</Label>
              <div className="space-y-2 mt-2">
                {currentShipment.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{attachment.split("/").pop()}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(attachment, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = attachment
                          link.download = attachment.split("/").pop() || "archivo"
                          link.click()
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex space-x-2">
            {showPrintButton && (
              <Button variant="outline" onClick={handlePrintLabels}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Etiquetas ({getTotalLabels()})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={isSendingEmail || !currentShipment.clientEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>Editar</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
