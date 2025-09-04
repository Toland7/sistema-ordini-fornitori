'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Send, MessageSquare, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SupplierService } from '@/lib/services/supplierService'
import { OrderService } from '@/lib/services/orderServices'
import { Supplier, CreateOrderData } from '@/types'

interface OrderItem {
  product_name: string
  quantity: string
  unit: string
  price?: number
  selected: boolean
}

export default function CreateOrderPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [customItems, setCustomItems] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [orderPreview, setOrderPreview] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadSuppliers()
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const data = await SupplierService.getSuppliers()
      setSuppliers(data)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return

    setSelectedSupplier(supplier)
    
    // Inizializza items con prodotti del fornitore
    const items = supplier.products.map(product => ({
      product_name: product.name,
      quantity: product.default_quantity?.toString() || '1',
      unit: product.unit,
      price: product.price || undefined,
      selected: false
    }))
    
    setOrderItems(items)
  }

  const toggleItemSelection = (index: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ))
  }

  const updateQuantity = (index: number, quantity: string) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ))
  }

  const getSelectedItems = () => {
    const selectedProducts = orderItems
      .filter(item => item.selected && item.quantity.trim())
      .map(item => ({
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      }))

    // Aggiungi items custom se presenti
    const customItemsList = customItems
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        product_name: line.trim(),
        quantity: '1',
        unit: 'pezzi'
      }))

    return [...selectedProducts, ...customItemsList]
  }

  const generateOrderMessage = () => {
    const items = getSelectedItems()
    if (!selectedSupplier || items.length === 0) return ''

    let orderDetails = items.map(item => 
      `- ${item.product_name}: ${item.quantity} ${item.unit || ''}`
    ).join('\n')

    if (notes.trim()) {
      orderDetails += `\n\nNote aggiuntive:\n${notes}`
    }

    const template = selectedSupplier.message_template || 
      'Buongiorno,\n\nvorremmo effettuare il seguente ordine:\n\n{ORDER_DETAILS}\n\nGrazie,\n[NOME_RISTORANTE]'

    return template.replace('{ORDER_DETAILS}', orderDetails)
  }

  const handlePreviewOrder = () => {
    const items = getSelectedItems()
    
    if (!selectedSupplier) {
      alert('Seleziona un fornitore')
      return
    }

    if (items.length === 0) {
      alert('Seleziona almeno un prodotto o aggiungi un item personalizzato')
      return
    }

    const message = generateOrderMessage()
    setOrderPreview(message)
    setShowPreview(true)
  }

  const handleSendOrder = async (confirmed: boolean) => {
    if (!confirmed) {
      setShowPreview(false)
      return
    }

    if (!selectedSupplier) return

    try {
      setSending(true)
      
      const items = getSelectedItems()
      const orderData: CreateOrderData = {
        supplier_id: selectedSupplier.id,
        items,
        notes: notes || undefined
      }

      // Crea ordine nel database
      const order = await OrderService.createOrder(orderData)
      
      // Simula invio messaggio
      const message = generateOrderMessage()
      
      if (selectedSupplier.contact_method === 'whatsapp') {
        // Apri WhatsApp con messaggio precompilato
        const whatsappUrl = `https://wa.me/${selectedSupplier.contact_info.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
      } else if (selectedSupplier.contact_method === 'email') {
        // Apri client email con messaggio precompilato
        const emailUrl = `mailto:${selectedSupplier.contact_info}?subject=Nuovo Ordine&body=${encodeURIComponent(message)}`
        window.open(emailUrl, '_blank')
      }

      // Aggiorna status ordine come inviato
      await OrderService.updateOrderStatus(order.id, 'sent', selectedSupplier.contact_method)
      
      setShowPreview(false)
      
      alert('Ordine inviato con successo!')
      
      // Reset form
      setSelectedSupplier(null)
      setOrderItems([])
      setCustomItems('')
      setNotes('')
      
      // Redirect alla cronologia
      router.push('/dashboard/history')
      
    } catch (error) {
      console.error('Error sending order:', error)
      alert('Errore nell\'invio dell\'ordine. Riprova.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-gray-600">Caricamento fornitori...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crea il Tuo Ordine</h1>
        <p className="text-gray-600">Seleziona fornitore e prodotti per creare un nuovo ordine</p>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun fornitore disponibile
          </h3>
          <p className="text-gray-600 mb-4">
            Aggiungi prima almeno un fornitore per creare ordini
          </p>
          <Button onClick={() => router.push('/dashboard/suppliers')}>
            Gestione Fornitori
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Selezione Fornitore */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              1. Seleziona Fornitore
            </h2>
            
            <Select
              label="Fornitore"
              placeholder="Scegli un fornitore..."
              value={selectedSupplier?.id || ''}
              onChange={(e) => handleSupplierChange(e.target.value)}
              options={suppliers.map(supplier => ({
                value: supplier.id,
                label: `${supplier.name} (${supplier.contact_method.toUpperCase()})`
              }))}
            />

            {selectedSupplier && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {selectedSupplier.contact_method === 'whatsapp' ? (
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  ) : (
                    <Mail className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {selectedSupplier.contact_method.toUpperCase()}: {selectedSupplier.contact_info}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedSupplier.products.length} prodotti disponibili
                </p>
              </div>
            )}
          </div>

          {/* Selezione Prodotti */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                2. Seleziona Prodotti
              </h2>
              
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`flex items-center space-x-4 p-4 rounded-lg border transition-colors ${
                      item.selected ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleItemSelection(index)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {item.product_name}
                      </span>
                      <span className="text-gray-600 ml-2">
                        ({item.unit})
                        {item.price && (
                          <span className="text-green-600"> - €{item.price}</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, e.target.value)}
                        className="w-24 text-center"
                        placeholder="Qtà"
                        disabled={!item.selected}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Personalizzati */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                3. Prodotti Aggiuntivi (Opzionale)
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prodotti non in lista (uno per riga)
                </label>
                <textarea
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={4}
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  placeholder="Es:&#10;Prodotto speciale A&#10;Prodotto speciale B"
                />
              </div>
            </div>
          )}

          {/* Note */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                4. Note Aggiuntive (Opzionale)
              </h2>
              
              <textarea
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note speciali per questo ordine..."
              />
            </div>
          )}

          {/* Azioni */}
          {selectedSupplier && (
            <div className="bg-white rounded-lg border p-6">
              <div className="flex space-x-4">
                <Button
                  onClick={handlePreviewOrder}
                  variant="secondary"
                  fullWidth
                  className="flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Rivedi Ordine</span>
                </Button>
                
                <Button
                  onClick={handlePreviewOrder}
                  fullWidth
                  className="flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Invia Ordine</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Preview Ordine */}
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Anteprima Ordine"
        size="lg"
      >
        <div className="space-y-6">
          {selectedSupplier && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Fornitore:</span>
                <span>{selectedSupplier.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Invio via:</span>
                <span className="capitalize">
                  {selectedSupplier.contact_method} ({selectedSupplier.contact_info})
                </span>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Messaggio che verrà inviato:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                {orderPreview}
              </pre>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>L&apos;ordine è completo?</strong><br />
              Verifica tutti i prodotti e le quantità prima di inviare.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              variant="secondary"
              onClick={() => handleSendOrder(false)}
              fullWidth
              disabled={sending}
            >
              No, Modifica
            </Button>
            <Button
              onClick={() => handleSendOrder(true)}
              fullWidth
              loading={sending}
            >
              Sì, Invia Ordine
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
