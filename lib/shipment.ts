import { ref, get, query, orderByChild, equalTo } from "firebase/database"
import { rtdb } from "./firebase"
import type { Shipment } from "./types"

export async function getShipmentByNumber(shipmentNumber: string): Promise<Shipment | null> {
  try {
    // First try to find by shipmentNumber
    const shipmentsRef = ref(rtdb, "shipments")
    const shipmentQuery = query(shipmentsRef, orderByChild("shipmentNumber"), equalTo(shipmentNumber))
    const snapshot = await get(shipmentQuery)

    if (snapshot.exists()) {
      const data = snapshot.val()
      const shipmentId = Object.keys(data)[0]
      const shipmentData = data[shipmentId]

      return {
        id: shipmentId,
        ...shipmentData,
      } as Shipment
    }

    // If not found by shipmentNumber, try to find by ID
    const shipmentRef = ref(rtdb, `shipments/${shipmentNumber}`)
    const directSnapshot = await get(shipmentRef)

    if (directSnapshot.exists()) {
      return {
        id: shipmentNumber,
        ...directSnapshot.val(),
      } as Shipment
    }

    return null
  } catch (error) {
    console.error("Error fetching shipment:", error)
    return null
  }
}

export async function getShipments(): Promise<Shipment[]> {
  try {
    const shipmentsRef = ref(rtdb, "shipments")
    const snapshot = await get(shipmentsRef)

    if (snapshot.exists()) {
      const shipmentsData = snapshot.val()
      return Object.entries(shipmentsData).map(([id, data]) => ({
        id,
        ...data,
      })) as Shipment[]
    }

    return []
  } catch (error) {
    console.error("Error fetching shipments:", error)
    return []
  }
}
