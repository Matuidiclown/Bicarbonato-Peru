'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { Plus, CheckCircle2, AlertCircle, Trash2, Upload, Tag, Layers } from 'lucide-react'

// Categorías Principales y Subcategorías del Catálogo Oficial
const CATALOG_CATEGORY_MAP: Record<string, string[]> = {
  'packs': ['Kits de Desinfección', 'Kits de Lavado y Ropa', 'Kits de Cocina', 'Kits de Limpieza General'],
  'insumos-base': ['Bicarbonato de Sodio', 'Percarbonato de Sodio', 'Vinagre Blanco'],
  'lavanderia': ['Detergentes Líquidos y en Polvo', 'Desmanchadores y Blanqueadores', 'Suavizantes de Ropa', 'Perfumes y Plancha Fácil'],
  'cocina': ['Lavavajillas Líquidos', 'Limpiadores Desengrasantes 3en1'],
  'bano-pisos': ['Quita Sarro y Óxido', 'Limpiadores de Pisos (Total Clean)'],
  'vidrios-superficies': ['Limpia Vidrios Multiusos', 'Limpiatapices y Alfombras', 'Eliminadores de Olor (Neutro-Pet)'],
  'aromatizadores': ['Perfumes Hogar 1L'],
  'utensilios': ['Esponjas y Fibras', 'Guantes de Limpieza', 'Trapeadores de Microfibra', 'Bolsas de Basura']
}

