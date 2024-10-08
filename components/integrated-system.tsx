'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { ScrollArea } from "../components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Textarea } from "../components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet"
import { ChevronRight, User, Car, Printer, Wrench, Calendar, Gauge, Truck, AlertTriangle, Fuel, Receipt, X, CreditCard } from 'lucide-react'

// Interfaces
interface Responsable {
  id: number
  nombre: string
  licenciaFederal: string
  fechaEmisionLicencia: string
  fechaVencimientoLicencia: string
  imagenLicencia: string
  numeroINE: string
  fechaEmisionINE: string
  fechaVencimientoINE: string
  imagenINE: string
  numeroSeguridadSocial: string
  celularDirecto: string
  celularFamiliar: string
  seguro: string
  vehiculoAsignado?: number
}

interface Vehiculo {
  id: number
  marca: string
  modelo: string
  ano: string
  color: string
  kilometraje: number
  niv: string
  placas: string
  numeroTarjetaCirculacion: string
  imagenTarjetaCirculacion: string
  numeroPermisoFederal: string
  fotosFrente: string[]
  fotosDetras: string[]
  fotosCostadoIzquierdo: string[]
  fotosCostadoDerecho: string[]
  fotosParteDelantera: string[]
  fotosParteTrasera: string[]
}

interface Reparacion {
  id: string
  vehiculoId: number
  responsableId: number
  fechaEntrada: string
  fechaSalida: string
  kilometraje: number
  proveedor: string
  tipoReparacion: string[]
  descripcion: string
  tiempoGarantia: number
  unidadGarantia: 'días' | 'meses' | 'años'
  idFactura: string
  formaPago: string
  notasPago: string
  monto: number
  incluyeIVA: boolean
  fotos: string[]
  mantenimientoId?: string
  estado: 'Programado' | 'En proceso' | 'Realizado'
}

interface Mantenimiento {
  id: string
  vehiculoId: number
  responsableId: number
  kilometrajeProgramado: number
  fechaAproximada: string
  costoAproximado: number
  descripcion: string
  consecuenciaOmision: string
  reparacionId?: string
  estado: 'Programado' | 'En proceso' | 'Realizado'
}

interface TireChange {
  id: string
  vehicleId: number
  changeDate: string
  mileage: number
  provider: string
  changedTires: number[]
  tireBrand: string
  tireModel: string
  tireSerialNumbers: string
  recommendedLifeKm: number
  nextChangeRecommendation: number
  photos: string[]
  notes: string
  costs: Cost[]
  warrantyTime: number
  warrantyUnit: 'días' | 'meses' | 'años'
}

interface Cost {
  id: string
  unitCost: number
  quantity: number
  includesVAT: boolean
  subtotal: number
  vat: number
  total: number
  paymentMethod: string
  invoiceNumber: string
  notes: string
}

interface PagoVehicular {
  id: string
  vehiculoId: number
  tipoPago: 'Polizas Seguro' | 'Verificacion' | 'Tenencia/Control Vehicular' | 'Cambio de Placas' | 'Permiso'
  tipoPermiso?: string
  numeroDocumento: string
  fechaEmision: string
  fechaLimitePago: string
  montoPagado: number
  formaPago: string
  documento: string[]
  comprobantePago: string[]
}

// Utility functions
const generateId = (prefix: string) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

const getDaysRemaining = (date: string) => {
  const diff = new Date(date).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
}

const calcularDiasEnTaller = (fechaEntrada: string, fechaSalida: string) => {
  const entrada = new Date(fechaEntrada)
  const salida = new Date(fechaSalida)
  const diferencia = salida.getTime() - entrada.getTime()
  return Math.ceil(diferencia / (1000 * 3600 * 24))
}

const calcularDiasGarantiaRestantes = (fechaSalida: string, tiempoGarantia: number, unidadGarantia: string) => {
  const salida = new Date(fechaSalida)
  const hoy = new Date()
  let diasGarantia = tiempoGarantia
  if (unidadGarantia === 'meses') {
    diasGarantia *= 30
  } else if (unidadGarantia === 'años') {
    diasGarantia *= 365
  }
  const finGarantia = new Date(salida.getTime() + diasGarantia * 24 * 60 * 60 * 1000)
  const diferencia = finGarantia.getTime() - hoy.getTime()
  return Math.ceil(diferencia / (1000 * 3600 * 24))
}

const calcularDiasHastaMantenimiento = (fechaAproximada: string) => {
  const fecha = new Date(fechaAproximada)
  const hoy = new Date()
  const diferencia = fecha.getTime() - hoy.getTime()
  return Math.ceil(diferencia / (1000 * 3600 * 24))
}

const getColorClass = (dias: number) => {
  if (dias > 180) return 'text-green-500'
  if (dias > 90) return 'text-yellow-500'
  return 'text-red-500'
}

