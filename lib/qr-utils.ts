import QRCode from "qrcode"

export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text, {
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
    throw error
  }
}

export const generateQRCodeBuffer = async (text: string): Promise<Buffer> => {
  try {
    const buffer = await QRCode.toBuffer(text, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return buffer
  } catch (error) {
    console.error("Error generating QR code buffer:", error)
    throw error
  }
}