const CATALOG_CATEGORY_LABELS: Record<string, string> = {
  'packs': 'Packs y Combos Ahorro',
  'insumos-base': 'Insumos Base / Naturales',
  'lavanderia': 'Lavandería y Cuidado Ropa',
  'cocina': 'Cocina y Desengrasantes',
  'bano-pisos': 'Baño, Pisos y Cerámicas',
  'vidrios-superficies': 'Vidrios, Tapices y Mascotas',
  'aromatizadores': 'Aromatizadores y Perfumes Hogar',
  'utensilios': 'Utensilios y Accesorios'
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Campos del Formulario
  const [name, setName] = useState('')
  const [presentation, setPresentation] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('insumos-base')
  const [selectedSubcategory, setSelectedSubcategory] = useState(CATALOG_CATEGORY_MAP['insumos-base'][0])
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Escalas de Precios
  const [tier1Price, setTier1Price] = useState('9.00')
  const [tier3MinQty, setTier3MinQty] = useState('3')
  const [tier3Price, setTier3Price] = useState('8.50')

  const supabase = createClient()

  const fetchProducts = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, price_tiers (*)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleMainCategoryChange = (catKey: string) => {
    setSelectedCategory(catKey)
    const subcats = CATALOG_CATEGORY_MAP[catKey] || []
    if (subcats.length > 0) {
      setSelectedSubcategory(subcats[0])
    } else {
      setSelectedSubcategory('')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!name.trim() || !presentation.trim()) {
      setErrorMessage('Complete el nombre y la presentación del producto.')
      return
    }

    setIsUploading(true)
    let finalImageUrl = ''

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile)

      if (uploadError) {
        setIsUploading(false)
        setErrorMessage(`Error al subir imagen: ${uploadError.message}`)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      finalImageUrl = publicUrlData.publicUrl
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    const { data: newProd, error: prodErr } = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        presentation: presentation.trim(),
        description: description.trim(),
        category: selectedCategory,
        subcategory: selectedSubcategory,
        image_url: finalImageUrl || null,
        is_active: true
      })
      .select('id')
      .single()

    if (prodErr || !newProd) {
      setIsUploading(false)
      setErrorMessage(`Error de BD: ${prodErr?.message || 'No se pudo crear el producto'}`)
      return
    }

    const tiersToInsert = [
      { product_id: newProd.id, min_quantity: 1, unit_price: parseFloat(tier1Price) }
    ]

    if (parseFloat(tier3MinQty) > 1 && parseFloat(tier3Price) > 0) {
      tiersToInsert.push({
        product_id: newProd.id,
        min_quantity: parseInt(tier3MinQty),
        unit_price: parseFloat(tier3Price)
      })
    }

    await supabase.from('price_tiers').insert(tiersToInsert)

    setName('')
    setPresentation('')
    setDescription('')
    setImageFile(null)
    setIsUploading(false)
    setSuccessMessage('¡Producto registrado exitosamente!')
    fetchProducts()
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return

    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (!error) {
      setSuccessMessage('Producto eliminado correctamente.')
      fetchProducts()
    } else {
      setErrorMessage('No se pudo eliminar el producto.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <AdminHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* FORMULARIO DE REGISTRO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Publicar Producto / Pack del Catálogo</span>
            </h2>
            <p className="text-xs text-gray-500">
              Selecciona la categoría principal y la subcategoría oficial para publicar nuevos productos.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateProduct} className="space-y-4">
            {/* CLASIFICACIÓN DE CATEGORÍA */}
            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-3">
              <p className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Categorías del Catálogo Oficial</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    1. Categoría Principal *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={e => handleMainCategoryChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.keys(CATALOG_CATEGORY_MAP).map(catKey => (
                      <option key={catKey} value={catKey}>
                        {CATALOG_CATEGORY_LABELS[catKey]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    2. Subcategoría Específica *
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={e => setSelectedSubcategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {(CATALOG_CATEGORY_MAP[selectedCategory] || []).map(sub => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* DATOS DEL PRODUCTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Producto / Pack *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bicarbonato de Sodio 100% Puro"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Presentación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bolsa de 1 Kilo"
                  value={presentation}
                  onChange={e => setPresentation(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Imagen (Foto Local)</label>
                <div className="relative border border-dashed border-gray-300 rounded-xl p-2 bg-slate-50 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-gray-500 shrink-0" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="Ej: Ideal para limpieza, desodorizar y repostería"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-medium"
                />
              </div>
            </div>

            {/* PRECIOS POR VOLUMEN */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                Escala de Precios (Por Unidad / Por Mayor)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Precio 1 Ud (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={tier1Price}
                    onChange={e => setTier1Price(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Mínimo Mayorista</label>
                  <input
                    type="number"
                    value={tier3MinQty}
                    onChange={e => setTier3MinQty(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Precio Mayorista c/u (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tier3Price}
                    onChange={e => setTier3Price(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-emerald-800 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{isUploading ? 'Guardando en base de datos...' : 'Publicar Producto en Catálogo'}</span>
            </button>
          </form>
        </div>

        {/* MUESTRA DE PRODUCTOS EN BD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <h2 className="text-base font-extrabold text-gray-900">Productos Publicados en BD ({products.length})</h2>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-gray-500 font-bold">Cargando productos...</div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 border rounded-xl bg-slate-50 font-medium">
              Aún no hay productos guardados. Llena el formulario superior para publicar tu primer producto.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(prod => (
                <div key={prod.id} className="p-4 rounded-2xl border bg-slate-50/50 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-black text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-md block mb-1">
                          {CATALOG_CATEGORY_LABELS[prod.category] || prod.category}
                        </span>
                        {prod.subcategory && (
                          <span className="text-[10px] font-bold text-gray-500 block">
                            Sub: {prod.subcategory}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors shrink-0"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-extrabold text-sm text-gray-900 leading-snug">{prod.name}</h3>
                    <p className="text-xs text-gray-500 font-medium mb-2">{prod.presentation}</p>

                    {prod.image_url && (
                      <div className="aspect-video bg-white rounded-xl p-2 border mb-2 flex items-center justify-center">
                        <img src={prod.image_url} alt={prod.name} className="max-h-24 object-contain" />
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs space-y-1 text-gray-600">
                      {prod.price_tiers?.map((t: any) => (
                        <div key={t.id} className="flex justify-between">
                          <span>Desde {t.min_quantity} ud:</span>
                          <span className="font-bold text-gray-900">S/ {t.unit_price?.toFixed(2)} c/u</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}