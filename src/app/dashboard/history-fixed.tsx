'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  History, 
  Filter, 
  Download, 
  Search, 
  Calendar,
  CheckCircle,
  Clock,
  Send,
  X,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SupplierService } from '@/lib/services/supplierService'
import { OrderService } from '@/lib/services/orderService'
import { Supplier, Order } from '@/types'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const statusIcons = {
  pending: Clock,
  sent: Send,
  confirmed: CheckCircle,
  delivered: CheckCircle,
  cancelled: X,
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [filters, setFilters] = useState({
    supplier_id: '',
    status: '',
    date_from: '',
    date_to: '',
    search: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    confirmed: 0
  })
  
  const router = useRouter()

  const calculateStats = useCallback((ordersData: Order[]) => {
    setStats({
      total: ordersData.length,
      pending: ordersData.filter(o => o.status === 'pending').length,
      sent: ordersData.filter(o => o.status === 'sent').length,
      confirmed: ordersData.filter(o => o.status === 'confirmed').length
    })
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const filteredOrders = await OrderService.getOrders({
        supplier_id: filters.supplier_id || undefined,
        status: filters.status || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined
      })
      
      // Applica filtro ricerca locale
      let finalOrders = filteredOrders
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        finalOrders = filteredOrders.filter(order => 
          order.supplier_name?.toLowerCase().includes(searchTerm) ||
          order.items.some(item => 
            item.product_name.toLowerCase().includes(searchTerm)
          ) ||
          order.notes?.toLowerCase().includes(searchTerm)
        )
      }
      
      setOrders(finalOrders)
      calculateStats(finalOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }, [filters, calculateStats])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [ordersData, suppliersData] = await Promise.all([
        OrderService.getOrders(),
        SupplierService.getSuppliers()
      ])
      
      setOrders(ordersData)
      setSuppliers(suppliersData)
      calculateStats(ordersData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [calculateStats])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (filters.supplier_id || filters.status || filters.date_from || filters.date_to || filters.search) {
      loadOrders()
    }
  }, [filters, loadOrders])

  const clearFilters = () => {
    setFilters({
      supplier_id: '',
      status: '',
      date_from: '',
      date_to: '',
      search: ''
    })
  }

  const exportOrders = () => {
    if (orders.length === 0) {
      alert('Nessun ordine da esportare')
      return
    }

    // Crea CSV
    const headers = ['Data', 'Fornitore', 'Stato', 'Prodotti', 'Totale', 'Note']
    const csvData = orders.map(order => [
      format(new Date(order.order_date), 'dd/MM/yyyy'),
      order.supplier_name || 'N/A',
      order.status,
      order.items.map(item => `${item.product_name} (${item.quantity})`).join('; '),
      order.total_amount ? `€${order.total_amount.toFixed(2)}` : 'N/A',
      order.notes || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `cronologia-ordini-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Caricamento cronologia...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cronologia Ordini</h1>
          <p className="text-gray-600">Visualizza e gestisci tutti i tuoi ordini</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtri</span>
          </Button>
          <Button
            variant="secondary"
            onClick={exportOrders}
            className="flex items-center space-x-2"
            disabled={orders.length === 0}
          >
            <Download className="h-4 w-4" />
            <span>Esporta</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-gray-50">
              <History className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Totali</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-50">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">In Attesa</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Inviati</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Confermati</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.confirmed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ricerca Rapida */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-10"
                placeholder="Cerca per fornitore, prodotto o note..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          {(filters.supplier_id || filters.status || filters.date_from || filters.date_to) && (
            <Button variant="ghost" onClick={clearFilters}>
              Pulisci Filtri
            </Button>
          )}
        </div>
      </div>

      {/* Lista Ordini */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filters.search || filters.supplier_id || filters.status || filters.date_from || filters.date_to
              ? 'Nessun ordine trovato con questi filtri'
              : 'Nessun ordine presente'
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {filters.search || filters.supplier_id || filters.status || filters.date_from || filters.date_to
              ? 'Prova a modificare i filtri di ricerca'
              : 'Inizia creando il tuo primo ordine'
            }
          </p>
          <Button onClick={() => router.push('/dashboard/create-order')}>
            Crea Nuovo Ordine
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="divide-y divide-gray-200">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status] || Clock
              return (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          {order.supplier_name}
                        </span>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(order.order_date), 'dd/MM/yyyy', { locale: it })}
                          </span>
                          <span>
                            {order.total_items} prodotti
                          </span>
                          {order.total_amount > 0 && (
                            <span>
                              €{order.total_amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Prodotti: </span>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={idx}>
                            {item.product_name} ({item.quantity})
                            {idx < Math.min(order.items.length, 3) - 1 ? ', ' : ''}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-gray-400"> +{order.items.length - 3} altri...</span>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => viewOrderDetails(order)}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Dettagli</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal Filtri */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtri Ricerca"
      >
        <div className="space-y-4">
          <Select
            label="Fornitore"
            placeholder="Tutti i fornitori"
            value={filters.supplier_id}
            onChange={(e) => setFilters(prev => ({ ...prev, supplier_id: e.target.value }))}
            options={[
              { value: '', label: 'Tutti i fornitori' },
              ...suppliers.map(supplier => ({
                value: supplier.id,
                label: supplier.name
              }))
            ]}
          />
          
          <Select
            label="Stato"
            placeholder="Tutti gli stati"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: '', label: 'Tutti gli stati' },
              { value: 'pending', label: 'In Attesa' },
              { value: 'sent', label: 'Inviato' },
              { value: 'confirmed', label: 'Confermato' },
              { value: 'delivered', label: 'Consegnato' },
              { value: 'cancelled', label: 'Annullato' }
            ]}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Da Data"
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
            />
            <Input
              label="A Data"
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button variant="secondary" onClick={clearFilters} fullWidth>
              Pulisci Tutto
            </Button>
            <Button onClick={() => setShowFilters(false)} fullWidth>
              Applica Filtri
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Dettagli Ordine */}
      <Modal
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        title="Dettagli Ordine"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Info Ordine */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Fornitore:</span>
                  <p>{selectedOrder.supplier_name}</p>
                </div>
                <div>
                  <span className="font-medium">Data:</span>
                  <p>{format(new Date(selectedOrder.order_date), 'dd/MM/yyyy HH:mm', { locale: it })}</p>
                </div>
                <div>
                  <span className="font-medium">Stato:</span>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]} mt-1`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Metodo Invio:</span>
                  <p>{selectedOrder.sent_method || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            {/* Prodotti */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Prodotti Ordinati ({selectedOrder.items.length})
              </h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <span>{item.product_name}</span>
                    <span className="font-medium">
                      {item.quantity} {item.unit}
                      {item.price && ` - €${item.price.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
              
              {selectedOrder.total_amount > 0 && (
                <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
                  <span>Totale:</span>
                  <span>€{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {/* Note */}
            {selectedOrder.notes && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Note</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">
                  {selectedOrder.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}