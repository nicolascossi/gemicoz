"use client"

import { useEffect, useState } from "react"
import { format, addHours } from "date-fns"
import { es } from "date-fns/locale"
import type { Shipment } from "@/lib/types"
import QRCode from "qrcode"
import Image from "next/image"

interface ShipmentLabelProps {
  shipment: Shipment
}

export default function ShipmentLabel({ shipment }: ShipmentLabelProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/pedido/${shipment.shipmentNumber}`
        const qrUrl = await QRCode.toDataURL(url, {
          width: 128,
          margin: 1,
        })
        setQrCodeUrl(qrUrl)
      } catch (error) {
        console.error("Error generating QR code:", error)
      }
    }

    generateQR()
  }, [shipment.shipmentNumber])

  // Calcular fecha y hora de vencimiento (24 horas después de ahora)
  const expirationDateTime = addHours(new Date(), 24)
  const formattedExpiration = format(expirationDateTime, "dd/MM/yyyy HH:mm")

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white">
      <div className="border-2 border-black p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Logo%20Gemico-uBE9D9uAFAorAj3wQ1JCsUhsu6oZwO.png"
              alt="Gemico Logo"
              width={120}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold">ETIQUETA DE ENVÍO</h1>
            <p className="text-lg font-semibold">{shipment.shipmentNumber}</p>
          </div>
          <div className="flex-1 flex justify-end">
            {qrCodeUrl && <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-16 h-16" />}
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="border border-black p-2">
          <h2 className="text-sm font-bold mb-2">DESTINATARIO:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Cliente:</strong> {shipment.client}
              </p>
              <p>
                <strong>Dirección:</strong> {shipment.clientAddress}
              </p>
              {shipment.clientPhone && (
                <p>
                  <strong>Teléfono:</strong> {shipment.clientPhone}
                </p>
              )}
            </div>
            <div>
              {shipment.clientEmail && (
                <p>
                  <strong>Email:</strong> {shipment.clientEmail}
                </p>
              )}
              <p>
                <strong>Fecha:</strong> {format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Información del Envío */}
        <div className="border border-black p-2">
          <h2 className="text-sm font-bold mb-2">INFORMACIÓN DEL ENVÍO:</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p>
                <strong>Bultos:</strong> {shipment.packages}
              </p>
              {shipment.pallets && shipment.pallets > 0 && (
                <p>
                  <strong>Pallets:</strong> {shipment.pallets}
                </p>
              )}
            </div>
            <div>
              {shipment.weight && shipment.weight > 0 && (
                <p>
                  <strong>Peso:</strong> {shipment.weight.toFixed(2)} kg
                </p>
              )}
              {shipment.declaredValue && shipment.declaredValue > 0 && (
                <p>
                  <strong>Valor:</strong> ${shipment.declaredValue.toFixed(2)}
                </p>
              )}
            </div>
            <div>
              <p>
                <strong>Transporte:</strong> {shipment.transport}
              </p>
            </div>
          </div>
        </div>

        {/* Características Especiales */}
        {(shipment.hasColdChain || shipment.isUrgent || shipment.isFragile) && (
          <div className="border border-black p-2">
            <h2 className="text-sm font-bold mb-2">CARACTERÍSTICAS ESPECIALES:</h2>
            <div className="space-y-1">
              {shipment.hasColdChain && (
                <div className="bg-blue-100 border border-blue-300 p-1 rounded text-[0.8rem] font-bold text-blue-800">
                  MEDICAMENTOS CON CADENA DE FRIO (DE 2° A 8°) VTO: {formattedExpiration}
                </div>
              )}
              {shipment.isUrgent && (
                <div className="bg-red-100 border border-red-300 p-1 rounded text-[0.65rem] font-bold text-red-800">
                  URGENTE
                </div>
              )}
              {shipment.isFragile && (
                <div className="bg-yellow-100 border border-yellow-300 p-1 rounded text-[0.65rem] font-bold text-yellow-800">
                  MUY FRÁGIL
                </div>
              )}
            </div>
          </div>
        )}

        {/* Números de Documento */}
        <div className="border border-black p-2">
          <h2 className="text-sm font-bold mb-2">DOCUMENTOS:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              {shipment.invoiceNumber && (
                <p>
                  <strong>Factura:</strong> {shipment.invoiceNumber}
                </p>
              )}
              {shipment.remitNumber && (
                <p>
                  <strong>Remito:</strong> {shipment.remitNumber}
                </p>
              )}
            </div>
            <div>
              {shipment.deliveryNote && (
                <p>
                  <strong>Nota Entrega:</strong> {shipment.deliveryNote}
                </p>
              )}
              {shipment.orderNote && (
                <p>
                  <strong>Nota Pedido:</strong> {shipment.orderNote}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Observaciones */}
        {shipment.notes && (
          <div className="border border-black p-2">
            <h2 className="text-sm font-bold mb-2">OBSERVACIONES:</h2>
            <p className="text-sm">{shipment.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 border-t border-black pt-2">
          <p>GEMICO - Sistema de Gestión de Envíos</p>
          <p>Generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
        </div>
      </div>
    </div>
  )
}
