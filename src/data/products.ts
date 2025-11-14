// Productos del frontend con sus imágenes reales
const automotiveImages = [
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte1.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte2.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte3.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte4.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte5.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte6.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte7.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte8.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte9.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte10.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte11.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte12.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte13.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte14.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte15.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte16.png',
  'https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-dev/Parte17.png',
]

const getAutomotiveImageByIndex = (index: number): string => {
  const safeIndex = index % automotiveImages.length
  return automotiveImages[safeIndex]
}

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviewCount: number
  badge?: 'sale' | 'hot' | 'new'
  inStock: boolean
  brand?: string
  category: string
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Llanta de Aleación 19" Gris Brillante AR-19',
    sku: 'AR-19-GB',
    price: 589.0,
    originalPrice: 650.0,
    image: getAutomotiveImageByIndex(0),
    rating: 4.5,
    reviewCount: 26,
    badge: 'sale',
    inStock: true,
    brand: 'Brandix',
    category: 'Llantas y Ruedas',
  },
  {
    id: '2',
    name: 'Kit de Frenos Delanteros Premium',
    sku: 'KF-PREMIUM-001',
    price: 245.0,
    image: getAutomotiveImageByIndex(1),
    rating: 4.8,
    reviewCount: 42,
    badge: 'hot',
    inStock: true,
    brand: 'Premium Parts',
    category: 'Frenos',
  },
  {
    id: '3',
    name: 'Aceite Motor Sintético 5W-30',
    sku: 'OIL-5W30-5L',
    price: 45.0,
    originalPrice: 52.0,
    image: getAutomotiveImageByIndex(2),
    rating: 4.3,
    reviewCount: 18,
    badge: 'sale',
    inStock: true,
    brand: 'Mobil',
    category: 'Lubricantes',
  },
  {
    id: '4',
    name: 'Filtro de Aire de Alto Flujo',
    sku: 'FA-HF-001',
    price: 78.0,
    image: getAutomotiveImageByIndex(3),
    rating: 4.6,
    reviewCount: 31,
    inStock: true,
    brand: 'K&N',
    category: 'Filtros',
  },
  {
    id: '5',
    name: 'Batería de Auto 12V 60Ah',
    sku: 'BAT-12V-60AH',
    price: 125.0,
    originalPrice: 140.0,
    image: getAutomotiveImageByIndex(4),
    rating: 4.4,
    reviewCount: 25,
    badge: 'sale',
    inStock: true,
    brand: 'ACDelco',
    category: 'Baterías',
  },
  {
    id: '6',
    name: 'Limpiaparabrisas Premium 24"',
    sku: 'LP-PREMIUM-24',
    price: 12.0,
    image: getAutomotiveImageByIndex(5),
    rating: 4.2,
    reviewCount: 15,
    inStock: true,
    brand: 'Bosch',
    category: 'Accesorios',
  },
  {
    id: '7',
    name: 'Motor 12 Cilindros Fantástico',
    sku: 'ENG-12C-FANTASTIC',
    price: 2579.0,
    image: getAutomotiveImageByIndex(6),
    rating: 4.9,
    reviewCount: 8,
    badge: 'hot',
    inStock: true,
    brand: 'Fantastic Motors',
    category: 'Motor',
  },
  {
    id: '8',
    name: 'Discos de Embrague Sport',
    sku: 'DE-SPORT-001',
    price: 189.0,
    originalPrice: 220.0,
    image: getAutomotiveImageByIndex(7),
    rating: 4.7,
    reviewCount: 22,
    badge: 'sale',
    inStock: true,
    brand: 'Sport Clutch',
    category: 'Transmisión',
  },
]

