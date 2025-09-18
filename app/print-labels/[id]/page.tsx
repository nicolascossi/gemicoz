"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import ShipmentLabel from "@/components/shipment-label"
import type { Shipment } from "@/lib/types"
import { Printer, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function PrintLabelsPage() {
  const params = useParams()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        // In a real app, this would fetch from your database
        // For now, we'll get it from localStorage or use mock data
        const shipments = JSON.parse(localStorage.getItem("shipments") || "[]")
        const foundShipment = shipments.find((s: Shipment) => s.id === params.id)

        if (foundShipment) {
          setShipment(foundShipment)
        } else {
          // Mock shipment for demo
          setShipment({
            id: params.id as string,
            shipmentNumber: "GEM-2024-001",
            client: "Cliente Demo",
            clientAddress: "Av. Corrientes 1234, CABA",
            transport: "Transporte Demo",
            date: new Date().toISOString(),
            packages: 3,
            pallets: 0,
            weight: 15.5,
            declaredValue: 1500,
            status: "pending",
            invoiceNumber: "F-001-00000123",
            remitNumber: "R-0006-00000001",
            notes: "Manejar con cuidado",
            isFragile: true,
            isUrgent: false,
            hasColdChain: false,
          })
        }
      } catch (error) {
        console.error("Error fetching shipment:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchShipment()
  }, [params.id])

  const getTotalLabels = () => {
    if (!shipment) return 0

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

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando etiquetas...</p>
        </div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Envío no encontrado</h1>
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
    <div className="min-h-screen bg-gray-50">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Etiquetas de Envío</h1>
              <p className="text-sm text-gray-600">
                {shipment.shipmentNumber} - {totalLabels} {labelType === "pallet" ? "pallet(s)" : "etiqueta(s)"}
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiquetas
          </Button>
        </div>
      </div>

      {/* Labels Container */}
      <div className="p-4 print:p-0">
        <div className="space-y-8 print:space-y-4">
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
