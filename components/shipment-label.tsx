"use client"

import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment } from "@/lib/types"
import Image from "next/image"

interface ShipmentLabelProps {
  shipment: Shipment
  labelNumber: number
  totalLabels: number
  isPallet?: boolean
}

export default function ShipmentLabel({ shipment, labelNumber, totalLabels, isPallet = false }: ShipmentLabelProps) {
  // Generate QR code data
  const qrData = `${process.env.NEXT_PUBLIC_BASE_URL || "https://gemico-envios.vercel.app"}/pedido/${shipment.shipmentNumber}`

  // Format package/pallet info
  const getPackageInfo = () => {
    if (isPallet) {
      return `Pallet ${labelNumber}/${totalLabels}`
    } else {
      return `Bulto ${labelNumber}/${totalLabels}`
    }
  }

  // Format weight per package/pallet
  const getWeightPerUnit = () => {
    const totalWeight = shipment.weight || 0
    if (totalWeight === 0) return "0.00 kg"

    const weightPerUnit = totalWeight / totalLabels
    return `${weightPerUnit.toFixed(2)} kg`
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white border-2 border-gray-300 p-4 print:border-black print:break-inside-avoid">
      {/* Header with logo and company info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Gemico-uBE9D9uAFAorAj3wQ1JCsUhsu6oZwO.png"
            alt="Gemico Logo"
            width={80}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <div className="text-right text-xs">
          <p className="font-bold">GEMICO S.R.L.</p>
          <p>Logística y Transporte</p>
        </div>
      </div>

      {/* Shipment number and package info */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold mb-1">{shipment.shipmentNumber}</h2>
        <p className="text-lg font-semibold text-blue-600">{getPackageInfo()}</p>
      </div>

      {/* Client information */}
      <div className="mb-4">
        <div className="border-b pb-2 mb-2">
          <p className="text-xs text-gray-600 uppercase">DESTINATARIO</p>
          <p className="font-bold text-sm">{shipment.client}</p>
        </div>
        <div className="text-xs">
          <p className="font-medium">Dirección:</p>
          <p className="break-words">{shipment.clientAddress || "No especificada"}</p>
        </div>
      </div>

      {/* Transport information */}
      <div className="mb-4">
        <div className="border-b pb-2 mb-2">
          <p className="text-xs text-gray-600 uppercase">TRANSPORTE</p>
          <p className="font-bold text-sm">{shipment.transport}</p>
        </div>
      </div>

      {/* Package details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
        <div>
          <p className="text-gray-600">Fecha:</p>
          <p className="font-medium">{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</p>
        </div>
        <div>
          <p className="text-gray-600">Peso:</p>
          <p className="font-medium">{getWeightPerUnit()}</p>
        </div>
        {shipment.declaredValue && shipment.declaredValue > 0 && (
          <div>
            <p className="text-gray-600">Valor:</p>
            <p className="font-medium">${(shipment.declaredValue / totalLabels).toFixed(2)}</p>
          </div>
        )}
        {shipment.invoiceNumber && (
          <div>
            <p className="text-gray-600">Factura:</p>
            <p className="font-medium text-xs">{shipment.invoiceNumber}</p>
          </div>
        )}
      </div>

      {/* Special handling indicators */}
      {(shipment.hasColdChain || shipment.isUrgent || shipment.isFragile) && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {shipment.hasColdChain && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">❄️ FRÍO</span>
            )}
            {shipment.isUrgent && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">⚡ URGENTE</span>}
            {shipment.isFragile && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">⚠️ FRÁGIL</span>
            )}
          </div>
        </div>
      )}

      {/* QR Code and tracking info */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">Seguimiento:</p>
          <p className="text-xs font-mono break-all">{qrData}</p>
        </div>
        <div className="ml-4">
          <QRCodeSVG value={qrData} size={60} level="M" includeMargin={false} />
        </div>
      </div>

      {/* Notes if any */}
      {shipment.notes && (
        <div className="mt-4 pt-2 border-t">
          <p className="text-xs text-gray-600">Observaciones:</p>
          <p className="text-xs">{shipment.notes}</p>
        </div>
      )}
    </div>
  )
}
