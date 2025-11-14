export interface Client {
  id: number
  name: string
  location: string
  mobile: string
  avatar: string
  email?: string
  socialMedia?: {
    instagram?: string
    twitter?: string
    facebook?: string
  }
}

export interface Product {
  id: number
  name: string
  image: string
  rating: number
  reviews: number
  price: number
  originalPrice?: number
  description?: string
  category?: string
}

export interface Invoice {
  id: string
  client: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
}

export interface DashboardKPI {
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  chartData: number[]
}

