"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment } from "@/lib/types"
import ShipmentLabel from "@/components/shipment-label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer } from "lucide-react"

export default function PrintLabelPage() {
  const params = useParams()
  const router = useRouter()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        const shipmentId = params.id as string
        const shipmentRef = ref(rtdb, `shipments/${shipmentId}`)
        const snapshot = await get(shipmentRef)

        if (snapshot.exists()) {
          const shipmentData = snapshot.val()
          setShipment({ id: shipmentId, ...shipmentData })
        } else {
          setError("Envío no encontrado")
        }
      } catch (error) {
        console.error("Error fetching shipment:", error)
        setError("Error al cargar el envío")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchShipment()
    }
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error || "Envío no encontrado"}</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b p-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex space-x-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Etiqueta
            </Button>
          </div>
        </div>
      </div>

      {/* Label Content */}
      <div className="print:p-0 p-6">
        <ShipmentLabel shipment={shipment} />
      </div>
    </div>
  )
}
