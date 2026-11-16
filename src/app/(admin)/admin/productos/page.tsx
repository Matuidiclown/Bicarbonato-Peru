'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AdminHeader } from '@/components/admin/AdminHeader'
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Upload,
  Tag,
  Layers,
  Edit2,
  X,
  ImageOff,
  Save,
  Star,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react'

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

  // Filtros del listado
  const [adminFilter, setAdminFilter] = useState<'all' | 'featured' | 'hidden'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // --- ESTADOS DE CREACIÓN ---
  const [name, setName] = useState('')
  const [presentation, setPresentation] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('insumos-base')
  const [selectedSubcategory, setSelectedSubcategory] = useState(CATALOG_CATEGORY_MAP['insumos-base'][0])
  const [isFeatured, setIsFeatured] = useState(false)
  const [featuredOrder, setFeaturedOrder] = useState('10')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [tier1Price, setTier1Price] = useState('9.00')
  const [tier3MinQty, setTier3MinQty] = useState('3')
  const [tier3Price, setTier3Price] = useState('8.50')

  // --- ESTADOS DE EDICIÓN (MODAL) ---
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editPresentation, setEditPresentation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('insumos-base')
  const [editSubcategory, setEditSubcategory] = useState('')
  const [editIsFeatured, setEditIsFeatured] = useState(false)
  const [editFeaturedOrder, setEditFeaturedOrder] = useState('10')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editCurrentImageUrl, setEditCurrentImageUrl] = useState<string | null>(null)
  const [editNewImageFile, setEditNewImageFile] = useState<File | null>(null)
  const [editRemoveImage, setEditRemoveImage] = useState(false)
  const [editTier1Price, setEditTier1Price] = useState('0.00')
  const [editTier3MinQty, setEditTier3MinQty] = useState('3')
  const [editTier3Price, setEditTier3Price] = useState('0.00')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const supabase = createClient()

  const fetchProducts = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*, price_tiers (*)')
      .order('is_featured', { ascending: false })
      .order('featured_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProducts(data)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const deleteStorageImageByUrl = async (url: string | null) => {
    if (!url || !url.includes('/product-images/')) return
    try {
      const pathPart = url.split('/product-images/')[1]
      if (pathPart) {
        await supabase.storage.from('product-images').remove([decodeURIComponent(pathPart)])
      }
    } catch (err) {
      console.warn('No se pudo limpiar imagen antigua:', err)
    }
  }

  const uploadProductImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`)
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrlData.publicUrl
  }

  const handleMainCategoryChange = (catKey: string) => {
    setSelectedCategory(catKey)
    const subcats = CATALOG_CATEGORY_MAP[catKey] || []
    setSelectedSubcategory(subcats.length > 0 ? subcats[0] : '')
  }

  // --- CREAR PRODUCTO ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!name.trim() || !presentation.trim()) {
      setErrorMessage('Complete el nombre y la presentación del producto.')
      return
    }

    setIsUploading(true)
    try {
      let finalImageUrl = ''
      if (imageFile) {
        finalImageUrl = await uploadProductImage(imageFile)
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
          is_active: true,
          is_featured: isFeatured,
          featured_order: parseInt(featuredOrder) || 100
        })
        .select('id')
        .single()

      if (prodErr || !newProd) {
        throw new Error(prodErr?.message || 'No se pudo crear el producto')
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
      setIsFeatured(false)
      setFeaturedOrder('10')
      setImageFile(null)
      setSuccessMessage('¡Producto registrado exitosamente!')
      fetchProducts()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el producto.')
    } finally {
      setIsUploading(false)
    }
  }

  // --- ACCIONES RÁPIDAS DE VISIBILIDAD (1 CLIC) ---
  const handleToggleFeatured = async (prod: any) => {
    const nextValue = !prod.is_featured
    const { error } = await supabase
      .from('products')
      .update({ is_featured: nextValue })
      .eq('id', prod.id)

    if (!error) {
      setProducts(prev =>
        prev.map(p => (p.id === prod.id ? { ...p, is_featured: nextValue } : p))
      )
      setSuccessMessage(
        nextValue
          ? `"${prod.name}" ahora aparecerá en la página principal.`
          : `"${prod.name}" se quitó de la portada (sigue visible en su categoría).`
      )
    } else {
      setErrorMessage(`Error al actualizar portada: ${error.message}`)
    }
  }

  const handleToggleActive = async (prod: any) => {
    const nextValue = !prod.is_active
    const { error } = await supabase
      .from('products')
      .update({ is_active: nextValue })
      .eq('id', prod.id)

    if (!error) {
      setProducts(prev =>
        prev.map(p => (p.id === prod.id ? { ...p, is_active: nextValue } : p))
      )
      setSuccessMessage(
        nextValue
          ? `"${prod.name}" está nuevamente visible en la tienda.`
          : `"${prod.name}" fue ocultado de toda la tienda (Sin Stock).`
      )
    } else {
      setErrorMessage(`Error al cambiar visibilidad: ${error.message}`)
    }
  }

  // --- ABRIR MODAL DE EDICIÓN ---
  const handleOpenEditModal = (prod: any) => {
    setErrorMessage('')
    setSuccessMessage('')
    setEditingProduct(prod)
    setEditName(prod.name || '')
    setEditPresentation(prod.presentation || '')
    setEditDescription(prod.description || '')
    setEditIsFeatured(Boolean(prod.is_featured))
    setEditFeaturedOrder(String(prod.featured_order ?? 10))
    setEditIsActive(prod.is_active !== false)

    const validCat = CATALOG_CATEGORY_MAP[prod.category] ? prod.category : 'insumos-base'
    setEditCategory(validCat)
    const availableSubs = CATALOG_CATEGORY_MAP[validCat] || []
    setEditSubcategory(
      availableSubs.includes(prod.subcategory) ? prod.subcategory : availableSubs[0] || ''
    )

    setEditCurrentImageUrl(prod.image_url || null)
    setEditNewImageFile(null)
    setEditRemoveImage(false)

    const sortedTiers = [...(prod.price_tiers || [])].sort(
      (a: any, b: any) => a.min_quantity - b.min_quantity
    )
    const baseTier = sortedTiers.find((t: any) => t.min_quantity === 1) || sortedTiers[0]
    const bulkTier = sortedTiers.find((t: any) => t.min_quantity > 1)

    setEditTier1Price(baseTier ? Number(baseTier.unit_price).toFixed(2) : '0.00')
    setEditTier3MinQty(bulkTier ? String(bulkTier.min_quantity) : '3')
    setEditTier3Price(bulkTier ? Number(bulkTier.unit_price).toFixed(2) : '0.00')
  }

  const handleEditCategoryChange = (catKey: string) => {
    setEditCategory(catKey)
    const subcats = CATALOG_CATEGORY_MAP[catKey] || []
    setEditSubcategory(subcats.length > 0 ? subcats[0] : '')
  }

  // --- GUARDAR EDICIÓN ---
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setErrorMessage('')
    setSuccessMessage('')

    if (!editName.trim() || !editPresentation.trim()) {
      setErrorMessage('El nombre y la presentación son obligatorios.')
      return
    }

    setIsSavingEdit(true)
    try {
      let updatedImageUrl: string | null = editCurrentImageUrl

      if (editNewImageFile) {
        const uploadedUrl = await uploadProductImage(editNewImageFile)
        if (editCurrentImageUrl) {
          await deleteStorageImageByUrl(editCurrentImageUrl)
        }
        updatedImageUrl = uploadedUrl
      } else if (editRemoveImage) {
        if (editCurrentImageUrl) {
          await deleteStorageImageByUrl(editCurrentImageUrl)
        }
        updatedImageUrl = null
      }

      const { error: updateErr } = await supabase
        .from('products')
        .update({
          name: editName.trim(),
          presentation: editPresentation.trim(),
          description: editDescription.trim(),
          category: editCategory,
          subcategory: editSubcategory,
          image_url: updatedImageUrl,
          is_featured: editIsFeatured,
          featured_order: parseInt(editFeaturedOrder) || 100,
          is_active: editIsActive
        })
        .eq('id', editingProduct.id)

      if (updateErr) {
        throw new Error(`Error al actualizar producto: ${updateErr.message}`)
      }

      const { error: delTiersErr } = await supabase
        .from('price_tiers')
        .delete()
        .eq('product_id', editingProduct.id)

      if (delTiersErr) {
        throw new Error(`Error al actualizar escalas de precio: ${delTiersErr.message}`)
      }

      const newTiers = [
        {
          product_id: editingProduct.id,
          min_quantity: 1,
          unit_price: parseFloat(editTier1Price)
        }
      ]

      const parsedMinQty = parseInt(editTier3MinQty)
      const parsedBulkPrice = parseFloat(editTier3Price)
      if (parsedMinQty > 1 && parsedBulkPrice > 0) {
        newTiers.push({
          product_id: editingProduct.id,
          min_quantity: parsedMinQty,
          unit_price: parsedBulkPrice
        })
      }

      const { error: insTiersErr } = await supabase.from('price_tiers').insert(newTiers)
      if (insTiersErr) {
        throw new Error(`Error al guardar nuevos precios: ${insTiersErr.message}`)
      }

      setEditingProduct(null)
      setSuccessMessage(`¡Producto "${editName.trim()}" actualizado correctamente!`)
      fetchProducts()
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al guardar los cambios.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteProduct = async (prod: any) => {
    if (!confirm(`¿Estás seguro de eliminar "${prod.name}" permanentemente?`)) return

    if (prod.image_url) {
      await deleteStorageImageByUrl(prod.image_url)
    }

    const { error } = await supabase.from('products').delete().eq('id', prod.id)
    if (!error) {
      setSuccessMessage('Producto eliminado correctamente.')
      fetchProducts()
    } else {
      setErrorMessage(`No se pudo eliminar el producto: ${error.message}`)
    }
  }

  // Filtrado combinado: Estado (Todos / Portada / Ocultos) + Categoría Principal
  const filteredProducts = products.filter(p => {
    const matchState =
      adminFilter === 'featured'
        ? p.is_featured && p.is_active
        : adminFilter === 'hidden'
        ? !p.is_active
        : true

    const matchCategory =
      categoryFilter === 'all' || p.category === categoryFilter

    return matchState && matchCategory
  })

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <AdminHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* FORMULARIO DE REGISTRO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#1B2A82]" />
              <span>Publicar Producto / Pack del Catálogo</span>
            </h2>
            <p className="text-xs text-gray-500">
              Define su categoría, precios y decide si aparecerá destacado en la página principal.
            </p>
          </div>

          {errorMessage && !editingProduct && (
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
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 space-y-3">
              <p className="text-xs font-extrabold text-[#1B2A82] uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#1B2A82]" />
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
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs focus:ring-2 focus:ring-[#1B2A82]"
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
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs focus:ring-2 focus:ring-[#1B2A82]"
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
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1B2A82] file:text-white"
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

            {/* VISIBILIDAD EN PORTADA */}
            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={e => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <div>
                  <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Mostrar en Página Principal (Portada)</span>
                  </span>
                  <span className="text-[11px] text-gray-500 block">
                    Si no lo marcas, solo aparecerá dentro de su categoría y en el buscador.
                  </span>
                </div>
              </label>

              {isFeatured && (
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Orden (1 = primero)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={featuredOrder}
                    onChange={e => setFeaturedOrder(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-amber-300 bg-white text-gray-900 font-bold text-xs"
                  />
                </div>
              )}
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
              className="w-full h-11 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isUploading ? 'Guardando en base de datos...' : 'Publicar Producto en Catálogo'}</span>
            </button>
          </form>
        </div>

        {/* LISTA DE PRODUCTOS CON FILTRO POR CATEGORÍA Y VISIBILIDAD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-gray-900">
              Productos Publicados ({filteredProducts.length})
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-wrap">
              {/* Filtro desplegable por Categoría */}
              <div className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-200 rounded-xl px-2.5 py-1">
                <Filter className="w-3.5 h-3.5 text-[#1B2A82] shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-[#1B2A82] focus:outline-none py-1 pr-1"
                >
                  <option value="all">Todas las categorías ({products.length})</option>
                  {Object.keys(CATALOG_CATEGORY_LABELS).map(catKey => {
                    const countInCat = products.filter(p => p.category === catKey).length
                    return (
                      <option key={catKey} value={catKey}>
                        {CATALOG_CATEGORY_LABELS[catKey]} ({countInCat})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Filtros rápidos de estado */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAdminFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    adminFilter === 'all'
                      ? 'bg-[#1B2A82] text-white'
                      : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilter('featured')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-colors ${
                    adminFilter === 'featured'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>En Portada</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminFilter('hidden')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-colors ${
                    adminFilter === 'hidden'
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultos</span>
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-gray-500 font-bold">Cargando productos...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500 border rounded-xl bg-slate-50 font-medium space-y-2">
              <p>No hay productos que coincidan con los filtros seleccionados.</p>
              {(categoryFilter !== 'all' || adminFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all')
                    setAdminFilter('all')
                  }}
                  className="text-xs font-extrabold text-[#1B2A82] hover:underline"
                >
                  Limpiar filtros y ver todos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(prod => {
                const isHidden = !prod.is_active
                return (
                  <div
                    key={prod.id}
                    className={`p-4 rounded-2xl border space-y-3 flex flex-col justify-between transition-all ${
                      isHidden
                        ? 'bg-gray-100/80 border-gray-300 opacity-75'
                        : prod.is_featured
                        ? 'bg-amber-50/30 border-amber-300 shadow-sm'
                        : 'bg-slate-50/50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-black text-[#1B2A82] uppercase bg-blue-100/80 px-2 py-0.5 rounded-md block mb-1">
                            {CATALOG_CATEGORY_LABELS[prod.category] || prod.category || 'General'}
                          </span>
                          {prod.subcategory && (
                            <span className="text-[10px] font-bold text-gray-500 block">
                              Sub: {prod.subcategory}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="text-[#1B2A82] bg-blue-50 hover:bg-blue-100 p-1.5 rounded-lg transition-colors border border-blue-200"
                            title="Editar producto e imagen"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors border border-red-200"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* BARRA DE VISIBILIDAD RÁPIDA (1 CLIC) */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(prod)}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 border transition-colors ${
                            prod.is_featured
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
                          }`}
                          title="Elegir si aparece en la portada principal"
                        >
                          <Star className={`w-3.5 h-3.5 ${prod.is_featured ? 'fill-white' : ''}`} />
                          <span>{prod.is_featured ? `Portada (#${prod.featured_order || 10})` : 'Poner en Portada'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod)}
                          className={`py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 border transition-colors ${
                            isHidden
                              ? 'bg-gray-800 text-white border-gray-900'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title="Ocultar producto si está sin stock"
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{isHidden ? 'Oculto' : 'Visible'}</span>
                        </button>
                      </div>

                      <h3 className="font-extrabold text-sm text-gray-900 leading-snug">{prod.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mb-1">{prod.presentation}</p>

                      {prod.image_url ? (
                        <div className="aspect-video bg-white rounded-xl p-2 border mb-2 flex items-center justify-center">
                          <img src={prod.image_url} alt={prod.name} className="max-h-24 object-contain" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-100 rounded-xl p-2 border border-dashed mb-2 flex flex-col items-center justify-center text-gray-400">
                          <ImageOff className="w-5 h-5 mb-1" />
                          <span className="text-[10px] font-semibold">Sin imagen</span>
                        </div>
                      )}

                      <div className="pt-2 border-t text-xs space-y-1 text-gray-600">
                        {[...(prod.price_tiers || [])]
                          .sort((a: any, b: any) => a.min_quantity - b.min_quantity)
                          .map((t: any) => (
                            <div key={t.id} className="flex justify-between">
                              <span>Desde {t.min_quantity} ud:</span>
                              <span className="font-bold text-gray-900">S/ {Number(t.unit_price).toFixed(2)} c/u</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE EDICIÓN COMPLETA */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl border border-gray-100 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#1B2A82]" />
                <span>Editar Producto del Catálogo</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              {/* VISIBILIDAD Y PORTADA */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={e => setEditIsActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className="font-extrabold text-gray-900">Visible en Tienda</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={e => setEditIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-extrabold text-gray-900">Destacar en Portada</span>
                </label>

                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">Orden en Portada</label>
                  <input
                    type="number"
                    min="1"
                    value={editFeaturedOrder}
                    onChange={e => setEditFeaturedOrder(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-amber-300 bg-white font-bold text-xs"
                  />
                </div>
              </div>

              {/* CATEGORÍAS */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-800 mb-1">Categoría Principal *</label>
                  <select
                    value={editCategory}
                    onChange={e => handleEditCategoryChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                  >
                    {Object.keys(CATALOG_CATEGORY_MAP).map(catKey => (
                      <option key={catKey} value={catKey}>
                        {CATALOG_CATEGORY_LABELS[catKey]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1">Subcategoría *</label>
                  <select
                    value={editSubcategory}
                    onChange={e => setEditSubcategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                  >
                    {(CATALOG_CATEGORY_MAP[editCategory] || []).map(sub => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NOMBRE Y PRESENTACIÓN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nombre del Producto *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Presentación *</label>
                  <input
                    type="text"
                    required
                    value={editPresentation}
                    onChange={e => setEditPresentation(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Descripción Breve</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium text-xs"
                />
              </div>

              {/* IMAGEN */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <p className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
                  Imagen del Producto
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-28 h-28 bg-white rounded-xl border flex items-center justify-center p-2 shrink-0 overflow-hidden">
                    {editNewImageFile ? (
                      <img
                        src={URL.createObjectURL(editNewImageFile)}
                        alt="Vista previa"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : editCurrentImageUrl && !editRemoveImage ? (
                      <img
                        src={editCurrentImageUrl}
                        alt={editName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageOff className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-[10px] font-bold">Sin foto</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        {editCurrentImageUrl ? 'Reemplazar por nueva imagen:' : 'Subir imagen:'}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0] || null
                          setEditNewImageFile(file)
                          if (file) setEditRemoveImage(false)
                        }}
                        className="w-full text-xs text-gray-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1B2A82] file:text-white hover:file:bg-[#142066]"
                      />
                    </div>

                    {editCurrentImageUrl && !editNewImageFile && (
                      <button
                        type="button"
                        onClick={() => setEditRemoveImage(!editRemoveImage)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                          editRemoveImage
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {editRemoveImage
                            ? 'Se eliminará al guardar (Clic para cancelar)'
                            : 'Eliminar imagen actual'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ESCALAS DE PRECIO */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <p className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
                  Escalas de Precio
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Precio 1 Ud (S/) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editTier1Price}
                      onChange={e => setEditTier1Price(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Mínimo Mayorista</label>
                    <input
                      type="number"
                      value={editTier3MinQty}
                      onChange={e => setEditTier3MinQty(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-gray-900 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Precio Mayorista c/u (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTier3Price}
                      onChange={e => setEditTier3Price(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-300 bg-white text-emerald-800 font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-3 bg-[#1B2A82] hover:bg-[#142066] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Guardando cambios...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}