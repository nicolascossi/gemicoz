"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package, MapPin, Calendar, Weight, DollarSign, FileText, Truck, Phone, Mail } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getShipmentByNumber } from "@/lib/shipment"
import type { Shipment } from "@/lib/types"
import Image from "next/image"

export default function ShipmentDetailsPage() {
  const params = useParams()
  const shipmentNumber = params.shipmentNumber as string
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchShipment() {
      try {
        setLoading(true)
        const shipmentData = await getShipmentByNumber(shipmentNumber)

        if (shipmentData) {
          setShipment(shipmentData)
        } else {
          setError("Envío no encontrado")
        }
      } catch (err) {
        console.error("Error fetching shipment:", err)
        setError("Error al cargar los datos del envío")
      } finally {
        setLoading(false)
      }
    }

    if (shipmentNumber) {
      fetchShipment()
    }
  }, [shipmentNumber])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando información del envío...</p>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Envío no encontrado</h2>
              <p className="text-gray-600">{error || "No se pudo encontrar el envío solicitado."}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Gemico-uBE9D9uAFAorAj3wQ1JCsUhsu6oZwO.png"
            alt="Gemico Logo"
            width={120}
            height={60}
            className="mx-auto mb-4"
            priority
          />
          <h1 className="text-2xl font-bold text-gray-900">Detalles del Envío</h1>
        </div>

        {/* Información destacada */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Número de Remito */}
          {shipment.remitNumber && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Número de Remito</p>
                    <p className="text-lg font-bold text-blue-900">{shipment.remitNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Valor Declarado */}
          {shipment.declaredValue && shipment.declaredValue > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Valor Declarado</p>
                    <p className="text-lg font-bold text-green-900">
                      ${shipment.declaredValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Información del Envío */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Información del Envío</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Despacho</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">
                    {format(new Date(shipment.date), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Cantidad de Bultos</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{shipment.packages} bultos</p>
                </div>
              </div>

              {shipment.pallets && shipment.pallets > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Cantidad de Pallets</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.pallets} pallets</p>
                  </div>
                </div>
              )}

              {shipment.weight && shipment.weight > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Peso</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Weight className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.weight.toFixed(2)} kg</p>
                  </div>
                </div>
              )}

              {shipment.invoiceNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Número de Factura</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.invoiceNumber}</p>
                  </div>
                </div>
              )}

              {shipment.deliveryNote && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Nota de Entrega</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.deliveryNote}</p>
                  </div>
                </div>
              )}

              {shipment.orderNote && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Nota de Pedido</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.orderNote}</p>
                  </div>
                </div>
              )}

              {shipment.shippingCost && shipment.shippingCost > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Costo de Envío</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">
                      ${shipment.shippingCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Características especiales */}
            {(shipment.hasColdChain || shipment.isUrgent || shipment.isFragile) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-500 mb-2">Características Especiales</p>
                <div className="flex flex-wrap gap-2">
                  {shipment.hasColdChain && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Cadena de Frío
                    </Badge>
                  )}
                  {shipment.isUrgent && (
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Urgente
                    </Badge>
                  )}
                  {shipment.isFragile && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Muy Frágil
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Notas */}
            {shipment.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-500">Observaciones</p>
                <p className="text-gray-900 mt-1">{shipment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Información del Cliente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Cliente</p>
              <p className="text-lg font-semibold text-gray-900">{shipment.client}</p>
              {shipment.clientCode && <p className="text-sm text-gray-600">Código: {shipment.clientCode}</p>}
            </div>

            {shipment.clientAddress && (
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección de Entrega</p>
                <div className="flex items-start space-x-2 mt-1">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{shipment.clientAddress}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipment.clientEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.clientEmail}</p>
                  </div>
                </div>
              )}

              {shipment.clientPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.clientPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información del Transporte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5" />
              <span>Información del Transporte</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Empresa de Transporte</p>
              <p className="text-lg font-semibold text-gray-900">{shipment.transport}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipment.transportEmail && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.transportEmail}</p>
                  </div>
                </div>
              )}

              {shipment.transportPhone && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Teléfono</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{shipment.transportPhone}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
