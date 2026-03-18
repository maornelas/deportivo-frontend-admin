const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * Obtiene la lista de marcas (todas o solo activas).
 * @param {{ activeOnly?: boolean }} opts - activeOnly: false para traer todas las marcas
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getBrands(opts = {}) {
  const baseUrl = getBaseUrl()
  const activeOnly = opts.activeOnly !== false
  const res = await fetch(`${baseUrl}/brand/get?activeOnly=${activeOnly}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar marcas' }
  }
  return { success: true, data: body.data }
}

/**
 * Obtiene los modelos de autos por marca.
 * @param {string} brandId - ID de la marca
 * @returns {Promise<{ success: boolean, data?: { id: string, model: string }[], error?: string }>}
 */
export async function getCarModelsByBrand(brandId) {
  const baseUrl = getBaseUrl()
  if (!brandId?.trim()) return { success: true, data: [] }
  const res = await fetch(`${baseUrl}/car-models?brandId=${encodeURIComponent(brandId.trim())}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al cargar modelos', data: [] }
  }
  return { success: true, data: Array.isArray(body.data) ? body.data : [] }
}

/**
 * Obtiene la lista de categorías (todas o solo activas).
 * @param {{ activeOnly?: boolean }} opts - activeOnly: false para traer todas las categorías
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getCategories(opts = {}) {
  const baseUrl = getBaseUrl()
  const activeOnly = opts.activeOnly !== false
  const res = await fetch(`${baseUrl}/categories/get?activeOnly=${activeOnly}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar categorías' }
  }
  return { success: true, data: body.data }
}

/**
 * Crea un producto.
 * @param {object} payload - { sku, name, description?, shortDescription?, brandId, carModelId?, carVersionId?, carYearRange?, partCondition?, partType?, observations?, categoryId, price, comparePrice?, costPrice?, stockQuantity?, isActive?, isFeatured?, isOnSale?, imageUrls? }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createProduct(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear producto' }
  }
  return { success: true, data: body.data }
}

/**
 * Crea el producto y sube las imágenes en una sola petición (S3 + tabla product_images).
 * @param {object} payload - Mismo shape que createProduct (sin imageUrls)
 * @param {File[]} files - Hasta 10 archivos
 */
export async function createProductWithImages(payload, files) {
  const baseUrl = getBaseUrl()
  const formData = new FormData()
  formData.append('product', JSON.stringify(payload))
  const list = Array.isArray(files) ? files.slice(0, 10) : []
  for (let i = 0; i < list.length; i++) {
    formData.append('images', list[i])
  }
  const res = await fetch(`${baseUrl}/products/with-images`, {
    method: 'POST',
    body: formData,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      success: false,
      error:
        body.message ||
        (Array.isArray(body.message) ? body.message.join('; ') : body.error) ||
        `Error ${res.status}`,
    }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear producto con imágenes' }
  }
  return { success: true, data: body.data, imagesCount: body.imagesCount }
}

/**
 * Busca productos con filtros.
 * @param {object} params - { categoryId, brandId, isActive, search, year, modelSearch, page, limit, sortBy, sortOrder }
 * @returns {Promise<{ success: boolean, data?: { products, total, page, limit, totalPages }, error?: string }>}
 */
export async function searchProducts(params = {}) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.categoryId) searchParams.set('categoryId', params.categoryId)
  if (params.brandId) searchParams.set('brandId', params.brandId)
  if (params.isActive !== undefined) searchParams.set('isActive', params.isActive ? 'true' : 'false')
  if (params.search?.trim()) searchParams.set('search', params.search.trim())
  if (params.year?.trim()) searchParams.set('year', params.year.trim())
  if (params.modelSearch?.trim()) searchParams.set('modelSearch', params.modelSearch.trim())
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.limit != null) searchParams.set('limit', String(params.limit))
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const url = `${baseUrl}/products?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al buscar productos' }
  }
  return { success: true, data: body.data }
}

/**
 * Obtiene un producto por ID (incluye imágenes).
 * @param {string} id - ID del producto
 * @returns {Promise<{ success: boolean, data?: object & { images?: { id, imageUrl, isPrimary, sortOrder }[] }, error?: string }>}
 */
export async function getProductById(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/products/get/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al obtener el producto' }
  }
  return { success: true, data: body.data }
}

/**
 * Actualiza un producto.
 * @param {string} id - ID del producto
 * @param {object} payload - Campos a actualizar (sku, name, description, brandId, carYearRange, partCondition, partType, observations, categoryId, price, isActive, stockQuantity, ...)
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function updateProduct(id, payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/products/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al actualizar el producto' }
  }
  return { success: true, data: body.data }
}

/**
 * Elimina un producto por ID.
 * @param {string} id - ID del producto
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteProduct(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/products/delete/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al eliminar el producto' }
  }
  return { success: true }
}

/**
 * Sube imágenes de un producto a S3 (images-products/{productId}/) y las registra.
 * @param {string} productId - ID del producto
 * @param {File[]} files - Archivos de imagen (máx. 10)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function uploadProductImages(productId, files) {
  const baseUrl = getBaseUrl()
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i])
  }
  const res = await fetch(`${baseUrl}/products/${productId}/images`, {
    method: 'POST',
    body: formData,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al subir imágenes' }
  }
  return { success: true }
}

/**
 * Elimina una imagen del producto (product_images).
 */
export async function deleteProductImage(productId, imageId) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/products/${productId}/images/${imageId}`, {
    method: 'DELETE',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al eliminar imagen' }
  }
  return { success: true }
}