// Main component
export default function IntegratedSystem() {
  const [activeTab, setActiveTab] = useState('responsables')
  const [responsables, setResponsables] = useState<Responsable[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([])
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([])
  const [tireChanges, setTireChanges] = useState<TireChange[]>([])
  const [pagosVehiculares, setPagosVehiculares] = useState<PagoVehicular[]>([])
  const [editingResponsable, setEditingResponsable] = useState<Responsable | null>(null)
  const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null)
  const [editingReparacion, setEditingReparacion] = useState<Reparacion | null>(null)
  const [editingMantenimiento, setEditingMantenimiento] = useState<Mantenimiento | null>(null)
  const [editingTireChange, setEditingTireChange] = useState<TireChange | null>(null)
  const [editingPagoVehicular, setEditingPagoVehicular] = useState<PagoVehicular | null>(null)
  const [isNewResponsableOpen, setIsNewResponsableOpen] = useState(false)
  const [isNewVehiculoOpen, setIsNewVehiculoOpen] = useState(false)
  const [isNewReparacionOpen, setIsNewReparacionOpen] = useState(false)
  const [isNewMantenimientoOpen, setIsNewMantenimientoOpen] = useState(false)
  const [isNewTireChangeOpen, setIsNewTireChangeOpen] = useState(false)
  const [isNewPagoVehicularOpen, setIsNewPagoVehicularOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<{[key: string]: string[]}>({})
  const [selectedTires, setSelectedTires] = useState<number[]>([])
  const [isCostModalOpen, setIsCostModalOpen] = useState(false)
  const [currentTireChangeId, setCurrentTireChangeId] = useState<string | null>(null)
  const [editingCost, setEditingCost] = useState<Cost | null>(null)

  const tiposReparacion = [
    'Carrocería',
    'Parachoques',
    'Autoparte',
    'Sistema Eléctrico',
    'Sistema Mecánico',
    'Sistema de Enfriamiento'
  ]

  useEffect(() => {
    // Load data from localStorage on component mount
    const loadedResponsables = localStorage.getItem('responsables')
    const loadedVehiculos = localStorage.getItem('vehiculos')
    const loadedReparaciones = localStorage.getItem('reparaciones')
    const loadedMantenimientos = localStorage.getItem('mantenimientos')
    const loadedTireChanges = localStorage.getItem('tireChanges')
    const loadedPagosVehiculares = localStorage.getItem('pagosVehiculares')

    if (loadedResponsables) setResponsables(JSON.parse(loadedResponsables))
    if (loadedVehiculos) setVehiculos(JSON.parse(loadedVehiculos))
    if (loadedReparaciones) setReparaciones(JSON.parse(loadedReparaciones))
    if (loadedMantenimientos) setMantenimientos(JSON.parse(loadedMantenimientos))
    if (loadedTireChanges) setTireChanges(JSON.parse(loadedTireChanges))
    if (loadedPagosVehiculares) setPagosVehiculares(JSON.parse(loadedPagosVehiculares))
  }, [])

  useEffect(() => {
    // Save data to localStorage whenever it changes
    localStorage.setItem('responsables', JSON.stringify(responsables))
    localStorage.setItem('vehiculos', JSON.stringify(vehiculos))
    localStorage.setItem('reparaciones', JSON.stringify(reparaciones))
    localStorage.setItem('mantenimientos', JSON.stringify(mantenimientos))
    localStorage.setItem('tireChanges', JSON.stringify(tireChanges))
    localStorage.setItem('pagosVehiculares', JSON.stringify(pagosVehiculares))
  }, [responsables, vehiculos, reparaciones, mantenimientos, tireChanges, pagosVehiculares])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      const readerPromises = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readerPromises).then(results => {
        setPreviewImages(prev => ({ ...prev, [field]: results }))
      })
    }
  }

  const handleSaveResponsable = (responsable: Responsable) => {
    if (editingResponsable) {
      setResponsables(prev => prev.map(r => r.id === responsable.id ? {...responsable, ...previewImages} : r))
    } else {
      setResponsables(prev => [...prev, { ...responsable, id: Date.now(), ...previewImages }])
    }
    setIsNewResponsableOpen(false)
    setEditingResponsable(null)
    setPreviewImages({})
  }

  const handleSaveVehiculo = (vehiculo: Vehiculo) => {
    if (editingVehiculo) {
      setVehiculos(prev => prev.map(v => v.id === vehiculo.id ? {...vehiculo, ...previewImages} : v))
    } else {
      setVehiculos(prev => [...prev, { ...vehiculo, id: Date.now(), ...previewImages }])
    }
    setIsNewVehiculoOpen(false)
    setEditingVehiculo(null)
    setPreviewImages({})
  }

  const handleSaveReparacion = (reparacion: Reparacion) => {
    if (editingReparacion) {
      setReparaciones(prev => prev.map(r => r.id === reparacion.id ? {...reparacion, fotos: [...r.fotos, ...previewImages.fotos || []]} : r))
    } else {
      const newId = generateId('REP')
      setReparaciones(prev => [...prev, { ...reparacion, id: newId, fotos: previewImages.fotos || [] }])
    }
    if (reparacion.mantenimientoId && reparacion.mantenimientoId !== 'none') {
      setMantenimientos(prev => prev.map(m => 
        m.id === reparacion.mantenimientoId ? {...m, reparacionId: reparacion.id} : m
      ))
    }
    setIsNewReparacionOpen(false)
    setEditingReparacion(null)
    setPreviewImages({})
  }

  const handleSaveMantenimiento = (mantenimiento: Mantenimiento) => {
    if (editingMantenimiento) {
      setMantenimientos(prev => prev.map(m => m.id === mantenimiento.id ? mantenimiento : m))
    } else {
      const newId = generateId('MANT')
      setMantenimientos(prev => [...prev, { ...mantenimiento, id: newId }])
    }
    if (mantenimiento.reparacionId && mantenimiento.reparacionId !== 'none') {
      setReparaciones(prev => prev.map(r => 
        r.id === mantenimiento.reparacionId ? {...r, mantenimientoId: mantenimiento.id} : r
      ))
    }
    setIsNewMantenimientoOpen(false)
    setEditingMantenimiento(null)
  }

  const handleSaveTireChange = (tireChange: TireChange) => {
    if (editingTireChange) {
      setTireChanges(prev => prev.map(tc => tc.id === tireChange.id ? {...tireChange, photos: [...tc.photos, ...previewImages.photos || []]} : tc))
    } else {
      const newId = generateId('TC')
      setTireChanges(prev => [...prev, { ...tireChange, id: newId, photos: previewImages.photos || [] }])
    }
    setIsNewTireChangeOpen(false)
    setEditingTireChange(null)
    setPreviewImages({})
    setSelectedTires([])
  }

  const handleSavePagoVehicular = (pago: PagoVehicular) => {
    if (editingPagoVehicular) {
      setPagosVehiculares(prev => prev.map(p => p.id === pago.id ? {
        ...pago,
        documento: [...p.documento, ...previewImages.documento || []],
        comprobantePago: [...p.comprobantePago, ...previewImages.comprobantePago || []]
      } : p))
    } else {
      const newId = generateId('PV')
      setPagosVehiculares(prev => [...prev, {
        ...pago,
        id: newId,
        documento: previewImages.documento || [],
        comprobantePago: previewImages.comprobantePago || []
      }])
    }
    setIsNewPagoVehicularOpen(false)
    setEditingPagoVehicular(null)
    setPreviewImages({})
  }

  const handleSaveCost = (cost: Cost) => {
    if (currentTireChangeId) {
      setTireChanges(prev => prev.map(tc => {
        if (tc.id === currentTireChangeId) {
          const updatedCosts = editingCost
            ? tc.costs.map(c => c.id === cost.id ? cost : c)
            : [...tc.costs, { ...cost, id: generateId('COST') }]
          return {...tc, costs: updatedCosts}
        }
        return tc
      }))
    }
    setIsCostModalOpen(false)
    setEditingCost(null)
  }

  const handleDeleteResponsable = (id: number) => {
    setResponsables(prev => prev.filter(r => r.id !== id))
  }

  const handleDeleteVehiculo = (id: number) => {
    setVehiculos(prev => prev.filter(v => v.id !== id))
  }

  const handleDeleteReparacion = (id: string) => {
    setReparaciones(prev => prev.filter(r => r.id !== id))
    setMantenimientos(prev => prev.map(m => m.reparacionId === id ? {...m, reparacionId: undefined} : m))
  }

  const handleDeleteMantenimiento = (id: string) => {
    setMantenimientos(prev => prev.filter(m => m.id !== id))
    setReparaciones(prev => prev.map(r => r.mantenimientoId === id ? {...r, mantenimientoId: undefined} : r))
  }

  const handleDeleteTireChange = (id: string) => {
    setTireChanges(prev => prev.filter(tc => tc.id !== id))
  }

  const handleDeletePagoVehicular = (id: string) => {
    setPagosVehiculares(prev => prev.filter(p => p.id !== id))
  }

  const handleDeleteCost = (tireChangeId: string, costId: string) => {
    setTireChanges(prev => prev.map(tc => {
      if (tc.id === tireChangeId) {
        return {...tc, costs: tc.costs.filter(c => c.id !== costId)}
      }
      return tc
    }))
  }

  const handleEditResponsable = (id: number) => {
    const responsable = responsables.find(r => r.id === id)
    if (responsable) {
      setEditingResponsable(responsable)
      setIsNewResponsableOpen(true)
    }
  }

  const handleEditVehiculo = (id: number) => {
    const vehiculo = vehiculos.find(v => v.id === id)
    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setIsNewVehiculoOpen(true)
    }
  }

  const handleEditReparacion = (id: string) => {
    const reparacion = reparaciones.find(r => r.id === id)
    if (reparacion) {
      setEditingReparacion(reparacion)
      setPreviewImages({ fotos: reparacion.fotos })
      setIsNewReparacionOpen(true)
    }
  }

  const handleEditMantenimiento = (id: string) => {
    const mantenimiento = mantenimientos.find(m => m.id === id)
    if (mantenimiento) {
      setEditingMantenimiento(mantenimiento)
      setIsNewMantenimientoOpen(true)
    }
  }

  const handleEditTireChange = (id: string) => {
    const tireChange = tireChanges.find(tc => tc.id === id)
    if (tireChange) {
      setEditingTireChange(tireChange)
      setSelectedTires(tireChange.changedTires)
      setPreviewImages({photos: tireChange.photos})
      setIsNewTireChangeOpen(true)
    }
  }

  const handleEditPagoVehicular = (id: string) => {
    const pago = pagosVehiculares.find(p => p.id === id)
    if (pago) {
      setEditingPagoVehicular(pago)
      setPreviewImages({
        documento: pago.documento,
        comprobantePago: pago.comprobantePago
      })
      setIsNewPagoVehicularOpen(true)
    }
  }

  const handleEditCost = (cost: Cost) => {
    setEditingCost(cost)
    setIsCostModalOpen(true)
  }

  const handleTireSelection = (tireNumber: number) => {
    setSelectedTires(prev => 
      prev.includes(tireNumber) 
        ? prev.filter(t => t !== tireNumber) 
        : [...prev, tireNumber]
    )
  }

  const handlePrintResponsable = (id: number) => {
    const responsable = responsables.find(r => r.id === id)
    if (responsable) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ficha del Responsable</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .image-container { display: flex; justify-content: space-between; margin-top: 20px; }
                .image-container img { max-width: 30%; height: auto; }
                .signature { margin-top: 50px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Ficha del Responsable</h1>
                <p><strong>Nombre:</strong> ${responsable.nombre}</p>
                <p><strong>Licencia Federal:</strong> ${responsable.licenciaFederal}</p>
                <p><strong>Fecha de Emisión de Licencia:</strong> ${responsable.fechaEmisionLicencia}</p>
                <p><strong>Fecha de Vencimiento de Licencia:</strong> ${responsable.fechaVencimientoLicencia}</p>
                <p><strong>Número de INE:</strong> ${responsable.numeroINE}</p>
                <p><strong>Fecha de Emisión de INE:</strong> ${responsable.fechaEmisionINE}</p>
                <p><strong>Fecha de Vencimiento de INE:</strong> ${responsable.fechaVencimientoINE}</p>
                <p><strong>Número de Seguridad Social:</strong> ${responsable.numeroSeguridadSocial}</p>
                <p><strong>Celular Directo:</strong> ${responsable.celularDirecto}</p>
                <p><strong>Celular Familiar Cercano:</strong> ${responsable.celularFamiliar}</p>
                <p><strong>Vehículo Asignado:</strong> ${responsable.vehiculoAsignado ? vehiculos.find(v => v.id === responsable.vehiculoAsignado)?.placas || 'N/A' : 'N/A'}</p>
                <div class="image-container">
                  <img src="${responsable.imagenLicencia}" alt="Licencia">
                  <img src="${responsable.imagenINE}" alt="INE">
                  <img src="${responsable.seguro}" alt="Seguro">
                </div>
                <p>Declaro bajo protesta de decir verdad que la información proporcionada es verídica y correcta.</p>
                <div class="signature">
                  <p>____________________________</p>
                  <p>Firma del Responsable</p>
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handlePrintVehiculo = (id: number) => {
    const vehiculo = vehiculos.find(v => v.id === id)
    if (vehiculo) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ficha del Vehículo</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .image-container { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }
                .image-container img { max-width: 30%; height: auto; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Ficha del Vehículo</h1>
                <p><strong>Marca:</strong> ${vehiculo.marca}</p>
                <p><strong>Modelo:</strong> ${vehiculo.modelo}</p>
                <p><strong>Año:</strong> ${vehiculo.ano}</p>
                <p><strong>Color:</strong> ${vehiculo.color}</p>
                <p><strong>KM al momento del registro:</strong> ${vehiculo.kilometraje} km</p>
                <p><strong>NIV:</strong> ${vehiculo.niv}</p>
                <p><strong>Placas:</strong> ${vehiculo.placas}</p>
                <p><strong>Número de Tarjeta de Circulación:</strong> ${vehiculo.numeroTarjetaCirculacion}</p>
                <p><strong>Número de Permiso Federal:</strong> ${vehiculo.numeroPermisoFederal}</p>
                <h2>Imágenes del Vehículo</h2>
                <div class="image-container">
                  ${vehiculo.fotosFrente.map(foto => `<img src="${foto}" alt="Frente del Vehículo">`).join('')}
                  ${vehiculo.fotosDetras.map(foto => `<img src="${foto}" alt="Parte Trasera del Vehículo">`).join('')}
                  ${vehiculo.fotosCostadoIzquierdo.map(foto => `<img src="${foto}" alt="Costado Izquierdo del Vehículo">`).join('')}
                  ${vehiculo.fotosCostadoDerecho.map(foto => `<img src="${foto}" alt="Costado Derecho del Vehículo">`).join('')}
                  ${vehiculo.fotosParteDelantera.map(foto => `<img src="${foto}" alt="Parte Delantera del Vehículo">`).join('')}
                  ${vehiculo.fotosParteTrasera.map(foto => `<img src="${foto}" alt="Parte Trasera del Vehículo">`).join('')}
                </div>
                <h2>Documentos</h2>
                <div class="image-container">
                  <img src="${vehiculo.imagenTarjetaCirculacion}" alt="Tarjeta de Circulación">
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handlePrintReparacion = (id: string) => {
    const reparacion = reparaciones.find(r => r.id === id)
    if (reparacion) {
      const vehiculo = vehiculos.find(v => v.id === reparacion.vehiculoId)
      const responsable = responsables.find(r => r.id === reparacion.responsableId)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reporte de Reparación</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .image-container { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }
                .image-container img { max-width: 30%; height: auto; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Reporte de Reparación</h1>
                <p><strong>ID de Reparación:</strong> ${reparacion.id}</p>
                <p><strong>Vehículo:</strong> ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.ano} (${vehiculo.placas})` : 'No encontrado'}</p>
                <p><strong>Responsable:</strong> ${responsable ? responsable.nombre : 'No encontrado'}</p>
                <p><strong>Fecha de Entrada:</strong> ${reparacion.fechaEntrada}</p>
                <p><strong>Fecha de Salida:</strong> ${reparacion.fechaSalida}</p>
                <p><strong>Kilometraje:</strong> ${reparacion.kilometraje} km</p>
                <p><strong>Proveedor:</strong> ${reparacion.proveedor}</p>
                <p><strong>Tipo de Reparación:</strong> ${reparacion.tipoReparacion.join(', ')}</p>
                <p><strong>Descripción:</strong> ${reparacion.descripcion}</p>
                <p><strong>Garantía:</strong> ${reparacion.tiempoGarantia} ${reparacion.unidadGarantia}</p>
                <p><strong>ID Factura/Remisión:</strong> ${reparacion.idFactura}</p>
                <p><strong>Forma de Pago:</strong> ${reparacion.formaPago}</p>
                <p><strong>Notas de Pago:</strong> ${reparacion.notasPago}</p>
                <p><strong>Monto:</strong> $${reparacion.monto.toFixed(2)} ${reparacion.incluyeIVA ? '+ IVA' : '(Sin IVA)'}</p>
                ${reparacion.incluyeIVA ? `<p><strong>Desglose:</strong> $${(reparacion.monto / 1.16).toFixed(2)} + IVA (16%) = $${reparacion.monto.toFixed(2)}</p>` : ''}
                <p><strong>Estado:</strong> ${reparacion.estado}</p>
                ${reparacion.mantenimientoId ? `<p><strong>ID de Mantenimiento Programado:</strong> ${reparacion.mantenimientoId}</p>` : ''}
                <h2>Fotos</h2>
                <div class="image-container">
                  ${reparacion.fotos.map(foto => `<img src="${foto}" alt="Foto de reparación">`).join('')}
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handlePrintMantenimiento = (id: string) => {
    const mantenimiento = mantenimientos.find(m => m.id === id)
    if (mantenimiento) {
      const vehiculo = vehiculos.find(v => v.id === mantenimiento.vehiculoId)
      const responsable = responsables.find(r => r.id === mantenimiento.responsableId)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reporte de Mantenimiento Programado</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Reporte de Mantenimiento Programado</h1>
                <p><strong>ID de Mantenimiento:</strong> ${mantenimiento.id}</p>
                <p><strong>Vehículo:</strong> ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.ano} (${vehiculo.placas})` : 'No encontrado'}</p>
                <p><strong>Responsable:</strong> ${responsable ? responsable.nombre : 'No encontrado'}</p>
                <p><strong>Kilometraje Programado:</strong> ${mantenimiento.kilometrajeProgramado} km</p>
                <p><strong>Fecha Aproximada:</strong> ${mantenimiento.fechaAproximada}</p>
                <p><strong>Costo Aproximado:</strong> $${mantenimiento.costoAproximado.toFixed(2)}</p>
                <p><strong>Descripción:</strong> ${mantenimiento.descripcion}</p>
                <p><strong>Consecuencia de Omisión:</strong> ${mantenimiento.consecuenciaOmision}</p>
                <p><strong>Estado:</strong> ${mantenimiento.estado}</p>
                ${mantenimiento.reparacionId ? `<p><strong>ID de Reparación Asociada:</strong> ${mantenimiento.reparacionId}</p>` : ''}
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handlePrintTireChange = (id: string) => {
    const tireChange = tireChanges.find(tc => tc.id === id)
    if (tireChange) {
      const vehiculo = vehiculos.find(v => v.id === tireChange.vehicleId)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reporte de Cambio de Llantas</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .image-container { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }
                .image-container img { max-width: 30%; height: auto; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Reporte de Cambio de Llantas</h1>
                <p><strong>ID de Cambio:</strong> ${tireChange.id}</p>
                <p><strong>Vehículo:</strong> ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.ano} (${vehiculo.placas})` : 'No encontrado'}</p>
                <p><strong>Fecha de Cambio:</strong> ${tireChange.changeDate}</p>
                <p><strong>Kilometraje:</strong> ${tireChange.mileage} km</p>
                <p><strong>Proveedor:</strong> ${tireChange.provider}</p>
                <p><strong>Llantas Cambiadas:</strong> ${tireChange.changedTires.join(', ')}</p>
                <p><strong>Marca de Llantas:</strong> ${tireChange.tireBrand}</p>
                <p><strong>Modelo de Llantas:</strong> ${tireChange.tireModel}</p>
                <p><strong>Números de Serie:</strong> ${tireChange.tireSerialNumbers}</p>
                <p><strong>Vida Recomendada:</strong> ${tireChange.recommendedLifeKm} km</p>
                <p><strong>Próximo Cambio Recomendado:</strong> ${tireChange.nextChangeRecommendation} km</p>
                <p><strong>Tiempo de Garantía:</strong> ${tireChange.warrantyTime} ${tireChange.warrantyUnit}</p>
                <h2>Costos</h2>
                ${tireChange.costs.map(cost => `
                  <p><strong>Costo Unitario:</strong> $${cost.unitCost.toFixed(2)}</p>
                  <p><strong>Cantidad:</strong> ${cost.quantity}</p>
                  <p><strong>Subtotal:</strong> $${cost.subtotal.toFixed(2)}</p>
                  <p><strong>IVA:</strong> $${cost.vat.toFixed(2)}</p>
                  <p><strong>Total:</strong> $${cost.total.toFixed(2)}</p>
                  <p><strong>Forma de Pago:</strong> ${cost.paymentMethod}</p>
                  <p><strong>Número de Factura:</strong> ${cost.invoiceNumber}</p>
                  <p><strong>Observaciones:</strong> ${cost.notes}</p>
                `).join('<hr>')}
                <p><strong>Notas:</strong> ${tireChange.notes}</p>
                <h2>Fotos</h2>
                <div class="image-container">
                  ${tireChange.photos.map(photo => `<img src="${photo}" alt="Foto de cambio de llantas">`).join('')}
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handlePrintPagoVehicular = (id: string) => {
    const pago = pagosVehiculares.find(p => p.id === id)
    if (pago) {
      const vehiculo = vehiculos.find(v => v.id === pago.vehiculoId)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Reporte de Pago Vehicular</title>
              <style>
                body { font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; }
                .image-container { display: flex; flex-wrap: wrap; justify-content: space-between; margin-top: 20px; }
                .image-container img { max-width: 30%; height: auto; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Reporte de Pago Vehicular</h1>
                <p><strong>ID de Pago:</strong> ${pago.id}</p>
                <p><strong>Vehículo:</strong> ${vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.ano} (${vehiculo.placas})` : 'No encontrado'}</p>
                <p><strong>Tipo de Pago:</strong> ${pago.tipoPago}</p>
                ${pago.tipoPermiso ? `<p><strong>Tipo de Permiso:</strong> ${pago.tipoPermiso}</p>` : ''}
                <p><strong>Número de Documento:</strong> ${pago.numeroDocumento}</p>
                <p><strong>Fecha de Emisión:</strong> ${pago.fechaEmision}</p>
                <p><strong>Fecha Límite de Próximo Pago:</strong> ${pago.fechaLimitePago}</p>
                <p><strong>Monto Pagado:</strong> $${pago.montoPagado.toFixed(2)}</p>
                <p><strong>Forma de Pago:</strong> ${pago.formaPago}</p>
                <h2>Documentos</h2>
                <div class="image-container">
                  ${pago.documento.map(doc => `<img src="${doc}" alt="Documento">`).join('')}
                </div>
                <h2>Comprobantes de Pago</h2>
                <div class="image-container">
                  ${pago.comprobantePago.map(comp => `<img src="${comp}" alt="Comprobante de Pago">`).join('')}
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleClearData = () => {
    const confirmText = prompt("Para borrar todos los datos, escriba 'borrar' y presione Confirmar:")
    if (confirmText && confirmText.toLowerCase() === 'borrar') {
      localStorage.clear()
      setResponsables([])
      setVehiculos([])
      setReparaciones([])
      setMantenimientos([])
      setTireChanges([])
      setPagosVehiculares([])
      alert("Todos los datos han sido borrados.")
    } else {
      alert("Operación cancelada. Los datos no han sido borrados.")
    }
  }

  const handleDownloadData = () => {
    const data = {
      responsables,
      vehiculos,
      reparaciones,
      mantenimientos,
      tireChanges,
      pagosVehiculares
    }
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`
    const link = document.createElement("a")
    link.href = jsonString
    link.download = "fleet_management_data.json"
    link.click()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white p-4 shadow-md">
        <h2 className="mb-4 px-2 text-lg font-semibold tracking-tight">Secciones</h2>
        <div className="space-y-1">
          <Button 
            variant={activeTab === 'responsables' ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setActiveTab('responsables')}
          >
            <User className="mr-2 h-4 w-4" />
            Responsables
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button 
            variant={activeTab === 'vehiculos' ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setActiveTab('vehiculos')}
          >
            <Car className="mr-2 h-4 w-4" />
            Vehículos
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button 
            variant={activeTab === 'pagosVehiculares' ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setActiveTab('pagosVehiculares')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Pagos Vehiculares
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button 
            variant={activeTab === 'reparaciones' ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setActiveTab('reparaciones')}
          >
            <Wrench className="mr-2 h-4 w-4" />
            Reparaciones
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button 
            variant={activeTab === 'mantenimiento' ? "secondary" : "ghost"} 
            className="w-full justify-start"
            onClick={() => setActiveTab('mantenimiento')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Mantenimiento Programado
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button 
            variant={activeTab === 'llantas' ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab('llantas')}
          >
            <Truck className="mr-2 h-4 w-4" />
            Llantas
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Sanciones
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Fuel className="mr-2 h-4 w-4" />
            Consumos Gasolina
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Receipt className="mr-2 h-4 w-4" />
            Peajes
            <ChevronRight className="ml-auto h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <Button onClick={handleClearData} variant="destructive" className="w-full">
            Borrar Datos
          </Button>
          <Button onClick={handleDownloadData} variant="outline" className="w-full">
            Descargar Datos
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="responsables">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Responsables</h1>
                <Dialog open={isNewResponsableOpen} onOpenChange={setIsNewResponsableOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingResponsable(null)
                      setPreviewImages({})
                    }}>Nuevo Responsable</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingResponsable ? 'Editar' : 'Nuevo'} Responsable</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newResponsable: Responsable = {
                          id: editingResponsable?.id || Date.now(),
                          nombre: formData.get('nombre') as string,
                          licenciaFederal: formData.get('licenciaFederal') as string,
                          fechaEmisionLicencia: formData.get('fechaEmisionLicencia') as string,
                          fechaVencimientoLicencia: formData.get('fechaVencimientoLicencia') as string,
                          imagenLicencia: previewImages.imagenLicencia?.[0] || editingResponsable?.imagenLicencia || '',
                          numeroINE: formData.get('numeroINE') as string,
                          fechaEmisionINE: formData.get('fechaEmisionINE') as string,
                          fechaVencimientoINE: formData.get('fechaVencimientoINE') as string,
                          imagenINE: previewImages.imagenINE?.[0] || editingResponsable?.imagenINE || '',
                          numeroSeguridadSocial: formData.get('numeroSeguridadSocial') as string,
                          celularDirecto: formData.get('celularDirecto') as string,
                          celularFamiliar: formData.get('celularFamiliar') as string,
                          seguro: previewImages.seguro?.[0] || editingResponsable?.seguro || '',
                          vehiculoAsignado: Number(formData.get('vehiculoAsignado')) || undefined
                        }
                        handleSaveResponsable(newResponsable)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="nombre">Nombre</Label>
                          <Input id="nombre" name="nombre" defaultValue={editingResponsable?.nombre} required />
                        </div>
                        <div>
                          <Label htmlFor="licenciaFederal">Licencia Federal</Label>
                          <Input id="licenciaFederal" name="licenciaFederal" defaultValue={editingResponsable?.licenciaFederal} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaEmisionLicencia">Fecha de Emisión de Licencia</Label>
                          <Input id="fechaEmisionLicencia" name="fechaEmisionLicencia" type="date" defaultValue={editingResponsable?.fechaEmisionLicencia} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaVencimientoLicencia">Fecha de Vencimiento de Licencia</Label>
                          <Input id="fechaVencimientoLicencia" name="fechaVencimientoLicencia" type="date" defaultValue={editingResponsable?.fechaVencimientoLicencia} required />
                        </div>
                        <div>
                          <Label htmlFor="imagenLicencia">Imagen de Licencia</Label>
                          <Input id="imagenLicencia" name="imagenLicencia" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imagenLicencia')} />
                          {(previewImages.imagenLicencia?.[0] || editingResponsable?.imagenLicencia) && (
                            <img src={previewImages.imagenLicencia?.[0] || editingResponsable?.imagenLicencia} alt="Licencia" className="mt-2 max-w-full h-auto" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="numeroINE">Número de INE</Label>
                          <Input id="numeroINE" name="numeroINE" defaultValue={editingResponsable?.numeroINE} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaEmisionINE">Fecha de Emisión de INE</Label>
                          <Input id="fechaEmisionINE" name="fechaEmisionINE" type="date" defaultValue={editingResponsable?.fechaEmisionINE} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaVencimientoINE">Fecha de Vencimiento de INE</Label>
                          <Input id="fechaVencimientoINE" name="fechaVencimientoINE" type="date" defaultValue={editingResponsable?.fechaVencimientoINE} required />
                        </div>
                        <div>
                          <Label htmlFor="imagenINE">Imagen de INE</Label>
                          <Input id="imagenINE" name="imagenINE" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imagenINE')} />
                          {(previewImages.imagenINE?.[0] || editingResponsable?.imagenINE) && (
                            <img src={previewImages.imagenINE?.[0] || editingResponsable?.imagenINE} alt="INE" className="mt-2 max-w-full h-auto" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="numeroSeguridadSocial">Número de Seguridad Social</Label>
                          <Input id="numeroSeguridadSocial" name="numeroSeguridadSocial" defaultValue={editingResponsable?.numeroSeguridadSocial} required />
                        </div>
                        <div>
                          <Label htmlFor="celularDirecto">Celular Directo</Label>
                          <Input id="celularDirecto" name="celularDirecto" defaultValue={editingResponsable?.celularDirecto} required />
                        </div>
                        <div>
                          <Label htmlFor="celularFamiliar">Celular Familiar Cercano</Label>
                          <Input id="celularFamiliar" name="celularFamiliar" defaultValue={editingResponsable?.celularFamiliar} required />
                        </div>
                        <div>
                          <Label htmlFor="seguro">Seguro</Label>
                          <Input id="seguro" name="seguro" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'seguro')} />
                          {(previewImages.seguro?.[0] || editingResponsable?.seguro) && (
                            <img src={previewImages.seguro?.[0] || editingResponsable?.seguro} alt="Seguro" className="mt-2 max-w-full h-auto" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="vehiculoAsignado">Vehículo Asignado</Label>
                          <Select name="vehiculoAsignado" defaultValue={editingResponsable?.vehiculoAsignado?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Ninguno</SelectItem>
                              {vehiculos.map((vehiculo) => (
                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placas})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Licencia Federal</TableHead>
                        <TableHead>Vencimiento Licencia</TableHead>
                        <TableHead>Vencimiento INE</TableHead>
                        <TableHead>NSS</TableHead>
                        <TableHead>Celular Directo</TableHead>
                        <TableHead>Celular Familiar</TableHead>
                        <TableHead>Vehículo Asignado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {responsables.map((responsable) => (
                        <TableRow key={responsable.id}>
                          <TableCell>{responsable.nombre}</TableCell>
                          <TableCell>{responsable.licenciaFederal}</TableCell>
                          <TableCell className={getColorClass(getDaysRemaining(responsable.fechaVencimientoLicencia))}>
                            {responsable.fechaVencimientoLicencia}
                          </TableCell>
                          <TableCell className={getColorClass(getDaysRemaining(responsable.fechaVencimientoINE))}>
                            {responsable.fechaVencimientoINE}
                          </TableCell>
                          <TableCell>{responsable.numeroSeguridadSocial}</TableCell>
                          <TableCell>{responsable.celularDirecto}</TableCell>
                          <TableCell>{responsable.celularFamiliar}</TableCell>
                          <TableCell>{responsable.vehiculoAsignado ? vehiculos.find(v => v.id === responsable.vehiculoAsignado)?.placas || 'N/A' : 'N/A'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditResponsable(responsable.id)}>
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeleteResponsable(responsable.id)}>
                              Eliminar
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handlePrintResponsable(responsable.id)}>
                              Imprimir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="vehiculos">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Vehículos</h1>
                <Dialog open={isNewVehiculoOpen} onOpenChange={setIsNewVehiculoOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingVehiculo(null)
                      setPreviewImages({})
                    }}>Nuevo Vehículo</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingVehiculo ? 'Editar' : 'Nuevo'} Vehículo</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newVehiculo: Vehiculo = {
                          id: editingVehiculo?.id || Date.now(),
                          marca: formData.get('marca') as string,
                          modelo: formData.get('modelo') as string,
                          ano: formData.get('ano') as string,
                          color: formData.get('color') as string,
                          kilometraje: Number(formData.get('kilometraje')),
                          niv: formData.get('niv') as string,
                          placas: formData.get('placas') as string,
                          numeroTarjetaCirculacion: formData.get('numeroTarjetaCirculacion') as string,
                          imagenTarjetaCirculacion: previewImages.imagenTarjetaCirculacion?.[0] || editingVehiculo?.imagenTarjetaCirculacion || '',
                          numeroPermisoFederal: formData.get('numeroPermisoFederal') as string,
                          fotosFrente: previewImages.fotosFrente || editingVehiculo?.fotosFrente || [],
                          fotosDetras: previewImages.fotosDetras || editingVehiculo?.fotosDetras || [],
                          fotosCostadoIzquierdo: previewImages.fotosCostadoIzquierdo || editingVehiculo?.fotosCostadoIzquierdo || [],
                          fotosCostadoDerecho: previewImages.fotosCostadoDerecho || editingVehiculo?.fotosCostadoDerecho || [],
                          fotosParteDelantera: previewImages.fotosParteDelantera || editingVehiculo?.fotosParteDelantera || [],
                          fotosParteTrasera: previewImages.fotosParteTrasera || editingVehiculo?.fotosParteTrasera || []
                        }
                        handleSaveVehiculo(newVehiculo)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="marca">Marca</Label>
                          <Input id="marca" name="marca" defaultValue={editingVehiculo?.marca} required />
                        </div>
                        <div>
                          <Label htmlFor="modelo">Modelo</Label>
                          <Input id="modelo" name="modelo" defaultValue={editingVehiculo?.modelo} required />
                        </div>
                        <div>
                          <Label htmlFor="ano">Año</Label>
                          <Input id="ano" name="ano" defaultValue={editingVehiculo?.ano} required />
                        </div>
                        <div>
                          <Label htmlFor="color">Color</Label>
                          <Input id="color"

 name="color" defaultValue={editingVehiculo?.color} required />
                        </div>
                        <div>
                          <Label htmlFor="kilometraje">Kilometraje al momento del registro</Label>
                          <Input id="kilometraje" name="kilometraje" type="number" defaultValue={editingVehiculo?.kilometraje} required />
                        </div>
                        <div>
                          <Label htmlFor="niv">NIV</Label>
                          <Input id="niv" name="niv" defaultValue={editingVehiculo?.niv} required />
                        </div>
                        <div>
                          <Label htmlFor="placas">Placas</Label>
                          <Input id="placas" name="placas" defaultValue={editingVehiculo?.placas} required />
                        </div>
                        <div>
                          <Label htmlFor="numeroTarjetaCirculacion">Número de Tarjeta de Circulación</Label>
                          <Input id="numeroTarjetaCirculacion" name="numeroTarjetaCirculacion" defaultValue={editingVehiculo?.numeroTarjetaCirculacion} required />
                        </div>
                        <div>
                          <Label htmlFor="imagenTarjetaCirculacion">Imagen de Tarjeta de Circulación</Label>
                          <Input id="imagenTarjetaCirculacion" name="imagenTarjetaCirculacion" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imagenTarjetaCirculacion')} />
                          {(previewImages.imagenTarjetaCirculacion?.[0] || editingVehiculo?.imagenTarjetaCirculacion) && (
                            <img src={previewImages.imagenTarjetaCirculacion?.[0] || editingVehiculo?.imagenTarjetaCirculacion} alt="Tarjeta de Circulación" className="mt-2 max-w-full h-auto" />
                          )}
                        </div>
                        <div>
                          <Label htmlFor="numeroPermisoFederal">Número de Permiso Federal</Label>
                          <Input id="numeroPermisoFederal" name="numeroPermisoFederal" defaultValue={editingVehiculo?.numeroPermisoFederal} required />
                        </div>
                        <div>
                          <Label htmlFor="fotosFrente">Fotos del Frente</Label>
                          <Input id="fotosFrente" name="fotosFrente" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosFrente')} />
                          {(previewImages.fotosFrente || editingVehiculo?.fotosFrente)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Frente ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="fotosDetras">Fotos de Atrás</Label>
                          <Input id="fotosDetras" name="fotosDetras" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosDetras')} />
                          {(previewImages.fotosDetras || editingVehiculo?.fotosDetras)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Atrás ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="fotosCostadoIzquierdo">Fotos del Costado Izquierdo</Label>
                          <Input id="fotosCostadoIzquierdo" name="fotosCostadoIzquierdo" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosCostadoIzquierdo')} />
                          {(previewImages.fotosCostadoIzquierdo || editingVehiculo?.fotosCostadoIzquierdo)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Costado Izquierdo ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="fotosCostadoDerecho">Fotos del Costado Derecho</Label>
                          <Input id="fotosCostadoDerecho" name="fotosCostadoDerecho" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosCostadoDerecho')} />
                          {(previewImages.fotosCostadoDerecho || editingVehiculo?.fotosCostadoDerecho)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Costado Derecho ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="fotosParteDelantera">Fotos de la Parte Delantera</Label>
                          <Input id="fotosParteDelantera" name="fotosParteDelantera" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosParteDelantera')} />
                          {(previewImages.fotosParteDelantera || editingVehiculo?.fotosParteDelantera)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Parte Delantera ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="fotosParteTrasera">Fotos de la Parte Trasera</Label>
                          <Input id="fotosParteTrasera" name="fotosParteTrasera" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotosParteTrasera')} />
                          {(previewImages.fotosParteTrasera || editingVehiculo?.fotosParteTrasera)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Parte Trasera ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Marca</TableHead>
                        <TableHead>Modelo</TableHead>
                        <TableHead>Año</TableHead>
                        <TableHead>Placas</TableHead>
                        <TableHead>Vigencias</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiculos.map((vehiculo) => {
                        const ultimosPagos = pagosVehiculares
                          .filter(p => p.vehiculoId === vehiculo.id)
                          .reduce((acc, pago) => {
                            if (!acc[pago.tipoPago] || new Date(pago.fechaEmision) > new Date(acc[pago.tipoPago].fechaEmision)) {
                              acc[pago.tipoPago] = pago;
                            }
                            return acc;
                          }, {} as Record<string, PagoVehicular>);

                        return (
                          <TableRow key={vehiculo.id}>
                            <TableCell>{vehiculo.marca}</TableCell>
                            <TableCell>{vehiculo.modelo}</TableCell>
                            <TableCell>{vehiculo.ano}</TableCell>
                            <TableCell>{vehiculo.placas}</TableCell>
                            <TableCell>
                              {Object.entries(ultimosPagos).map(([tipo, pago]) => (
                                <div key={tipo} className={getColorClass(getDaysRemaining(pago.fechaLimitePago))}>
                                  {tipo}: {getDaysRemaining(pago.fechaLimitePago)} días
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditVehiculo(vehiculo.id)}>
                                Editar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeleteVehiculo(vehiculo.id)}>
                                Eliminar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintVehiculo(vehiculo.id)}>
                                Imprimir
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pagosVehiculares">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Pagos Vehiculares</h1>
                <Dialog open={isNewPagoVehicularOpen} onOpenChange={setIsNewPagoVehicularOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingPagoVehicular(null)
                      setPreviewImages({})
                    }}>Nuevo Pago</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingPagoVehicular ? 'Editar' : 'Nuevo'} Pago Vehicular</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newPago: PagoVehicular = {
                          id: editingPagoVehicular?.id || generateId('PV'),
                          vehiculoId: Number(formData.get('vehiculoId')),
                          tipoPago: formData.get('tipoPago') as PagoVehicular['tipoPago'],
                          tipoPermiso: formData.get('tipoPermiso') as string,
                          numeroDocumento: formData.get('numeroDocumento') as string,
                          fechaEmision: formData.get('fechaEmision') as string,
                          fechaLimitePago: formData.get('fechaLimitePago') as string,
                          montoPagado: Number(formData.get('montoPagado')),
                          formaPago: formData.get('formaPago') as string,
                          documento: previewImages.documento || editingPagoVehicular?.documento || [],
                          comprobantePago: previewImages.comprobantePago || editingPagoVehicular?.comprobantePago || []
                        }
                        handleSavePagoVehicular(newPago)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="vehiculoId">Vehículo</Label>
                          <Select name="vehiculoId" defaultValue={editingPagoVehicular?.vehiculoId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehiculos.map((vehiculo) => (
                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placas})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tipoPago">Tipo de Pago</Label>
                          <Select name="tipoPago" defaultValue={editingPagoVehicular?.tipoPago}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione el tipo de pago" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Polizas Seguro">Pólizas Seguro</SelectItem>
                              <SelectItem value="Verificacion">Verificación</SelectItem>
                              <SelectItem value="Tenencia/Control Vehicular">Tenencia/Control Vehicular</SelectItem>
                              <SelectItem value="Cambio de Placas">Cambio de Placas</SelectItem>
                              <SelectItem value="Permiso">Permiso</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tipoPermiso">Tipo de Permiso (si aplica)</Label>
                          <Input id="tipoPermiso" name="tipoPermiso" defaultValue={editingPagoVehicular?.tipoPermiso} />
                        </div>
                        <div>
                          <Label htmlFor="numeroDocumento">Número de Documento</Label>
                          <Input id="numeroDocumento" name="numeroDocumento" defaultValue={editingPagoVehicular?.numeroDocumento} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaEmision">Fecha de Emisión</Label>
                          <Input id="fechaEmision" name="fechaEmision" type="date" defaultValue={editingPagoVehicular?.fechaEmision} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaLimitePago">Fecha Límite de Próximo Pago</Label>
                          <Input id="fechaLimitePago" name="fechaLimitePago" type="date" defaultValue={editingPagoVehicular?.fechaLimitePago} required />
                        </div>
                        <div>
                          <Label htmlFor="montoPagado">Monto Pagado</Label>
                          <Input id="montoPagado" name="montoPagado" type="number" step="0.01" defaultValue={editingPagoVehicular?.montoPagado} required />
                        </div>
                        <div>
                          <Label htmlFor="formaPago">Forma de Pago</Label>
                          <Input id="formaPago" name="formaPago" defaultValue={editingPagoVehicular?.formaPago} required />
                        </div>
                        <div>
                          <Label htmlFor="documento">Documento</Label>
                          <Input id="documento" name="documento" type="file" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'documento')} />
                          {(previewImages.documento || editingPagoVehicular?.documento)?.map((doc, index) => (
                            <img key={index} src={doc} alt={`Documento ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="comprobantePago">Comprobante de Pago</Label>
                          <Input id="comprobantePago" name="comprobantePago" type="file" accept="image/*,application/pdf" multiple onChange={(e) => handleFileChange(e, 'comprobantePago')} />
                          {(previewImages.comprobantePago || editingPagoVehicular?.comprobantePago)?.map((comp, index) => (
                            <img key={index} src={comp} alt={`Comprobante ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Tipo de Pago</TableHead>
                        <TableHead>Número de Documento</TableHead>
                        <TableHead>Fecha de Emisión</TableHead>
                        <TableHead>Fecha Límite de Próximo Pago</TableHead>
                        <TableHead>Monto Pagado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosVehiculares.map((pago) => {
                        const vehiculo = vehiculos.find(v => v.id === pago.vehiculoId)
                        return (
                          <TableRow key={pago.id}>
                            <TableCell>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'N/A'}</TableCell>
                            <TableCell>{pago.tipoPago}</TableCell>
                            <TableCell>{pago.numeroDocumento}</TableCell>
                            <TableCell>{pago.fechaEmision}</TableCell>
                            <TableCell className={getColorClass(getDaysRemaining(pago.fechaLimitePago))}>
                              {pago.fechaLimitePago}
                            </TableCell>
                            <TableCell>${pago.montoPagado.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditPagoVehicular(pago.id)}>
                                Editar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeletePagoVehicular(pago.id)}>
                                Eliminar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintPagoVehicular(pago.id)}>
                                Imprimir
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reparaciones">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Reparaciones</h1>
                <Dialog open={isNewReparacionOpen} onOpenChange={setIsNewReparacionOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingReparacion(null)
                      setPreviewImages({})
                    }}>Nueva Reparación</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingReparacion ? 'Editar' : 'Nueva'} Reparación</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newReparacion: Reparacion = {
                          id: editingReparacion?.id || generateId('REP'),
                          vehiculoId: Number(formData.get('vehiculoId')),
                          responsableId: Number(formData.get('responsableId')),
                          fechaEntrada: formData.get('fechaEntrada') as string,
                          fechaSalida: formData.get('fechaSalida') as string,
                          kilometraje: Number(formData.get('kilometraje')),
                          proveedor: formData.get('proveedor') as string,
                          tipoReparacion: formData.getAll('tipoReparacion') as string[],
                          descripcion: formData.get('descripcion') as string,
                          tiempoGarantia: Number(formData.get('tiempoGarantia')),
                          unidadGarantia: formData.get('unidadGarantia') as 'días' | 'meses' | 'años',
                          idFactura: formData.get('idFactura') as string,
                          formaPago: formData.get('formaPago') as string,
                          notasPago: formData.get('notasPago') as string,
                          monto: Number(formData.get('monto')),
                          incluyeIVA: formData.get('incluyeIVA') === 'on',
                          fotos: previewImages.fotos || editingReparacion?.fotos || [],
                          mantenimientoId: formData.get('mantenimientoId') as string,
                          estado: formData.get('estado') as 'Programado' | 'En proceso' | 'Realizado'
                        }
                        handleSaveReparacion(newReparacion)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="vehiculoId">Vehículo</Label>
                          <Select name="vehiculoId" defaultValue={editingReparacion?.vehiculoId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehiculos.map((vehiculo) => (
                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placas})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="responsableId">Responsable</Label>
                          <Select name="responsableId" defaultValue={editingReparacion?.responsableId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un responsable" />
                            </SelectTrigger>
                            <SelectContent>
                              {responsables.map((responsable) => (
                                <SelectItem key={responsable.id} value={responsable.id.toString()}>
                                  {responsable.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="fechaEntrada">Fecha de Entrada</Label>
                          <Input id="fechaEntrada" name="fechaEntrada" type="date" defaultValue={editingReparacion?.fechaEntrada} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaSalida">Fecha de Salida</Label>
                          <Input id="fechaSalida" name="fechaSalida" type="date" defaultValue={editingReparacion?.fechaSalida} required />
                        </div>
                        <div>
                          <Label htmlFor="kilometraje">Kilometraje</Label>
                          <Input id="kilometraje" name="kilometraje" type="number" defaultValue={editingReparacion?.kilometraje} required />
                        </div>
                        <div>
                          <Label htmlFor="proveedor">Proveedor</Label>
                          <Input id="proveedor" name="proveedor" defaultValue={editingReparacion?.proveedor} required />
                        </div>
                        <div>
                          <Label>Tipo de Reparación</Label>
                          {tiposReparacion.map((tipo) => (
                            <div key={tipo} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`tipoReparacion-${tipo}`} 
                                name="tipoReparacion" 
                                value={tipo} 
                                defaultChecked={editingReparacion?.tipoReparacion.includes(tipo)}
                              />
                              <label htmlFor={`tipoReparacion-${tipo}`}>{tipo}</label>
                            </div>
                          ))}
                        </div>
                        <div>
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Textarea id="descripcion" name="descripcion" defaultValue={editingReparacion?.descripcion} required />
                        </div>
                        <div>
                          <Label htmlFor="tiempoGarantia">Tiempo de Garantía</Label>
                          <Input id="tiempoGarantia" name="tiempoGarantia" type="number" defaultValue={editingReparacion?.tiempoGarantia} required />
                        </div>
                        <div>
                          <Label htmlFor="unidadGarantia">Unidad de Garantía</Label>
                          <Select name="unidadGarantia" defaultValue={editingReparacion?.unidadGarantia}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="días">Días</SelectItem>
                              <SelectItem value="meses">Meses</SelectItem>
                              <SelectItem value="años">Años</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="idFactura">ID Factura/Remisión</Label>
                          <Input id="idFactura" name="idFactura" defaultValue={editingReparacion?.idFactura} required />
                        </div>
                        <div>
                          <Label htmlFor="formaPago">Forma de Pago</Label>
                          <Input id="formaPago" name="formaPago" defaultValue={editingReparacion?.formaPago} required />
                        </div>
                        <div>
                          <Label htmlFor="notasPago">Notas de Pago</Label>
                          <Textarea id="notasPago" name="notasPago" defaultValue={editingReparacion?.notasPago} />
                        </div>
                        <div>
                          <Label htmlFor="monto">Monto</Label>
                          <Input id="monto" name="monto" type="number" step="0.01" defaultValue={editingReparacion?.monto} required />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="incluyeIVA" name="incluyeIVA" defaultChecked={editingReparacion?.incluyeIVA} />
                          <label htmlFor="incluyeIVA">Incluye IVA</label>
                        </div>
                        <div>
                          <Label htmlFor="mantenimientoId">Mantenimiento Programado</Label>
                          <Select name="mantenimientoId" defaultValue={editingReparacion?.mantenimientoId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un mantenimiento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguno</SelectItem>
                              {mantenimientos.map((mantenimiento) => (
                                <SelectItem key={mantenimiento.id} value={mantenimiento.id}>
                                  {mantenimiento.id} - {mantenimiento.descripcion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado</Label>
                          <Select name="estado" defaultValue={editingReparacion?.estado}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Programado">Programado</SelectItem>
                              <SelectItem value="En proceso">En proceso</SelectItem>
                              <SelectItem value="Realizado">Realizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="fotos">Fotos del Evento</Label>
                          <Input id="fotos" name="fotos" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'fotos')} />
                          {(previewImages.fotos || editingReparacion?.fotos)?.map((foto, index) => (
                            <img key={index} src={foto} alt={`Foto ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Fecha de Entrada</TableHead>
                        <TableHead>Fecha de Salida</TableHead>
                        <TableHead>Días en Taller</TableHead>
                        <TableHead>Tipo de Reparación</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Garantía Restante</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Mantenimiento Asociado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reparaciones.map((reparacion) => {
                        const vehiculo = vehiculos.find(v => v.id === reparacion.vehiculoId)
                        const responsable = responsables.find(r => r.id === reparacion.responsableId)
                        const diasEnTaller = calcularDiasEnTaller(reparacion.fechaEntrada, reparacion.fechaSalida)
                        const garantiaRestante = calcularDiasGarantiaRestantes(reparacion.fechaSalida, reparacion.tiempoGarantia, reparacion.unidadGarantia)
                        const mantenimientoAsociado = mantenimientos.find(m => m.id === reparacion.mantenimientoId)
                        return (
                          <TableRow key={reparacion.id}>
                            <TableCell>{reparacion.id}</TableCell>
                            <TableCell>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'N/A'}</TableCell>
                            <TableCell>{responsable ? responsable.nombre : 'N/A'}</TableCell>
                            <TableCell>{reparacion.fechaEntrada}</TableCell>
                            <TableCell>{reparacion.fechaSalida}</TableCell>
                            <TableCell>{diasEnTaller}</TableCell>
                            <TableCell>{reparacion.tipoReparacion.join(', ')}</TableCell>
                            <TableCell>${reparacion.monto.toFixed(2)} {reparacion.incluyeIVA ? '+ IVA' : ''}</TableCell>
                            <TableCell>{garantiaRestante} días</TableCell>
                            <TableCell>{reparacion.estado}</TableCell>
                            <TableCell>{mantenimientoAsociado ? mantenimientoAsociado.id : 'N/A'}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditReparacion(reparacion.id)}>
                                Editar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeleteReparacion(reparacion.id)}>
                                Eliminar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintReparacion(reparacion.id)}>
                                Imprimir
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="mantenimiento">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Mantenimiento Programado</h1>
                <Dialog open={isNewMantenimientoOpen} onOpenChange={setIsNewMantenimientoOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingMantenimiento(null)
                    }}>Nuevo Mantenimiento</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingMantenimiento ? 'Editar' : 'Nuevo'} Mantenimiento</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newMantenimiento: Mantenimiento = {
                          id: editingMantenimiento?.id || generateId('MANT'),
                          vehiculoId: Number(formData.get('vehiculoId')),
                          responsableId: Number(formData.get('responsableId')),
                          kilometrajeProgramado: Number(formData.get('kilometrajeProgramado')),
                          fechaAproximada: formData.get('fechaAproximada') as string,
                          costoAproximado: Number(formData.get('costoAproximado')),
                          descripcion: formData.get('descripcion') as string,
                          consecuenciaOmision: formData.get('consecuenciaOmision') as string,
                          reparacionId: formData.get('reparacionId') as string,
                          estado: formData.get('estado') as 'Programado' | 'En proceso' | 'Realizado'
                        }
                        handleSaveMantenimiento(newMantenimiento)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="vehiculoId">Vehículo</Label>
                          <Select name="vehiculoId" defaultValue={editingMantenimiento?.vehiculoId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehiculos.map((vehiculo) => (
                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placas})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="responsableId">Responsable</Label>
                          <Select name="responsableId" defaultValue={editingMantenimiento?.responsableId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un responsable" />
                            </SelectTrigger>
                            <SelectContent>
                              {responsables.map((responsable) => (
                                <SelectItem key={responsable.id} value={responsable.id.toString()}>
                                  {responsable.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="kilometrajeProgramado">Kilometraje Programado</Label>
                          <Input id="kilometrajeProgramado" name="kilometrajeProgramado" type="number" defaultValue={editingMantenimiento?.kilometrajeProgramado} required />
                        </div>
                        <div>
                          <Label htmlFor="fechaAproximada">Fecha Aproximada</Label>
                          <Input id="fechaAproximada" name="fechaAproximada" type="date" defaultValue={editingMantenimiento?.fechaAproximada} required />
                        </div>
                        <div>
                          <Label htmlFor="costoAproximado">Costo Aproximado</Label>
                          <Input id="costoAproximado" name="costoAproximado" type="number" step="0.01" defaultValue={editingMantenimiento?.costoAproximado} required />
                        </div>
                        <div>
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Textarea id="descripcion" name="descripcion" defaultValue={editingMantenimiento?.descripcion} required />
                        </div>
                        <div>
                          <Label htmlFor="consecuenciaOmision">Consecuencia de Omisión</Label>
                          <Textarea id="consecuenciaOmision" name="consecuenciaOmision" defaultValue={editingMantenimiento?.consecuenciaOmision} required />
                        </div>
                        <div>
                          <Label htmlFor="reparacionId">Reparación Asociada</Label>
                          <Select name="reparacionId" defaultValue={editingMantenimiento?.reparacionId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una reparación" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguna</SelectItem>
                              {reparaciones.map((reparacion) => (
                                <SelectItem key={reparacion.id} value={reparacion.id}>
                                  {reparacion.id} - {reparacion.descripcion}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado</Label>
                          <Select name="estado" defaultValue={editingMantenimiento?.estado}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Programado">Programado</SelectItem>
                              <SelectItem value="En proceso">En proceso</SelectItem>
                              <SelectItem value="Realizado">Realizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Kilometraje Programado</TableHead>
                        <TableHead>Fecha Aproximada</TableHead>
                        <TableHead>Días Restantes</TableHead>
                        <TableHead>Costo Aproximado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Consecuencia de Omisión</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mantenimientos.map((mantenimiento) => {
                        const vehiculo = vehiculos.find(v => v.id === mantenimiento.vehiculoId)
                        const responsable = responsables.find(r => r.id === mantenimiento.responsableId)
                        const diasRestantes = calcularDiasHastaMantenimiento(mantenimiento.fechaAproximada)
                        return (
                          <TableRow key={mantenimiento.id}>
                            <TableCell>{mantenimiento.id}</TableCell>
                            <TableCell>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'N/A'}</TableCell>
                            <TableCell>{responsable ? responsable.nombre : 'N/A'}</TableCell>
                            <TableCell>{mantenimiento.kilometrajeProgramado} km</TableCell>
                            <TableCell>{mantenimiento.fechaAproximada}</TableCell>
                            <TableCell className={getColorClass(diasRestantes)}>{diasRestantes} días</TableCell>
                            <TableCell>${mantenimiento.costoAproximado.toFixed(2)}</TableCell>
                            <TableCell>{mantenimiento.estado}</TableCell>
                            <TableCell>{mantenimiento.consecuenciaOmision}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditMantenimiento(mantenimiento.id)}>
                                Editar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeleteMantenimiento(mantenimiento.id)}>
                                Eliminar
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handlePrintMantenimiento(mantenimiento.id)}>
                                Imprimir
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="llantas">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Cambio de Llantas</h1>
                <Dialog open={isNewTireChangeOpen} onOpenChange={setIsNewTireChangeOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingTireChange(null)
                      setPreviewImages({})
                      setSelectedTires([])
                    }}>Nuevo Cambio de Llantas</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingTireChange ? 'Editar' : 'Nuevo'} Cambio de Llantas</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[400px] pr-4">
                      <form onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.currentTarget)
                        const newTireChange: TireChange = {
                          id: editingTireChange?.id || generateId('TC'),
                          vehicleId: Number(formData.get('vehicleId')),
                          changeDate: formData.get('changeDate') as string,
                          mileage: Number(formData.get('mileage')),
                          provider: formData.get('provider') as string,
                          changedTires: selectedTires,
                          tireBrand: formData.get('tireBrand') as string,
                          tireModel: formData.get('tireModel') as string,
                          tireSerialNumbers: formData.get('tireSerialNumbers') as string,
                          recommendedLifeKm: Number(formData.get('recommendedLifeKm')),
                          nextChangeRecommendation: Number(formData.get('nextChangeRecommendation')),
                          photos: previewImages.photos || editingTireChange?.photos || [],
                          notes: formData.get('notes') as string,
                          costs: editingTireChange?.costs || [],
                          warrantyTime: Number(formData.get('warrantyTime')),
                          warrantyUnit: formData.get('warrantyUnit') as 'días' | 'meses' | 'años'
                        }
                        handleSaveTireChange(newTireChange)
                      }} className="space-y-4">
                        <div>
                          <Label htmlFor="vehicleId">Vehículo</Label>
                          <Select name="vehicleId" defaultValue={editingTireChange?.vehicleId?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un vehículo" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehiculos.map((vehiculo) => (
                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                  {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placas})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="changeDate">Fecha de Cambio</Label>
                          <Input id="changeDate" name="changeDate" type="date" defaultValue={editingTireChange?.changeDate} required />
                        </div>
                        <div>
                          <Label htmlFor="mileage">Kilometraje de Cambio</Label>
                          <Input id="mileage" name="mileage" type="number" defaultValue={editingTireChange?.mileage} required />
                        </div>
                        <div>
                          <Label htmlFor="provider">Proveedor</Label>
                          <Input id="provider" name="provider" defaultValue={editingTireChange?.provider} required />
                        </div>
                        <div>
                          <Label>Llantas Cambiadas</Label>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((tireNumber) => (
                              <Button
                                key={tireNumber}
                                type="button"
                                variant={selectedTires.includes(tireNumber) ? "default" : "outline"}
                                onClick={() => handleTireSelection(tireNumber)}
                              >
                                Llanta {tireNumber}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="tireBrand">Marca de Llantas</Label>
                          <Input id="tireBrand" name="tireBrand" defaultValue={editingTireChange?.tireBrand} required />
                        </div>
                        <div>
                          <Label htmlFor="tireModel">Modelo de Llantas</Label>
                          <Input id="tireModel" name="tireModel" defaultValue={editingTireChange?.tireModel} required />
                        </div>
                        <div>
                          <Label htmlFor="tireSerialNumbers">Números de Serie de Llantas (Separado por comas)</Label>
                          <Input id="tireSerialNumbers" name="tireSerialNumbers" defaultValue={editingTireChange?.tireSerialNumbers} required />
                        </div>
                        <div>
                          <Label htmlFor="recommendedLifeKm">Vida Recomendada (km)</Label>
                          <Input id="recommendedLifeKm" name="recommendedLifeKm" type="number" defaultValue={editingTireChange?.recommendedLifeKm} required />
                        </div>
                        <div>
                          <Label htmlFor="nextChangeRecommendation">Próximo Cambio Recomendado (km)</Label>
                          <Input id="nextChangeRecommendation" name="nextChangeRecommendation" type="number" defaultValue={editingTireChange?.nextChangeRecommendation} required />
                        </div>
                        <div>
                          <Label htmlFor="warrantyTime">Tiempo de Garantía</Label>
                          <Input id="warrantyTime" name="warrantyTime" type="number" defaultValue={editingTireChange?.warrantyTime} required />
                        </div>
                        <div>
                          <Label htmlFor="warrantyUnit">Unidad de Garantía</Label>
                          <Select name="warrantyUnit" defaultValue={editingTireChange?.warrantyUnit}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione una unidad" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="días">Días</SelectItem>
                              <SelectItem value="meses">Meses</SelectItem>
                              <SelectItem value="años">Años</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="notes">Notas</Label>
                          <Textarea id="notes" name="notes" defaultValue={editingTireChange?.notes} />
                        </div>
                        <div>
                          <Label htmlFor="photos">Fotografías de Evidencia</Label>
                          <Input id="photos" name="photos" type="file" accept="image/*" multiple onChange={(e) => handleFileChange(e, 'photos')} />
                          {(previewImages.photos || editingTireChange?.photos)?.map((photo, index) => (
                            <img key={index} src={photo} alt={`Foto ${index + 1}`} className="mt-2 max-w-full h-auto" />
                          ))}
                        </div>
                        <Button type="submit">Guardar</Button>
                      </form>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Card>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Fecha de Cambio</TableHead>
                        <TableHead>Kilometraje</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Llantas Cambiadas</TableHead>
                        <TableHead>Próximo Cambio (km)</TableHead>
                        <TableHead>Garantía</TableHead>
                        <TableHead>Costos</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tireChanges.map((tireChange) => {
                        const vehiculo = vehiculos.find(v => v.id === tireChange.vehicleId)
                        const garantiaRestante = calcularDiasGarantiaRestantes(tireChange.changeDate, tireChange.warrantyTime, tireChange.warrantyUnit)
                        return (
                          <TableRow key={tireChange.id}>
                            <TableCell>{tireChange.id}</TableCell>
                            <TableCell>{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})` : 'N/A'}</TableCell>
                            <TableCell>{tireChange.changeDate}</TableCell>
                            <TableCell>{tireChange.mileage} km</TableCell>
                            <TableCell>{`${tireChange.tireBrand}/${tireChange.tireModel}`}</TableCell>
                            <TableCell>{tireChange.changedTires.join(', ')}</TableCell>
                            <TableCell>{tireChange.nextChangeRecommendation} km</TableCell>
                            <TableCell>{garantiaRestante} días</TableCell>
                            <TableCell>
                              {tireChange.costs.map((cost, index) => (
                                <div key={cost.id}>
                                  Costo {index + 1}: ${cost.total.toFixed(2)}
                                </div>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditTireChange(tireChange.id)}>
                                Editar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleDeleteTireChange(tireChange.id)}>
                                Eliminar
                              </Button>
                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handlePrintTireChange(tireChange.id)}>
                                Imprimir
                              </Button>
                              <Sheet>
                                <SheetTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => setCurrentTireChangeId(tireChange.id)}>
                                    Costos
                                  </Button>
                                </SheetTrigger>
                                <SheetContent>
                                  <SheetHeader>
                                    <SheetTitle>Costos del Cambio de Llantas</SheetTitle>
                                  </SheetHeader>
                                  <div className="py-4">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Costo Unitario</TableHead>
                                          <TableHead>Cantidad</TableHead>
                                          <TableHead>Total</TableHead>
                                          <TableHead>Acciones</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {tireChange.costs.map((cost) => (
                                          <TableRow key={cost.id}>
                                            <TableCell>${cost.unitCost.toFixed(2)}</TableCell>
                                            <TableCell>{cost.quantity}</TableCell>
                                            <TableCell>${cost.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                              <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditCost(cost)}>
                                                Editar
                                              </Button>
                                              <Button variant="outline" size="sm" onClick={() => handleDeleteCost(tireChange.id, cost.id)}>
                                                Eliminar
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                    <Button className="mt-4" onClick={() => {
                                      setEditingCost(null)
                                      setIsCostModalOpen(true)
                                    }}>
                                      Agregar Costo
                                    </Button>
                                  </div>
                                </SheetContent>
                              </Sheet>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Dialog open={isCostModalOpen} onOpenChange={setIsCostModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCost ? 'Editar' : 'Agregar'} Costo</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const newCost: Cost = {
                      id: editingCost?.id || generateId('COST'),
                      unitCost: Number(formData.get('unitCost')),
                      quantity: Number(formData.get('quantity')),
                      includesVAT: formData.get('includesVAT') === 'on',
                      subtotal: 0,
                      vat: 0,
                      total: 0,
                      paymentMethod: formData.get('paymentMethod') as string,
                      invoiceNumber: formData.get('invoiceNumber') as string,
                      notes: formData.get('notes') as string
                    }
                    newCost.subtotal = newCost.unitCost * newCost.quantity
                    if (newCost.includesVAT) {
                      newCost.vat = newCost.subtotal * 0.16
                      newCost.total = newCost.subtotal
                    } else {
                      newCost.vat = 0
                      newCost.total = newCost.subtotal
                    }
                    handleSaveCost(newCost)
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="unitCost">Costo Unitario</Label>
                      <Input id="unitCost" name="unitCost" type="number" step="0.01" defaultValue={editingCost?.unitCost} required />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Cantidad</Label>
                      <Input id="quantity" name="quantity" type="number" defaultValue={editingCost?.quantity} required />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="includesVAT" name="includesVAT" defaultChecked={editingCost?.includesVAT} />
                      <label htmlFor="includesVAT">Incluye IVA</label>
                    </div>
                    <div>
                      <Label htmlFor="paymentMethod">Forma de Pago</Label>
                      <Input id="paymentMethod" name="paymentMethod" defaultValue={editingCost?.paymentMethod} required />
                    </div>
                    <div>
                      <Label htmlFor="invoiceNumber">Número de Factura</Label>
                      <Input id="invoiceNumber" name="invoiceNumber" defaultValue={editingCost?.invoiceNumber} required />
                    </div>
                    <div>
                      <Label htmlFor="notes">Observaciones</Label>
                      <Textarea id="notes" name="notes" defaultValue={editingCost?.notes} />
                    </div>
                    <Button type="submit">Guardar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
