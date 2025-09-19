"use client"
import { useEffect, useState } from "react"
import type { Shipment } from "@/lib/types"
import { generateQRCode } from "@/lib/qr-utils"

interface ShipmentLabelProps {
  shipment: Shipment
  labelNumber: number
  totalLabels: number
}

export default function ShipmentLabel({ shipment, labelNumber, totalLabels }: ShipmentLabelProps) {
  const [qrCode, setQrCode] = useState<string>("")

  useEffect(() => {
    const generateQR = async () => {
      const trackingUrl = `https://gemico-envios.vercel.app/pedido/${shipment.shipmentNumber}`
      const qrCodeDataURL = await generateQRCode(trackingUrl)
      setQrCode(qrCodeDataURL)
    }
    generateQR()
  }, [shipment.shipmentNumber])

  // Determinar si mostrar "Bulto" o "Pallet"
  const getLabelText = () => {
    if (shipment.packages && shipment.packages > 0) {
      return `Bulto ${labelNumber}/${totalLabels}`
    } else if (shipment.pallets && shipment.pallets > 0) {
      return `Pallet ${labelNumber}/${totalLabels}`
    } else {
      return `Bulto ${labelNumber}/${totalLabels}`
    }
  }

  return (
    <div className="w-full h-[400px] border-2 border-black bg-white p-4 flex flex-col text-black print:break-after-page">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="text-2xl font-bold mb-2">GEMICO</div>
          <div className="text-lg font-semibold">{getLabelText()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">Nº {shipment.shipmentNumber}</div>
          <div className="text-xs">{new Date(shipment.date).toLocaleDateString("es-AR")}</div>
        </div>
      </div>

      {/* Main Content - 3 columns */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* Left Column - Client Info */}
        <div className="space-y-2">
          <div>
            <div className="text-xs font-semibold text-gray-600">CLIENTE:</div>
            <div className="text-sm font-bold">{shipment.client}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">DIRECCIÓN:</div>
            <div className="text-xs">{shipment.clientAddress || "No especificada"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">TRANSPORTE:</div>
            <div className="text-sm font-semibold">{shipment.transport}</div>
          </div>
        </div>

        {/* Center Column - Package Details */}
        <div className="space-y-2">
          <div>
            <div className="text-xs font-semibold text-gray-600">BULTOS:</div>
            <div className="text-lg font-bold">{shipment.packages || 0}</div>
          </div>
          {shipment.pallets && shipment.pallets > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-600">PALLETS:</div>
              <div className="text-lg font-bold">{shipment.pallets}</div>
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-gray-600">PESO:</div>
            <div className="text-sm font-semibold">{shipment.weight ? `${shipment.weight} kg` : "No especificado"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-600">VALOR:</div>
            <div className="text-sm font-semibold">
              ${shipment.declaredValue ? shipment.declaredValue.toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        {/* Right Column - Documents & QR */}
        <div className="space-y-2">
          {shipment.invoiceNumber && (
            <div>
              <div className="text-xs font-semibold text-gray-600">FACTURA:</div>
              <div className="text-xs font-semibold">{shipment.invoiceNumber}</div>
            </div>
          )}
          {shipment.remitNumber && (
            <div>
              <div className="text-xs font-semibold text-gray-600">REMITO:</div>
              <div className="text-xs font-semibold">{shipment.remitNumber}</div>
            </div>
          )}
          {qrCode && (
            <div className="flex flex-col items-center mt-2">
              <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-16 h-16" />
              <div className="text-xs text-center mt-1">Seguimiento</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-gray-300">
        <div className="flex justify-between items-center">
          <div className="text-xs">
            {shipment.isFragile && <span className="bg-red-100 text-red-800 px-2 py-1 rounded mr-2">FRÁGIL</span>}
            {shipment.isUrgent && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2">URGENTE</span>}
            {shipment.hasColdChain && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">CADENA DE FRÍO</span>
            )}
          </div>
          <div className="text-xs text-gray-600">{shipment.deliveryNote && `Nota: ${shipment.deliveryNote}`}</div>
        </div>
        {shipment.notes && (
          <div className="text-xs text-gray-600 mt-1">
            <strong>Observaciones:</strong> {shipment.notes}
          </div>
        )}
      </div>
    </div>
  )
}
