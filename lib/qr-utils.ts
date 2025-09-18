import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 200,
    })

    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    // Return a placeholder image if QR generation fails
    return "/placeholder.svg?height=200&width=200&text=QR+Error"
  }
}

// Legacy function for compatibility
export function generateQRValue(shipment: { shipmentNumber: string }): string {
  return `https://gemico-envios.vercel.app/pedido/${shipment.shipmentNumber}`
}
