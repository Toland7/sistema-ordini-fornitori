'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { SupplierService } from '@/lib/services/supplierService'
import { Supplier, CreateSupplierData, SupplierProduct } from '@/types'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    contact_method: 'whatsapp',
    contact_info: '',
    message_template: 'Buongiorno,\n\nvorremmo effettuare il seguente ordine:\n\n{ORDER_DETAILS}\n\nGrazie,\n[NOME_RISTORANTE]',
    products: []
  })
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    unit: 'pezzi',
    default_quantity: 1,
    price: 0,
    notes: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSupplier) {
        await SupplierService.updateSupplier(editingSupplier.id, formData)
      } else {
        await SupplierService.createSupplier(formData)
      }
      
      await loadSuppliers()
      closeModal()
      
      // Chiedi se serve altro
      const needMore = confirm("Fornitore salvato! Serve aggiungere altro?")
      if (needMore) {
        openAddModal()
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Errore nel salvataggio. Riprova.')
    }
  }

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo fornitore?')) return
    
    try {
      await SupplierService.deleteSupplier(id)
      await loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Errore nell\'eliminazione. Riprova.')
    }
  }

  const addProduct = () => {
    if (!currentProduct.name.trim()) {
      alert('Inserisci il nome del prodotto')
      return
    }

    const newProduct = {
      name: currentProduct.name,
      unit: currentProduct.unit,
      default_quantity: currentProduct.default_quantity || 1,
      price: currentProduct.price || undefined,
      notes: currentProduct.notes || undefined
    }

    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }))

    // Reset form prodotto
    setCurrentProduct({
      name: '',
      unit: 'pezzi',
      default_quantity: 1,
      price: 0,
      notes: ''
    })

    // Chiedi se serve altro prodotto
    const needMore = confirm("Prodotto aggiunto! Serve aggiungere un altro prodotto?")
    if (!needMore) {
      // Focus sul nome fornitore se è vuoto, altrimenti submit
      if (!formData.name.trim()) {
        alert('Ora inserisci i dati del fornitore')
      }
    }
  }

  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }))
  }

  const openAddModal = () => {
    setEditingSupplier(null)
    setFormData({
      name: '',
      contact_method: 'whatsapp',
      contact_info: '',
      message_template: 'Buongiorno,\n\nvorremmo effettuare il seguente ordine:\n\n{ORDER_DETAILS}\n\nGrazie,\n[NOME_RISTORANTE]',
      products: []
    })
    setShowModal(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name,
      contact_method: supplier.contact_method,
      contact_info: supplier.contact_info,
      message_template: supplier.message_template || '',
      products: supplier.products.map(p => ({
        name: p.name,
        unit: p.unit,
        default_quantity: p.default_quantity || 1,
        price: p.price || undefined,
        notes: p.notes || undefined
      }))
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingSupplier(null)
    setCurrentProduct({
      name: '',
      unit: 'pezzi',
      default_quantity: 1,
      price: 0,
      notes: ''
    })
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Fornitori</h1>
          <p className="text-gray-600">Aggiungi e modifica i tuoi fornitori</p>
        </div>
        <Button onClick={openAddModal} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuovo Fornitore</span>
        </Button>
      </div>

      {/* Lista Fornitori */}
      {suppliers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun fornitore trovato
          </h3>
          <p className="text-gray-600 mb-4">
            Inizia aggiungendo il tuo primo fornitore
          </p>
          <Button onClick={openAddModal}>
            Aggiungi Primo Fornitore
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg border shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {supplier.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {supplier.contact_method.toUpperCase()}: {supplier.contact_info}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(supplier)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSupplier(supplier.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Prodotti ({supplier.products.length}):
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {supplier.products.slice(0, 5).map((product) => (
                    <div key={product.id} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                      {product.name} ({product.unit})
                    </div>
                  ))}
                  {supplier.products.length > 5 && (
                    <div className="text-xs text-gray-500">
                      +{supplier.products.length - 5} altri...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Aggiungi/Modifica */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dati Fornitore */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Informazioni Fornitore</h3>
            
            <Input
              label="Nome Fornitore *"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Es: Fornitore Carni Rossi"
            />

            <Select
              label="Metodo di Invio Preferito *"
              value={formData.contact_method}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                contact_method: e.target.value as 'whatsapp' | 'email' | 'sms' 
              }))}
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'email', label: 'Email' },
                { value: 'sms', label: 'SMS' }
              ]}
              required
            />

            <Input
              label={formData.contact_method === 'email' ? 'Email *' : 'Numero di Telefono *'}
              value={formData.contact_info}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
              required
              placeholder={formData.contact_method === 'email' ? 'nome@email.com' : '+39 333 1234567'}
              type={formData.contact_method === 'email' ? 'email' : 'tel'}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Messaggio
              </label>
              <textarea
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                value={formData.message_template}
                onChange={(e) => setFormData(prev => ({ ...prev, message_template: e.target.value }))}
                placeholder="Template per i messaggi automatici..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Usa {'{ORDER_DETAILS}'} dove vuoi inserire i dettagli dell'ordine
              </p>
            </div>
          </div>

          {/* Sezione Prodotti */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium text-gray-900">Aggiungi Prodotti</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nome Prodotto"
                value={currentProduct.name}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Es: Bistecca di manzo"
              />
              
              <Input
                label="Unità di Misura"
                value={currentProduct.unit}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="Es: kg, pezzi, litri"
              />
              
              <Input
                label="Quantità Default"
                type="number"
                value={currentProduct.default_quantity}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, default_quantity: parseInt(e.target.value) || 1 }))}
                min="1"
              />
              
              <Input
                label="Prezzo (€) - Opzionale"
                type="number"
                step="0.01"
                value={currentProduct.price}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            
            <Input
              label="Note - Opzionale"
              value={currentProduct.notes}
              onChange={(e) => setCurrentProduct(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Note aggiuntive sul prodotto..."
            />
            
            <Button
              type="button"
              variant="secondary"
              onClick={addProduct}
              className="w-full"
            >
              Aggiungi Prodotto
            </Button>
          </div>

          {/* Lista Prodotti Aggiunti */}
          {formData.products.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-medium text-gray-900">
                Prodotti Aggiunti ({formData.products.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <span className="text-gray-600 ml-2">
                        ({product.unit})
                        {product.price && ` - €${product.price}`}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <Button type="button" variant="secondary" onClick={closeModal} fullWidth>
              Annulla
            </Button>
            <Button type="submit" fullWidth>
              {editingSupplier ? 'Aggiorna Fornitore' : 'Salva Fornitore'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}