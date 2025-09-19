"use client"

import React from "react"
import type { Shipment } from "@/lib/types"
import { generateQRCode } from "@/lib/qr-utils"

interface ShipmentLabelProps {
  shipment: Shipment
}

export default function ShipmentLabel({ shipment }: ShipmentLabelProps) {
  const [qrCode, setQrCode] = React.useState<string>("")

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const qrUrl = `${window.location.origin}/pedido/${shipment.shipmentNumber}`
        const qrDataURL = await generateQRCode(qrUrl)
        setQrCode(qrDataURL)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [shipment.shipmentNumber])

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-8 print:p-4">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-600">
        <div className="flex items-center space-x-4">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Gemico-uBE9D9uAFAorAj3wQ1JCsUhsu6oZwO.png"
            alt="Gemico Logo"
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-blue-600">GEMICO</h1>
            <p className="text-sm text-gray-600">Gestión de Envíos</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">ETIQUETA DE ENVÍO</h2>
          <p className="text-lg font-semibold text-blue-600">{shipment.shipmentNumber}</p>
        </div>
      </div>

      {/* Main Content - 3 Columns */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Column 1: Sender Info */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wide">REMITENTE</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">GEMICO S.A.</p>
              <p>Av. Corrientes 1234</p>
              <p>Buenos Aires, Argentina</p>
              <p>Tel: (011) 4567-8900</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">DETALLES DEL ENVÍO</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Fecha:</span> {new Date(shipment.date).toLocaleDateString("es-AR")}
              </p>
              <p>
                <span className="font-medium">Bultos:</span> {shipment.packages || 0}
              </p>
              {shipment.pallets && shipment.pallets > 0 && (
                <p>
                  <span className="font-medium">Pallets:</span> {shipment.pallets}
                </p>
              )}
              <p>
                <span className="font-medium">Peso:</span> {shipment.weight || 0} kg
              </p>
              <p>
                <span className="font-medium">Valor:</span> ${shipment.declaredValue || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Column 2: Recipient Info */}
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-bold text-green-800 mb-2 text-sm uppercase tracking-wide">DESTINATARIO</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-lg">{shipment.client}</p>
              <p>{shipment.clientAddress}</p>
              <p>
                {shipment.clientCity}, {shipment.clientProvince}
              </p>
              <p>CP: {shipment.clientPostalCode}</p>
              {shipment.clientPhone && <p>Tel: {shipment.clientPhone}</p>}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-bold text-orange-800 mb-2 text-sm uppercase tracking-wide">TRANSPORTE</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-lg">{shipment.transport}</p>
              <p>
                <span className="font-medium">Estado:</span>
                <span
                  className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                    shipment.status === "sent" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {shipment.status === "sent" ? "ENVIADO" : "PENDIENTE"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Column 3: QR Code and Documents */}
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <h3 className="font-bold text-purple-800 mb-3 text-sm uppercase tracking-wide">CÓDIGO QR</h3>
            {qrCode && (
              <div className="flex justify-center mb-2">
                <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-32 h-32" />
              </div>
            )}
            <p className="text-xs text-gray-600">Escanear para seguimiento</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wide">DOCUMENTOS</h3>
            <div className="space-y-1 text-sm">
              {shipment.invoiceNumber && (
                <p>
                  <span className="font-medium">Factura:</span> {shipment.invoiceNumber}
                </p>
              )}
              {shipment.remitNumber && (
                <p>
                  <span className="font-medium">Remito:</span> {shipment.remitNumber}
                </p>
              )}
              {shipment.deliveryNote && (
                <p>
                  <span className="font-medium">Nota Entrega:</span> {shipment.deliveryNote}
                </p>
              )}
              {shipment.orderNote && (
                <p>
                  <span className="font-medium">Nota Pedido:</span> {shipment.orderNote}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-4 mt-6">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            <p>© 2024 GEMICO S.A. - Todos los derechos reservados</p>
            <p>www.gemico.com.ar | info@gemico.com.ar</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Número de Seguimiento:</p>
            <p className="text-lg font-bold text-blue-600">{shipment.shipmentNumber}</p>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {shipment.notes && (
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <h4 className="font-bold text-yellow-800 mb-1">OBSERVACIONES:</h4>
          <p className="text-sm text-yellow-700">{shipment.notes}</p>
        </div>
      )}
    </div>
  )
}
