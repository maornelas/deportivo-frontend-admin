import { apiFetch } from './http'

/** Debe coincidir con MAX_PRODUCT_IMAGES en el backend (product-images constant). */
const MAX_PRODUCT_IMAGES = 15

/**
 * Máximo de archivos por petición multipart en `POST .../products/:id/images`.
 * Instancias antiguas de Nest + Multer suelen limitar a 10; enviar 11+ en una sola petición devuelve 400 "Unexpected field".
 * Troceamos en `uploadProductImages` por debajo de este techo.
 */
const PRODUCT_IMAGE_FILES_PER_REQUEST = 10

/**
 * Obtiene la lista de marcas (todas o solo activas).
 * @param {{ activeOnly?: boolean }} opts - activeOnly: false para traer todas las marcas
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getBrands(opts = {}) {
  const activeOnly = opts.activeOnly !== false
  const res = await apiFetch(`/brand/get?activeOnly=${activeOnly}`)
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
  if (!brandId?.trim()) return { success: true, data: [] }
  const res = await apiFetch(`/car-models?brandId=${encodeURIComponent(brandId.trim())}`)
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
  const activeOnly = opts.activeOnly !== false
  const res = await apiFetch(`/categories/get?activeOnly=${activeOnly}`)
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
  const res = await apiFetch('/products', {
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
 * @param {File[]} files - Hasta 15 archivos
 */
export async function createProductWithImages(payload, files) {
  const formData = new FormData()
  formData.append('product', JSON.stringify(payload))
  const list = Array.isArray(files) ? files.slice(0, MAX_PRODUCT_IMAGES) : []
  for (let i = 0; i < list.length; i++) {
    formData.append('images', list[i])
  }
  const res = await apiFetch('/products/with-images', {
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

  const res = await apiFetch(`/products?${searchParams.toString()}`)
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
  const res = await apiFetch(`/products/get/${id}`)
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
  const res = await apiFetch(`/products/update/${id}`, {
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
  const res = await apiFetch(`/products/delete/${id}`, { method: 'DELETE' })
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
 * Envía los archivos en lotes para no superar el límite de Multer en el servidor (evita "Unexpected field").
 * @param {string} productId - ID del producto
 * @param {File[]} files - Archivos de imagen (máx. 15 en total entre lotes)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function uploadProductImages(productId, files) {
  const list = Array.isArray(files) ? files.slice(0, MAX_PRODUCT_IMAGES) : []
  for (let offset = 0; offset < list.length; offset += PRODUCT_IMAGE_FILES_PER_REQUEST) {
    const chunk = list.slice(offset, offset + PRODUCT_IMAGE_FILES_PER_REQUEST)
    const formData = new FormData()
    for (let i = 0; i < chunk.length; i++) {
      formData.append('images', chunk[i])
    }
    const res = await apiFetch(`/products/${productId}/images`, {
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
      return { success: false, error: body.message || 'Error al subir imágenes' }
    }
  }
  return { success: true }
}

/**
 * Elimina una imagen del producto (product_images).
 */
export async function deleteProductImage(productId, imageId) {
  const res = await apiFetch(`/products/${productId}/images/${imageId}`, {
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
