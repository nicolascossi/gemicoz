"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, FileDown, Search, Mail, Loader2, CalendarIcon, CheckCircle2, X, Download, FileText, Filter } from 'lucide-react'
import { format, isWithinInterval, parseISO, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { ref, get, update, onValue, off } from "firebase/database"
import { db, rtdb } from "@/lib/firebase"
import type { Shipment, Client } from "@/lib/types"
import ShipmentDetailModal from "@/components/shipment-detail-modal"
import { toast, useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { debounce } from "lodash"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

// Extended shipment type with client code
interface ExtendedShipment extends Shipment {
  clientCode?: string
  remitoTriplicado?: boolean
  pallets?: number
}

// Añadir onUpdateShipment a la interfaz ShipmentListProps
interface ShipmentListProps {
  shipments: ExtendedShipment[]
  showRemitoTriplicado: boolean
  onUpdateShipment?: (updatedShipment: ExtendedShipment) => void
  onDeleteShipment?: (deletedShipmentId: string) => void
  searchTerm: string
}

// Función de utilidad para formatear fechas de manera segura
const safeFormatDate = (date: string | Date, formatStr: string, options?: any): string => {
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (!isValid(dateObj)) {
      console.warn("Fecha inválida:", date)
      return "Fecha inválida"
    }
    return format(dateObj, formatStr, options)
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Fecha inválida"
  }
}

// Función de utilidad para validar fechas
const isValidDate = (dateStr: string): boolean => {
  try {
    const date = new Date(dateStr)
    return isValid(date)
  } catch (error) {
    return false
  }
}

// Función de utilidad para formatear números de manera segura
const safeFormatNumber = (value: number | undefined | null, decimals = 2): string => {
  try {
    if (value === undefined || value === null) return "0.00"
    return value.toFixed(decimals)
  } catch (error) {
    console.error("Error al formatear número:", error)
    return "0.00"
  }
}

// Función para extraer solo el número del envío (sin el prefijo ENV-)
const extractShipmentNumber = (shipmentNumber: string): string => {
  return shipmentNumber.replace("ENV-", "")
}

// Función para formatear la información de pallets y bultos
const formatPalletsAndPackages = (pallets?: number, packages?: number): string => {
  if (!pallets || pallets === 0) {
    return `${packages || 0} Bultos`
  }

  // Si hay pallets, mostrar "X Pallets and X/X Bultos"
  return `${pallets} Pallets y ${packages || 0} Bultos`
}

// Función para resaltar el texto que coincide con el término de búsqueda
const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!text || !searchTerm || searchTerm.trim() === "") {
    return text || "-"
  }

  const textStr = String(text)
  const searchTermLower = searchTerm.toLowerCase()

  // Si el texto no contiene el término de búsqueda, devolverlo sin cambios
  if (!textStr.toLowerCase().includes(searchTermLower)) {
    return textStr
  }

  // Dividir el texto en partes que coinciden y no coinciden con el término de búsqueda
  const parts = []
  let lastIndex = 0
  let index = textStr.toLowerCase().indexOf(searchTermLower)

  while (index !== -1) {
    // Añadir la parte que no coincide
    if (index > lastIndex) {
      parts.push(textStr.substring(lastIndex, index))
    }

    // Añadir la parte que coincide (usando el texto original para mantener mayúsculas/minúsculas)
    parts.push(
      <span key={`highlight-${index}`} className="bg-yellow-200 text-black px-0.5 rounded">
        {textStr.substring(index, index + searchTerm.length)}
      </span>,
    )

    lastIndex = index + searchTerm.length
    index = textStr.toLowerCase().indexOf(searchTermLower, lastIndex)
  }

  // Añadir el resto del texto después de la última coincidencia
  if (lastIndex < textStr.length) {
    parts.push(textStr.substring(lastIndex))
  }

  return <>{parts}</>
}

