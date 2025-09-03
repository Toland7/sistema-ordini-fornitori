'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Plus, Edit, Trash2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SupplierService } from '@/lib/services/supplierService'
import { Supplier, ScheduledOrder } from '@/types'

interface ScheduledOrderForm {
  supplier_id: string
  scheduled_date: string
  scheduled_time: string
  repeat_frequency: 'none' | 'daily' | 'weekly' | 'monthly'
  notes: string
  items: {
    product_name: string
    quantity: string
    unit: string
  }[]
}

export default function SchedulePage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<ScheduledOrder | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<ScheduledOrderForm>({
    supplier_id: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    repeat_frequency: 'none',
    notes: '',
    items: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const suppliersData = await SupplierService.getSuppliers()
      setSuppliers(suppliersData)
      
      // TODO: Implementare caricamento ordini programmati
      setScheduledOrders([])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return

    setSelectedSupplier(supplier)
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      items: supplier.products.map(p => ({
        product_name: p.name,
        quantity: p.default_quantity?.toString() || '1',
        unit: p.unit
      }))
    }))
  }

  const updateItemQuantity = (index: number, quantity: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity } : item
      )
    }))
  }

  const toggleItemSelection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: item.quantity ? '' : '1' } : item
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSupplier) {
      alert('Seleziona un fornitore')
      return
    }

    const selectedItems = formData.items.filter(item => item.quantity.trim())
    
    if (selectedItems.length === 0) {
      alert('Seleziona almeno un prodotto')
      return
    }

    try {
      // TODO: Implementare salvataggio ordine programmato
      console.log('Scheduling order:', {
        ...formData,
        items: selectedItems
      })
      
      // Simulazione: mostra notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Ordine Programmato!', {
            body: `Ordine programmato per ${selectedSupplier.name} il ${formData.scheduled_date} alle ${formData.scheduled_time}`,
            icon: '/icons/icon-192x192.png'
          })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Ordine Programmato!', {
                body: `Ordine programmato per ${selectedSupplier.name}`,
                icon: '/icons/icon-192x192.png'
              })
            }
          })
        }
      }
      
      alert('Ordine programmato con successo!')
      closeModal()
      
    } catch (error) {
      console.error('Error scheduling order:', error)
      alert('Errore nella programmazione. Riprova.')
    }
  }

  const openAddModal = () => {
    setEditingOrder(null)
    setSelectedSupplier(null)
    setFormData({
      supplier_id: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time: '09:00',
      repeat_frequency: 'none',
      notes: '',
      items: []
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingOrder(null)
    setSelectedSupplier(null)
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        alert('Notifiche abilitate! Riceverai promemoria per gli ordini programmati.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programma Ordini</h1>
          <p className="text-gray-600">Pianifica ordini automatici con promemoria</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={requestNotificationPermission}
            className="flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Abilita Notifiche</span>
          </Button>
          <Button onClick={openAddModal} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nuovo Ordine</span>
          </Button>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun fornitore disponibile
          </h3>
          <p className="text-gray-600 mb-4">
            Aggiungi prima almeno un fornitore per programmare ordini
          </p>
        </div>
      ) : scheduledOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun ordine programmato
          </h3>
          <p className="text-gray-600 mb-4">
            Inizia programmando il tuo primo ordine automatico
          </p>
          <Button onClick={openAddModal}>
            Programma Primo Ordine
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledOrders.map((scheduledOrder) => (
            <div key={scheduledOrder.id} className="bg-white rounded-lg border shadow-sm p-6">
              {/* TODO: Implementare visualizzazione ordini programmati */}
            </div>
          ))}
        </div>
      )}

      {/* Modal Programmazione */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingOrder ? 'Modifica Ordine Programmato' : 'Nuovo Ordine Programmato'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selezione Fornitore */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Fornitore e Programmazione</h3>
            
            <Select
              label="Fornitore *"
              placeholder="Scegli un fornitore..."
              value={formData.supplier_id}
              onChange={(e) => handleSupplierChange(e.target.value)}
              options={suppliers.map(supplier => ({
                value: supplier.id,
                label: supplier.name
              }))}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Data Programmazione *"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              
              <Input
                label="Orario *"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                required
              />
            </div>

            <Select
              label="Frequenza Ripetizione"
              value={formData.repeat_frequency}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                repeat_frequency: e.target.value as 'none' | 'daily' | 'weekly' | 'monthly'
              }))}
              options={[
                { value: 'none', label: 'Nessuna (una volta)' },
                { value: 'daily', label: 'Giornaliera' },
                { value: 'weekly', label: 'Settimanale' },
                { value: 'monthly', label: 'Mensile' }
              ]}
            />
          </div>

          {/* Selezione Prodotti */}
          {selectedSupplier && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Prodotti da Ordinare</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                      item.quantity ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!item.quantity}
                      onChange={() => toggleItemSelection(index)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {item.product_name}
                      </span>
                      <span className="text-gray-600 ml-2">
                        ({item.unit})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(index, e.target.value)}
                        className="w-24 text-center"
                        placeholder="Qtà"
                        disabled={!item.quantity}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note Aggiuntive
            </label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Note per questo ordine programmato..."
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={closeModal} fullWidth>
              Annulla
            </Button>
            <Button type="submit" fullWidth>
              {editingOrder ? 'Aggiorna Programmazione' : 'Programma Ordine'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}