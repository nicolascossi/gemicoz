"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer } from "lucide-react"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment } from "@/lib/types"
import ShipmentLabel from "@/components/shipment-label"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function PrintLabelsPage() {
  const params = useParams()
  const router = useRouter()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShipment = async () => {
      if (!params.id) return

      try {
        const shipmentRef = ref(rtdb, `shipments/${params.id}`)
        const snapshot = await get(shipmentRef)

        if (snapshot.exists()) {
          const shipmentData = { id: params.id as string, ...snapshot.val() } as Shipment
          setShipment(shipmentData)
        } else {
          setError("Envío no encontrado")
        }
      } catch (error) {
        console.error("Error fetching shipment:", error)
        setError("Error al cargar el envío")
      } finally {
        setIsLoading(false)
      }
    }

    fetchShipment()
  }, [params.id])

  // Función para determinar el total de etiquetas
  const getTotalLabels = (shipment: Shipment): number => {
    const packages = shipment.packages || 0
    const pallets = shipment.pallets || 0

    // Si hay bultos, usar la cantidad de bultos
    if (packages > 0) {
      return packages
    }

    // Si no hay bultos pero hay pallets, usar la cantidad de pallets
    if (pallets > 0) {
      return pallets
    }

    // Si no hay ni bultos ni pallets, generar al menos 1 etiqueta
    return 1
  }

  // Función para determinar el tipo de etiqueta
  const getLabelType = (shipment: Shipment): "package" | "pallet" => {
    const packages = shipment.packages || 0
    const pallets = shipment.pallets || 0

    // Si hay bultos, las etiquetas son de tipo package
    if (packages > 0) {
      return "package"
    }

    // Si no hay bultos pero hay pallets, las etiquetas son de tipo pallet
    if (pallets > 0) {
      return "pallet"
    }

    // Por defecto, usar package
    return "package"
  }

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">Cargando envío...</p>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-600">{error || "Envío no encontrado"}</p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const totalLabels = getTotalLabels(shipment)
  const labelType = getLabelType(shipment)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Etiquetas de Envío</h1>
                <p className="text-sm text-gray-600">
                  {shipment.shipmentNumber} - {shipment.client}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        {/* Shipment Info - Hidden when printing */}
        <Card className="mb-8 print:hidden">
          <CardHeader>
            <CardTitle>Información del Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Número de Envío</p>
                <p className="text-lg">{shipment.shipmentNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cliente</p>
                <p className="text-lg">{shipment.client}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p className="text-lg">{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{labelType === "pallet" ? "Pallets" : "Bultos"}</p>
                <p className="text-lg">{labelType === "pallet" ? shipment.pallets || 0 : shipment.packages || 0}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Se generarán <strong>{totalLabels}</strong> etiqueta{totalLabels !== 1 ? "s" : ""} de tipo{" "}
                <strong>{labelType === "pallet" ? "Pallet" : "Bulto"}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Labels */}
        <div className="space-y-4 print:space-y-0">
          {Array.from({ length: totalLabels }, (_, index) => (
            <div key={index} className="print:break-after-page last:print:break-after-auto">
              <ShipmentLabel
                shipment={shipment}
                labelNumber={index + 1}
                totalLabels={totalLabels}
                labelType={labelType}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
