"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment } from "@/lib/types"
import { generateQRCode } from "@/lib/qr-utils"
import { useEffect, useState } from "react"
import Image from "next/image"

interface ShipmentLabelProps {
  shipment: Shipment
  labelNumber: number
  totalLabels: number
  labelType?: "package" | "pallet"
}

export default function ShipmentLabel({
  shipment,
  labelNumber,
  totalLabels,
  labelType = "package",
}: ShipmentLabelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = `https://gemico-envios.vercel.app/pedido/${shipment.shipmentNumber}`
        const qrUrl = await generateQRCode(qrData)
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [shipment.shipmentNumber])

  const formatAddress = (address: string) => {
    if (!address) return "Dirección no especificada"

    // Si la dirección es muy larga, dividirla en líneas
    if (address.length > 50) {
      const parts = address.split(",")
      if (parts.length > 1) {
        return (
          <div>
            <div>{parts[0].trim()}</div>
            <div>{parts.slice(1).join(",").trim()}</div>
          </div>
        )
      }
    }

    return address
  }

  const getLabelText = () => {
    if (labelType === "pallet") {
      return `Pallet ${labelNumber}/${totalLabels}`
    } else {
      return `Bulto ${labelNumber}/${totalLabels}`
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white border-2 border-gray-300 p-6 print:border-black print:max-w-none print:mx-0">
      {/* Header with Logo and Company Info */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center space-x-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Gemico-uBE9D9uAFAorAj3wQ1JCsUhsu6oZwO.png"
            alt="Gemico Logo"
            width={120}
            height={60}
            className="object-contain"
            priority
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GEMICO</h1>
            <p className="text-sm text-gray-600">Gestión de Envíos</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600 mb-2">{getLabelText()}</div>
          <div className="text-lg font-semibold">{shipment.shipmentNumber}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Left Column - Sender Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Remitente</h3>
            <div className="text-lg font-semibold">GEMICO</div>
            <div className="text-sm text-gray-600">
              <div>Av. Corrientes 1234</div>
              <div>CABA, Argentina</div>
              <div>Tel: (011) 4567-8900</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Transporte</h3>
            <div className="text-lg font-semibold">{shipment.transport}</div>
          </div>
        </div>

        {/* Center Column - Recipient Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Destinatario</h3>
            <div className="text-lg font-semibold mb-2">{shipment.client}</div>
            <div className="text-sm text-gray-800">{formatAddress(shipment.clientAddress)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Fecha</h4>
              <div className="text-sm">{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Peso</h4>
              <div className="text-sm">{shipment.weight ? `${shipment.weight.toFixed(2)} kg` : "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Right Column - QR Code and Details */}
        <div className="space-y-4">
          <div className="flex justify-center">
            {qrCodeUrl && (
              <div className="text-center">
                <Image
                  src={qrCodeUrl || "/placeholder.svg"}
                  alt="QR Code"
                  width={120}
                  height={120}
                  className="border border-gray-300"
                />
                <p className="text-xs text-gray-600 mt-2">Escanear para seguimiento</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {shipment.invoiceNumber && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Factura</h4>
                <div className="text-sm">{shipment.invoiceNumber}</div>
              </div>
            )}
            {shipment.remitNumber && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Remito</h4>
                <div className="text-sm">{shipment.remitNumber}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Details */}
      <div className="border-t border-gray-300 pt-4 mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
              {labelType === "pallet" ? "Pallets" : "Bultos"}
            </h4>
            <div className="text-lg font-semibold">
              {labelType === "pallet" ? shipment.pallets || 0 : shipment.packages || 0}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Peso Total</h4>
            <div className="text-lg font-semibold">{shipment.weight ? `${shipment.weight.toFixed(2)} kg` : "N/A"}</div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Valor Declarado</h4>
            <div className="text-lg font-semibold">
              ${shipment.declaredValue ? shipment.declaredValue.toFixed(2) : "0.00"}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">Estado</h4>
            <div
              className={`text-sm font-semibold ${shipment.status === "sent" ? "text-green-600" : "text-orange-600"}`}
            >
              {shipment.status === "sent" ? "ENVIADO" : "PENDIENTE"}
            </div>
          </div>
        </div>
      </div>

      {/* Special Handling Instructions */}
      {(shipment.hasColdChain || shipment.isUrgent || shipment.isFragile) && (
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Instrucciones Especiales</h4>
          <div className="flex flex-wrap gap-2">
            {shipment.hasColdChain && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                CADENA DE FRÍO
              </span>
            )}
            {shipment.isUrgent && (
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">URGENTE</span>
            )}
            {shipment.isFragile && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">FRÁGIL</span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {shipment.notes && (
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Observaciones</h4>
          <div className="text-sm text-gray-800">{shipment.notes}</div>
        </div>
      )}

      {/* Delivery Note */}
      {shipment.deliveryNote && (
        <div className="border-t border-gray-300 pt-4 mb-4">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Nota de Entrega</h4>
          <div className="text-sm text-gray-800">{shipment.deliveryNote}</div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 text-center">
        <div className="text-xs text-gray-600">
          <div>Para consultas: info@gemico.com.ar | Tel: (011) 4567-8900</div>
          <div className="mt-1">Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</div>
        </div>
      </div>
    </div>
  )
}
