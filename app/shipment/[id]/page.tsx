"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, Calendar, User, Truck, Phone, Mail, MapPin } from "lucide-react"
import type { Shipment } from "@/lib/types"
import { rtdb } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import QRCode from "qrcode"

export default function ShipmentDetails() {
  const params = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    const fetchShipment = async () => {
      if (!params.id) return

      try {
        const shipmentRef = ref(rtdb, `shipments/${params.id}`)
        const snapshot = await get(shipmentRef)

        if (snapshot.exists()) {
          const shipmentData = { id: params.id as string, ...snapshot.val() }
          setShipment(shipmentData)

          // Generate QR code
          const qrData = `${window.location.origin}/pedido/${shipmentData.shipmentNumber}`
          const qrUrl = await QRCode.toDataURL(qrData)
          setQrCodeUrl(qrUrl)
        }
      } catch (error) {
        console.error("Error fetching shipment:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShipment()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Envío no encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>
      case "sent":
        return <Badge variant="default">Enviado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Envío {shipment.shipmentNumber}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Creado el {formatDate(shipment.createdAt || shipment.date)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {getStatusBadge(shipment.status)}
                {qrCodeUrl && <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-16 h-16" />}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>Cliente:</strong> {shipment.client}
                  </p>
                  {shipment.clientEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {shipment.clientEmail}
                    </p>
                  )}
                  {shipment.clientPhone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {shipment.clientPhone}
                    </p>
                  )}
                  {shipment.clientAddress && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {shipment.clientAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Transport Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Información del Transporte
                </h3>
                <div className="space-y-2">
                  <p>
                    <strong>Transporte:</strong> {shipment.transport}
                  </p>
                  {shipment.transportEmail && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {shipment.transportEmail}
                    </p>
                  )}
                  {shipment.transportPhone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {shipment.transportPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalles del Envío
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Despacho</p>
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(shipment.date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cantidad de Bultos</p>
                  <p>{shipment.packages}</p>
                </div>
                {shipment.weight && (
                  <div>
                    <p className="text-sm text-muted-foreground">Peso</p>
                    <p>{shipment.weight} kg</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            {(shipment.notes || shipment.invoiceNumber || shipment.remitNumber) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Adicional</h3>
                <div className="space-y-2">
                  {shipment.invoiceNumber && (
                    <p>
                      <strong>Número de Factura:</strong> {shipment.invoiceNumber}
                    </p>
                  )}
                  {shipment.remitNumber && (
                    <p>
                      <strong>Número de Remito:</strong> {shipment.remitNumber}
                    </p>
                  )}
                  {shipment.notes && (
                    <div>
                      <p className="font-semibold">Notas:</p>
                      <p className="text-muted-foreground">{shipment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Special Conditions */}
            {(shipment.hasColdChain || shipment.isUrgent || shipment.isFragile) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Condiciones Especiales</h3>
                <div className="flex gap-2">
                  {shipment.hasColdChain && <Badge variant="outline">Cadena de Frío</Badge>}
                  {shipment.isUrgent && <Badge variant="destructive">Urgente</Badge>}
                  {shipment.isFragile && <Badge variant="secondary">Frágil</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