// Añadir el parámetro onUpdateShipment a la función ShipmentList
function ShipmentList({
  shipments = [],
  showRemitoTriplicado,
  onUpdateShipment,
  onDeleteShipment,
  searchTerm,
}: ShipmentListProps) {
  const [selectedShipment, setSelectedShipment] = useState<ExtendedShipment | null>(null)
  const [updatingRemito, setUpdatingRemito] = useState<string | null>(null)
  const router = useRouter()

  const handleRowClick = useCallback((shipment: ExtendedShipment) => {
    setSelectedShipment(shipment)
  }, [])

  const handleCloseModal = useCallback(() => {
    setSelectedShipment(null)
  }, [])

  // Modificar la función handleToggleRemitoTriplicado
  const handleToggleRemitoTriplicado = async (e: React.MouseEvent, shipment: ExtendedShipment) => {
    e.stopPropagation() // Evitar que se abra el modal de detalles

    if (updatingRemito) return // Evitar múltiples clics simultáneos

    setUpdatingRemito(shipment.id)

    try {
      const shipmentRef = ref(rtdb, `shipments/${shipment.id}`)
      const newValue = !shipment.remitoTriplicado

      // Actualizar en Firebase
      await update(shipmentRef, { remitoTriplicado: newValue })

      // Crear el envío actualizado
      const updatedShipment = { ...shipment, remitoTriplicado: newValue }

      // Notificar al componente padre sobre la actualización
      if (onUpdateShipment) {
        onUpdateShipment(updatedShipment)
      }

      toast({
        title: newValue ? "Remito triplicado recibido" : "Remito triplicado marcado como pendiente",
        description: `Se ha actualizado el estado del remito triplicado para el envío ${shipment.shipmentNumber}`,
        duration: 3000,
      })
    } catch (error) {
      console.error("Error al actualizar el estado del remito triplicado:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del remito triplicado",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setUpdatingRemito(null)
    }
  }

  return (
    <>
      <div className="w-full">
        <div className="rounded-md border overflow-hidden">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                {/* Eliminamos la columna de número de envío */}
                <TableHead className="w-[6%] text-xs">Fecha</TableHead>
                <TableHead className="w-[5%] text-xs">Código</TableHead>
                <TableHead className="w-[11%] text-xs">Cliente</TableHead>
                <TableHead className="w-[9%] text-xs">Transporte</TableHead>
                <TableHead className="w-[6%] text-xs">Pallets/Bultos</TableHead>
                <TableHead className="w-[4%] text-xs">Peso</TableHead>
                <TableHead className="w-[5%] text-xs">$ Valor</TableHead>
                <TableHead className="w-[5%] text-xs">$ Envío</TableHead>
                <TableHead className="w-[9%] text-xs">Factura</TableHead>
                <TableHead className="w-[9%] text-xs">Remito</TableHead>
                <TableHead className="w-[10%] text-xs">Nota Entrega</TableHead>
                <TableHead className="w-[4%] text-xs">Estado</TableHead>
                {showRemitoTriplicado && <TableHead className="w-[8%] text-xs">Remito Trip.</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(shipments) &&
                shipments.map((shipment) => (
                  <TableRow
                    key={shipment.id}
                    className="cursor-pointer hover:bg-muted/50 print:hover:bg-transparent"
                    onClick={() => handleRowClick(shipment)}
                  >
                    {/* Eliminamos la celda de número de envío */}
                    <TableCell className="text-xs truncate">{safeFormatDate(shipment.date, "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-xs truncate">{shipment.clientCode || "-"}</TableCell>
                    <TableCell className="text-xs truncate">{shipment.client}</TableCell>
                    <TableCell className="text-xs truncate">{shipment.transport}</TableCell>
                    <TableCell className="text-xs truncate">
                      {formatPalletsAndPackages(shipment.pallets, shipment.packages)}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      {shipment.weight ? shipment.weight.toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      $ {shipment.declaredValue ? shipment.declaredValue.toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell className="text-xs truncate">
                      $ {shipment.shippingCost ? shipment.shippingCost.toFixed(2) : "0.00"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal break-words">
                      {highlightText(shipment.invoiceNumber || "-", searchTerm)}
                    </TableCell>
                    <TableCell className="text-xs whitespace-normal break-words">
                      {highlightText(shipment.remitNumber || "-", searchTerm)}
                    </TableCell>
                    <TableCell className="text-xs truncate" title={shipment.deliveryNote || "Sin nota"}>
                      {highlightText(shipment.deliveryNote || "Sin nota", searchTerm)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={shipment.status === "sent" ? "default" : "secondary"} className="text-xs">
                        {shipment.status === "sent" ? "Enviado" : "Pendiente"}
                      </Badge>
                    </TableCell>
                    {showRemitoTriplicado && (
                      <TableCell>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={shipment.remitoTriplicado ? "default" : "destructive"}
                            className="text-xs truncate"
                          >
                            {shipment.remitoTriplicado ? "RECIBIDO" : "PENDIENTE"}
                          </Badge>
                          <Button
                            variant={shipment.remitoTriplicado ? "default" : "outline"}
                            size="sm"
                            className="h-6 w-6 p-0 ml-1 flex-shrink-0"
                            onClick={(e) => handleToggleRemitoTriplicado(e, shipment)}
                            disabled={updatingRemito === shipment.id}
                            title={shipment.remitoTriplicado ? "Marcar como pendiente" : "Marcar como recibido"}
                          >
                            {updatingRemito === shipment.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2
                                className={`h-3 w-3 ${
                                  shipment.remitoTriplicado ? "text-white" : "text-muted-foreground"
                                }`}
                              />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
      {selectedShipment && (
        <ShipmentDetailModal shipment={selectedShipment} onClose={handleCloseModal} showPrintButton={false} />
      )}
    </>
  )
}

export default function EnviosPorFechaPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [transportFilter, setTransportFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")

  // Get unique values for filters
  const uniqueTransports = [...new Set(shipments.map((s) => s.transport).filter(Boolean))]
  const uniqueClients = [...new Set(shipments.map((s) => s.client).filter(Boolean))]

  const loadShipments = async () => {
    if (!dateRange?.from || !dateRange?.to) return

    setLoading(true)
    try {
      const shipmentsRef = ref(rtdb, "shipments")
      const snapshot = await get(shipmentsRef)

      if (snapshot.exists()) {
        const data = snapshot.val()
        const shipmentsArray: Shipment[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }))

        // Filter by date range
        const filtered = shipmentsArray.filter((shipment) => {
          const shipmentDate = new Date(shipment.date)
          const fromDate = new Date(dateRange.from!)
          const toDate = new Date(dateRange.to!)

          // Set time to start/end of day for proper comparison
          fromDate.setHours(0, 0, 0, 0)
          toDate.setHours(23, 59, 59, 999)
          shipmentDate.setHours(12, 0, 0, 0) // Set to noon to avoid timezone issues

          return shipmentDate >= fromDate && shipmentDate <= toDate
        })

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setShipments(filtered)
      } else {
        setShipments([])
      }
    } catch (error) {
      console.error("Error loading shipments:", error)
      setShipments([])
    } finally {
      setLoading(false)
    }
  }

  // Apply filters and search
  useEffect(() => {
    let filtered = [...shipments]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (shipment) =>
          shipment.shipmentNumber?.toLowerCase().includes(searchLower) ||
          shipment.client?.toLowerCase().includes(searchLower) ||
          shipment.transport?.toLowerCase().includes(searchLower) ||
          shipment.clientAddress?.toLowerCase().includes(searchLower) ||
          shipment.invoiceNumber?.toLowerCase().includes(searchLower) ||
          shipment.remitNumber?.toLowerCase().includes(searchLower) ||
          shipment.deliveryNote?.toLowerCase().includes(searchLower) ||
          shipment.notes?.toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((shipment) => shipment.status === statusFilter)
    }

    // Apply transport filter
    if (transportFilter !== "all") {
      filtered = filtered.filter((shipment) => shipment.transport === transportFilter)
    }

    // Apply client filter
    if (clientFilter !== "all") {
      filtered = filtered.filter((shipment) => shipment.client === clientFilter)
    }

    setFilteredShipments(filtered)
  }, [shipments, searchTerm, statusFilter, transportFilter, clientFilter])

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTransportFilter("all")
    setClientFilter("all")
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(16)
    doc.text("Envíos por Fecha", 14, 15)

    // Add date range
    doc.setFontSize(12)
    const dateRangeText = `Período: ${format(dateRange?.from || new Date(), "dd/MM/yyyy", { locale: es })} - ${format(dateRange?.to || new Date(), "dd/MM/yyyy", { locale: es })}`
    doc.text(dateRangeText, 14, 25)

    // Prepare table data
    const tableData = filteredShipments.map((shipment) => [
      shipment.shipmentNumber || "",
      format(new Date(shipment.date), "dd/MM/yyyy", { locale: es }),
      shipment.client || "",
      shipment.transport || "",
      shipment.packages?.toString() || "0",
      shipment.pallets?.toString() || "0",
      shipment.status === "sent" ? "Enviado" : "Pendiente",
      shipment.invoiceNumber || "",
      shipment.remitNumber || "",
      shipment.deliveryNote || "",
    ])

    // Add table
    ;(doc as any).autoTable({
      head: [
        [
          "N° Envío",
          "Fecha",
          "Cliente",
          "Transporte",
          "Bultos",
          "Pallets",
          "Estado",
          "Factura",
          "Remito",
          "Nota Entrega",
        ],
      ],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    doc.save(`envios-${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const exportToExcel = () => {
    const excelData = filteredShipments.map((shipment) => ({
      "N° Envío": shipment.shipmentNumber || "",
      Fecha: format(new Date(shipment.date), "dd/MM/yyyy", { locale: es }),
      Cliente: shipment.client || "",
      Transporte: shipment.transport || "",
      Bultos: shipment.packages || 0,
      Pallets: shipment.pallets || 0,
      Estado: shipment.status === "sent" ? "Enviado" : "Pendiente",
      Factura: shipment.invoiceNumber || "",
      Remito: shipment.remitNumber || "",
      "Nota Entrega": shipment.deliveryNote || "",
      Dirección: shipment.clientAddress || "",
      "Peso (kg)": shipment.weight || 0,
      "Valor Declarado": shipment.declaredValue || 0,
      "Costo Envío": shipment.shippingCost || 0,
      Aclaraciones: shipment.notes || "",
    }))

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Envíos")

    XLSX.writeFile(wb, `envios-${format(new Date(), "yyyy-MM-dd")}.xlsx`)
  }

  const getStatusBadge = (status: string) => {
    return status === "sent" ? (
      <Badge variant="default" className="bg-green-500">
        Enviado
      </Badge>
    ) : (
      <Badge variant="secondary">Pendiente</Badge>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Envíos por Fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range Picker */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label>Rango de Fechas</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(dateRange.to, "dd/MM/yyyy", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={loadShipments} disabled={loading || !dateRange?.from || !dateRange?.to}>
              {loading ? "Cargando..." : "Buscar Envíos"}
            </Button>
          </div>

          {/* Filters and Search */}
          {shipments.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Buscar por número, cliente, transporte, factura, remito, nota entrega..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label>Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="sent">Enviado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Transporte</Label>
                  <Select value={transportFilter} onValueChange={setTransportFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los transportes</SelectItem>
                      {uniqueTransports.map((transport) => (
                        <SelectItem key={transport} value={transport}>
                          {transport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>Cliente</Label>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los clientes</SelectItem>
                      {uniqueClients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {filteredShipments.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={exportToPDF} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar Excel
              </Button>
            </div>
          )}

          {/* Results Summary */}
          {shipments.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Mostrando {filteredShipments.length} de {shipments.length} envíos
              {searchTerm || statusFilter !== "all" || transportFilter !== "all" || clientFilter !== "all"
                ? " (filtrados)"
                : ""}
            </div>
          )}

          {/* Shipments Table */}
          {filteredShipments.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Envío</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Transporte</TableHead>
                    <TableHead>Bultos</TableHead>
                    <TableHead>Pallets</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Remito</TableHead>
                    <TableHead>Nota Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow
                      key={shipment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <TableCell className="font-medium">{shipment.shipmentNumber}</TableCell>
                      <TableCell>{format(new Date(shipment.date), "dd/MM/yyyy", { locale: es })}</TableCell>
                      <TableCell>{shipment.client}</TableCell>
                      <TableCell>{shipment.transport}</TableCell>
                      <TableCell>{shipment.packages}</TableCell>
                      <TableCell>{shipment.pallets || 0}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>{shipment.invoiceNumber || "-"}</TableCell>
                      <TableCell>{shipment.remitNumber || "-"}</TableCell>
                      <TableCell>{shipment.deliveryNote || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* No Results */}
          {!loading && shipments.length === 0 && dateRange?.from && dateRange?.to && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron envíos en el rango de fechas seleccionado.
            </div>
          )}

          {!loading && filteredShipments.length === 0 && shipments.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron envíos que coincidan con los filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipment Detail Modal */}
      {selectedShipment && (
        <ShipmentDetailModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          showPrintButton={false}
        />
      )}
    </div>
  )
}
