'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, FileText, Zap, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface ParsedItem {
  name: string
  quantity: string
  unit: string
}

export default function ScanPage() {
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload' | 'text'>('camera')
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [rawText, setRawText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedItems, setSelectedItems] = useState<ParsedItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const parseTextToItems = (text: string): ParsedItem[] => {
    const lines = text.split('\n').filter(line => line.trim())
    const items: ParsedItem[] = []
    
    lines.forEach(line => {
      line = line.trim()
      if (!line) return
      
      // Regex per riconoscere pattern comuni:
      // "Prodotto 5kg", "3x Prodotto", "Prodotto - 2 pezzi", etc.
      const patterns = [
        /^(\d+)\s*x?\s*(.+)$/i, // "3x prodotto" o "3 prodotto"
        /^(.+?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(\w+)$/i, // "prodotto - 2 kg"
        /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(\w+)$/i, // "prodotto 2 kg"
        /^(.+?)\s*(\d+(?:[.,]\d+)?)(\w+)$/i, // "prodotto 2kg"
      ]
      
      let matched = false
      
      for (const pattern of patterns) {
        const match = line.match(pattern)
        if (match) {
          let name, quantity, unit
          
          if (pattern === patterns[0]) {
            // Pattern "3x prodotto"
            quantity = match[1]
            name = match[2]
            unit = 'pezzi'
          } else {
            // Altri pattern
            name = match[1].trim()
            quantity = match[2].replace(',', '.')
            unit = match[3] || 'pezzi'
          }
          
          // Pulizia nome
          name = name.replace(/^[-*•]\s*/, '').trim()
          
          items.push({
            name: name,
            quantity: quantity,
            unit: unit.toLowerCase()
          })
          
          matched = true
          break
        }
      }
      
      // Se nessun pattern match, aggiungi come item semplice
      if (!matched && line.length > 2) {
        // Rimuovi bullet points
        const cleanName = line.replace(/^[-*•]\s*/, '').trim()
        items.push({
          name: cleanName,
          quantity: '1',
          unit: 'pezzi'
        })
      }
    })
    
    return items
  }

  const handleCameraScan = () => {
    // Simulazione scansione fotocamera
    const sampleText = `Bistecca di manzo - 3 kg
Pollo intero 2 pezzi
Insalata mista 5kg
• Pomodori 10kg
• Limoni - 2 kg
3x Mozzarella di bufala
Parmigiano Reggiano 1kg`
    
    setProcessing(true)
    
    setTimeout(() => {
      setRawText(sampleText)
      const items = parseTextToItems(sampleText)
      setParsedItems(items)
      setProcessing(false)
    }, 2000)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setProcessing(true)
    
    // Simulazione OCR su file
    const reader = new FileReader()
    reader.onload = (event) => {
      setTimeout(() => {
        const sampleText = `Lista spesa settimanale:
- Carne di manzo 2kg
- Pollo 3 pezzi  
- Verdure fresche 5kg
- Formaggio misto 1kg
- Pane 2 pagnotte
- Latte 3 litri`
        
        setRawText(sampleText)
        const items = parseTextToItems(sampleText)
        setParsedItems(items)
        setProcessing(false)
      }, 1500)
    }
    reader.readAsDataURL(file)
  }

  const handleTextParse = () => {
    if (!rawText.trim()) {
      alert('Inserisci del testo da analizzare')
      return
    }
    
    setProcessing(true)
    
    setTimeout(() => {
      const items = parseTextToItems(rawText)
      setParsedItems(items)
      setProcessing(false)
    }, 500)
  }

  const toggleItemSelection = (index: number) => {
    const item = parsedItems[index]
    const isSelected = selectedItems.some(selected => selected.name === item.name)
    
    if (isSelected) {
      setSelectedItems(prev => prev.filter(selected => selected.name !== item.name))
    } else {
      setSelectedItems(prev => [...prev, item])
    }
  }

  const updateItemQuantity = (index: number, quantity: string) => {
    setParsedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ))
    
    // Aggiorna anche selectedItems se l'item è selezionato
    setSelectedItems(prev => prev.map(selected => 
      selected.name === parsedItems[index]?.name 
        ? { ...selected, quantity }
        : selected
    ))
  }

  const createOrderFromSelection = () => {
    if (selectedItems.length === 0) {
      alert('Seleziona almeno un prodotto per creare l\'ordine')
      return
    }
    
    // Naviga alla pagina di creazione ordine con i prodotti pre-selezionati
    // Memorizza i prodotti nel localStorage per il passaggio
    const orderData = {
      type: 'scanned_items',
      items: selectedItems,
      timestamp: Date.now()
    }
    
    localStorage.setItem('pending_order_data', JSON.stringify(orderData))
    
    router.push('/dashboard/create-order?from=scan')
  }

  const resetScan = () => {
    setParsedItems([])
    setSelectedItems([])
    setRawText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Scansiona Lista</h1>
        <p className="text-gray-600">
          Importa rapidamente prodotti da foto, file o testo
        </p>
      </div>

      {/* Metodi Scansione */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all ${
            scanMethod === 'camera' ? 'border-primary-500 bg-primary-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setScanMethod('camera')}
        >
          <div className="text-center">
            <Camera className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Fotocamera</h3>
            <p className="text-sm text-gray-600">
              Scatta una foto della lista prodotti
            </p>
          </div>
        </div>
        
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all ${
            scanMethod === 'upload' ? 'border-primary-500 bg-primary-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setScanMethod('upload')}
        >
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Carica File</h3>
            <p className="text-sm text-gray-600">
              Upload di un'immagine o documento
            </p>
          </div>
        </div>
        
        <div 
          className={`bg-white rounded-lg border p-6 cursor-pointer transition-all ${
            scanMethod === 'text' ? 'border-primary-500 bg-primary-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setScanMethod('text')}
        >
          <div className="text-center">
            <FileText className="h-8 w-8 mx-auto mb-3 text-primary-600" />
            <h3 className="font-semibold text-gray-900 mb-2">Testo</h3>
            <p className="text-sm text-gray-600">
              Incolla o digita la lista prodotti
            </p>
          </div>
        </div>
      </div>

      {/* Interfaccia Scansione */}
      <div className="bg-white rounded-lg border p-6">
        {scanMethod === 'camera' && (
          <div className="text-center space-y-4">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Scansione Fotocamera
              </h3>
              <p className="text-gray-600 mb-4">
                Clicca per attivare la fotocamera e scansionare una lista
              </p>
              <Button onClick={handleCameraScan} loading={processing}>
                {processing ? 'Scansione in corso...' : 'Attiva Fotocamera'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Simulazione: verrà mostrata una lista di esempio per il test
            </p>
          </div>
        )}

        {scanMethod === 'upload' && (
          <div className="text-center space-y-4">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                Carica File
              </h3>
              <p className="text-gray-600 mb-4">
                Seleziona un'immagine o documento da analizzare
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                loading={processing}
              >
                {processing ? 'Elaborazione...' : 'Seleziona File'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Supportati: JPG, PNG, PDF, DOC, TXT
            </p>
          </div>
        )}

        {scanMethod === 'text' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incolla o digita la lista prodotti
              </label>
              <textarea
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Esempi di formato supportati:&#10;&#10;Bistecca di manzo - 3 kg&#10;Pollo 2 pezzi&#10;• Insalata 5kg&#10;3x Mozzarella&#10;- Pomodori 10kg&#10;Limoni - 2 kg"
              />
            </div>
            <Button 
              onClick={handleTextParse} 
              loading={processing}
              className="flex items-center space-x-2"
              disabled={!rawText.trim()}
            >
              <Zap className="h-4 w-4" />
              <span>{processing ? 'Elaborazione...' : 'Analizza Testo'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Risultati Scansione */}
      {parsedItems.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Prodotti Riconosciuti ({parsedItems.length})
                </h2>
                <p className="text-sm text-gray-600">
                  Seleziona i prodotti da aggiungere all'ordine
                </p>
              </div>
              <Button variant="ghost" onClick={resetScan}>
                Reset
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {parsedItems.map((item, index) => {
              const isSelected = selectedItems.some(selected => selected.name === item.name)
              return (
                <div 
                  key={index}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                    isSelected ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleItemSelection(index)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  
                  <div className="flex-1">
                    <span className="font-medium text-gray-900">
                      {item.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(index, e.target.value)}
                      className="w-20 text-center"
                    />
                    <Select
                      value={item.unit}
                      onChange={(e) => {
                        const updatedItem = { ...item, unit: e.target.value }
                        setParsedItems(prev => prev.map((it, i) => i === index ? updatedItem : it))
                        if (isSelected) {
                          setSelectedItems(prev => prev.map(selected => 
                            selected.name === item.name ? updatedItem : selected
                          ))
                        }
                      }}
                      options={[
                        { value: 'kg', label: 'kg' },
                        { value: 'pezzi', label: 'pezzi' },
                        { value: 'litri', label: 'litri' },
                        { value: 'confezioni', label: 'conf.' },
                        { value: 'sacchi', label: 'sacchi' },
                        { value: 'buste', label: 'buste' }
                      ]}
                      className="w-24"
                    />
                  </div>
                  
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                  )}
                </div>
              )
            })}
          </div>
          
          {selectedItems.length > 0 && (
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">
                    {selectedItems.length} prodotti selezionati
                  </span>
                  <p className="text-sm text-gray-600">
                    Clicca per creare un nuovo ordine con questi prodotti
                  </p>
                </div>
                <Button 
                  onClick={createOrderFromSelection}
                  className="flex items-center space-x-2"
                >
                  <span>Crea Ordine</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Testo Raw (per debug) */}
      {rawText && scanMethod !== 'text' && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-gray-900 mb-3">Testo Riconosciuto:</h3>
          <div className="bg-gray-50 p-4 rounded text-sm font-mono">
            <pre className="whitespace-pre-wrap">{rawText}</pre>
          </div>
        </div>
      )}
    </div>
  )
}