"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ref, get } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import ShipmentLabel from "@/components/shipment-label"
import type { Shipment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrintLabelsPage() {
  const params = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShipment = async () => {
      if (!params.id) return

      try {
        const shipmentRef = ref(rtdb, `shipments/${params.id}`)
        const snapshot = await get(shipmentRef)

        if (snapshot.exists()) {
          const shipmentData = snapshot.val()
          setShipment({
            id: params.id as string,
            ...shipmentData,
          })
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

    fetchShipment()
  }, [params.id])

  const handlePrint = () => {
    window.print()
  }

  const getTotalLabels = (): number => {
    if (!shipment) return 1

    // Si hay bultos, usar la cantidad de bultos
    if (shipment.packages && shipment.packages > 0) {
      return shipment.packages
    }

    // Si no hay bultos pero hay pallets, usar la cantidad de pallets
    if (shipment.pallets && shipment.pallets > 0) {
      return shipment.pallets
    }

    // Si no hay ni bultos ni pallets, generar al menos 1 etiqueta
    return 1
  }

  const getLabelType = (): "package" | "pallet" => {
    if (!shipment) return "package"

    // Si hay bultos, las etiquetas son de bultos
    if (shipment.packages && shipment.packages > 0) {
      return "package"
    }

    // Si no hay bultos pero hay pallets, las etiquetas son de pallets
    return "pallet"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando envío...</p>
        </div>
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Envío no encontrado"}</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalLabels = getTotalLabels()
  const labelType = getLabelType()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Etiquetas de Envío</h1>
            <p className="text-gray-600">
              Envío #{shipment.shipmentNumber} - {totalLabels} etiqueta{totalLabels > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Labels Container */}
      <div className="p-4 print:p-0">
        <div className="space-y-4 print:space-y-0">
          {Array.from({ length: totalLabels }, (_, index) => (
            <div key={index} className="print:break-after-page">
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
