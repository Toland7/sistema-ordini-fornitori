import { Supplier, CreateSupplierData, SupplierProduct } from '@/types'

export class SupplierService {
  // Ottieni tutti i fornitori dell'utente
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      // Simulazione dati per sviluppo
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'Fornitore Carni Rossi',
          contact_method: 'whatsapp',
          contact_info: '+39 333 1234567',
          message_template: 'Buongiorno,\n\nvorremmo effettuare il seguente ordine:\n\n{ORDER_DETAILS}\n\nGrazie,\nRistorante Da Mario',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          products: [
            {
              id: '1',
              supplier_id: '1',
              name: 'Bistecca di manzo',
              unit: 'kg',
              default_quantity: 3,
              price: 25.00,
              notes: '',
              is_active: true,
              sort_order: 0
            },
            {
              id: '2',
              supplier_id: '1',
              name: 'Pollo intero',
              unit: 'pezzi',
              default_quantity: 2,
              price: 8.50,
              notes: '',
              is_active: true,
              sort_order: 1
            }
          ]
        },
        {
          id: '2',
          name: 'Ortofrutticola Verde',
          contact_method: 'email',
          contact_info: 'ordini@ortoverde.it',
          message_template: 'Gentili Fornitori,\n\ncon la presente effettuiamo il seguente ordine:\n\n{ORDER_DETAILS}\n\nDistinti saluti',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          products: [
            {
              id: '4',
              supplier_id: '2',
              name: 'Pomodori',
              unit: 'kg',
              default_quantity: 10,
              price: 3.50,
              notes: '',
              is_active: true,
              sort_order: 0
            },
            {
              id: '5',
              supplier_id: '2',
              name: 'Insalata mista',
              unit: 'buste',
              default_quantity: 15,
              price: 2.20,
              notes: '',
              is_active: true,
              sort_order: 1
            }
          ]
        }
      ]

      return mockSuppliers
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      throw error
    }
  }

  // Ottieni un fornitore specifico
  static async getSupplier(id: string): Promise<Supplier | null> {
    try {
      const suppliers = await this.getSuppliers()
      return suppliers.find(s => s.id === id) || null
    } catch (error) {
      console.error('Error fetching supplier:', error)
      throw error
    }
  }

  // Crea nuovo fornitore
  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
    try {
      // Simulazione creazione
      const newSupplier: Supplier = {
        id: Math.random().toString(36).substr(2, 9),
        name: supplierData.name,
        contact_method: supplierData.contact_method,
        contact_info: supplierData.contact_info,
        message_template: supplierData.message_template || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        products: supplierData.products.map((product, index) => ({
          id: Math.random().toString(36).substr(2, 9),
          supplier_id: '',
          name: product.name,
          unit: product.unit,
          default_quantity: product.default_quantity || 1,
          price: product.price || 0,
          notes: product.notes || '',
          is_active: true,
          sort_order: index
        }))
      }

      console.log('Created supplier:', newSupplier)
      return newSupplier
    } catch (error) {
      console.error('Error creating supplier:', error)
      throw error
    }
  }

  // Aggiorna fornitore
  static async updateSupplier(id: string, updates: Partial<CreateSupplierData>): Promise<Supplier> {
    try {
      console.log('Updating supplier:', id, updates)
      
      const suppliers = await this.getSuppliers()
      const supplier = suppliers.find(s => s.id === id)
      if (!supplier) throw new Error('Supplier not found')

      return supplier
    } catch (error) {
      console.error('Error updating supplier:', error)
      throw error
    }
  }

  // Elimina fornitore (soft delete)
  static async deleteSupplier(id: string): Promise<void> {
    try {
      console.log('Deleting supplier:', id)
    } catch (error) {
      console.error('Error deleting supplier:', error)
      throw error
    }
  }
}