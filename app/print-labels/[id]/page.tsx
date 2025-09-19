"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Shipment } from "@/lib/types"
import ShipmentLabel from "@/components/shipment-label"

export default function PrintLabelsPage() {
  const params = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShipment = async () => {
      if (!params.id) return

      try {
        const docRef = doc(db, "shipments", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setShipment({
            id: docSnap.id,
            ...data,
            date: data.date?.toDate?.() || new Date(data.date),
          } as Shipment)
        }
      } catch (error) {
        console.error("Error fetching shipment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShipment()
  }, [params.id])

  useEffect(() => {
    // Auto-print when component mounts and shipment is loaded
    if (shipment && !loading) {
      const timer = setTimeout(() => {
        window.print()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [shipment, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando etiquetas...</div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Envío no encontrado</div>
      </div>
    )
  }

  // Determinar el total de etiquetas basado en bultos y pallets
  const getTotalLabels = () => {
    const packages = shipment.packages || 0
    const pallets = shipment.pallets || 0

    // Si hay bultos, usar bultos. Si no hay bultos pero hay pallets, usar pallets
    if (packages > 0) {
      return packages
    } else if (pallets > 0) {
      return pallets
    } else {
      return 1 // Al menos una etiqueta
    }
  }

  const totalLabels = getTotalLabels()

  return (
    <div className="print:p-0 print:m-0">
      {Array.from({ length: totalLabels }, (_, index) => (
        <ShipmentLabel key={index} shipment={shipment} labelNumber={index + 1} totalLabels={totalLabels} />
      ))}
    </div>
  )
}
