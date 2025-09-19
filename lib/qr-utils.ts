import QRCode from "qrcode"

export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    return "/placeholder.svg?height=200&width=200&text=QR"
  }
}

// Legacy function for compatibility
export function generateQRValue(shipmentNumber: string): string {
  return `https://gemico-envios.vercel.app/pedido/${shipmentNumber}`
}
