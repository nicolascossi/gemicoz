"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import type { Shipment } from "@/lib/types"
import ShipmentLabel from "@/components/shipment-label"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrintLabelsPage() {
  const params = useParams()
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

  // Function to determine total number of labels to print
  const getTotalLabels = (shipment: Shipment): number => {
    const packages = shipment.packages || 0
    const pallets = shipment.pallets || 0

    // If there are packages, use packages count
    if (packages > 0) {
      return packages
    }

    // If no packages but there are pallets, use pallets count
    if (pallets > 0) {
      return pallets
    }

    // If neither packages nor pallets, return 1 as minimum
    return 1
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
          <p className="text-red-500 text-lg mb-4">{error || "Envío no encontrado"}</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalLabels = getTotalLabels(shipment)
  const hasOnlyPallets = (shipment.packages || 0) === 0 && (shipment.pallets || 0) > 0

  return (
    <div className="min-h-screen bg-white">
      {/* Print controls - hidden when printing */}
      <div className="print:hidden p-4 bg-gray-100 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {hasOnlyPallets
                ? `${totalLabels} etiqueta${totalLabels > 1 ? "s" : ""} de pallet${totalLabels > 1 ? "s" : ""}`
                : `${totalLabels} etiqueta${totalLabels > 1 ? "s" : ""} de bulto${totalLabels > 1 ? "s" : ""}`}
            </span>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Etiquetas
            </Button>
          </div>
        </div>
      </div>

      {/* Labels container */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: totalLabels }, (_, index) => (
              <ShipmentLabel
                key={index}
                shipment={shipment}
                labelNumber={index + 1}
                totalLabels={totalLabels}
                isPallet={hasOnlyPallets}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
