"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment } from "@/lib/types"
import ShipmentLabel from "@/components/shipment-label"

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
          const shipmentData = {
            id: params.id as string,
            ...snapshot.val(),
          }
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

  const handlePrint = () => {
    window.print()
  }

  // Función para determinar el total de etiquetas
  const getTotalLabels = (shipment: Shipment): number => {
    // Si hay bultos, usar la cantidad de bultos
    if (shipment.packages && shipment.packages > 0) {
      return shipment.packages
    }
    // Si no hay bultos pero hay pallets, usar la cantidad de pallets
    else if (shipment.pallets && shipment.pallets > 0) {
      return shipment.pallets
    }
    // Si no hay ni bultos ni pallets, generar al menos 1 etiqueta
    else {
      return 1
    }
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
          <p className="text-red-600 text-lg mb-4">{error || "Envío no encontrado"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const totalLabels = getTotalLabels(shipment)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Etiquetas de Envío</h1>
              <p className="text-sm text-gray-600">
                Envío: {shipment.shipmentNumber} - {totalLabels} etiqueta(s)
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Etiquetas
          </Button>
        </div>
      </div>

      {/* Labels Container */}
      <div className="print:p-0 p-8">
        <div className="max-w-4xl mx-auto space-y-8 print:space-y-0">
          {Array.from({ length: totalLabels }, (_, index) => (
            <div key={index} className="print:break-after-page">
              <ShipmentLabel shipment={shipment} labelNumber={index + 1} totalLabels={totalLabels} />
            </div>
          ))}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:break-after-page {
            break-after: page;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:space-y-0 > * + * {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
