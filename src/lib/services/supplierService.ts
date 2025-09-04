import { Supplier, CreateSupplierData } from '@/types'

export class SupplierService {
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const mockSuppliers: Supplier[] = [
        {
          id: '1',
          name: 'Fornitore Carni Rossi',
          contact_method: 'whatsapp',
          contact_info: '+39 333 1234567',
          message_template: 'Buongiorno,\n\nvorremmo effettuare il seguente ordine:\n\n{ORDER_DETAILS}\n\nGrazie',
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

  static async getSupplier(id: string): Promise<Supplier | null> {
    const suppliers = await this.getSuppliers()
    return suppliers.find(s => s.id === id) || null
  }

  static async createSupplier(supplierData: CreateSupplierData): Promise<Supplier> {
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
  }

  static async updateSupplier(id: string, updates: Partial<CreateSupplierData>): Promise<Supplier> {
    console.log('Updating supplier:', id, updates)
    const suppliers = await this.getSuppliers()
    const supplier = suppliers.find(s => s.id === id)
    if (!supplier) throw new Error('Supplier not found')
    return supplier
  }

  static async deleteSupplier(id: string): Promise<void> {
    console.log('Deleting supplier:', id)
  }
}
