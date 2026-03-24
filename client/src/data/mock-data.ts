export type OrderStatus = 'Novo' | 'Confirmado' | 'Em produção' | 'Pronto' | 'Entregue' | 'Cancelado';
export type PaymentStatus = 'Pendente' | 'Parcial' | 'Pago';
export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão de crédito' | 'Cartão de débito' | 'Transferência';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items: OrderItem[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Produto Pronto' | 'Ingrediente' | 'Embalagem';
  currentQuantity: number;
  unit: 'un' | 'kg' | 'g' | 'l' | 'ml' | 'caixa';
  minQuantity: number;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'Entrada' | 'Saída' | 'Ajuste';
  quantity: number;
  date: string;
  reason?: string;
}

export interface CashTransaction {
  id: string;
  type: 'Entrada' | 'Saída';
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  orderId?: string;
}

// Mock Data
export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'PED-001',
    customerName: 'Maria Silva',
    phone: '(11) 98765-4321',
    orderDate: '2023-10-25',
    deliveryDate: '2023-10-26',
    deliveryTime: '14:00',
    status: 'Novo',
    paymentMethod: 'Pix',
    paymentStatus: 'Pendente',
    totalAmount: 150.00,
    paidAmount: 0,
    items: [
      { id: 'i1', productId: 'p1', productName: 'Bolo de Morango 1kg', quantity: 1, unitPrice: 150.00, subtotal: 150.00 }
    ]
  },
  {
    id: '2',
    orderNumber: 'PED-002',
    customerName: 'João Santos',
    phone: '(11) 91234-5678',
    orderDate: '2023-10-24',
    deliveryDate: '2023-10-25', // Atrasado (hoje é 26)
    deliveryTime: '10:00',
    status: 'Em produção',
    paymentMethod: 'Cartão de crédito',
    paymentStatus: 'Pago',
    totalAmount: 85.50,
    paidAmount: 85.50,
    items: [
      { id: 'i2', productId: 'p2', productName: 'Caixa 6 Trufas', quantity: 3, unitPrice: 28.50, subtotal: 85.50 }
    ]
  },
  {
    id: '3',
    orderNumber: 'PED-003',
    customerName: 'Ana Oliveira',
    phone: '(11) 97777-8888',
    orderDate: '2023-10-26',
    deliveryDate: '2023-10-26', // Hoje
    deliveryTime: '16:30',
    status: 'Pronto',
    paymentMethod: 'Dinheiro',
    paymentStatus: 'Parcial',
    totalAmount: 220.00,
    paidAmount: 100.00,
    items: [
      { id: 'i3', productId: 'p3', productName: 'Cento Salgados Sortidos', quantity: 2, unitPrice: 80.00, subtotal: 160.00 },
      { id: 'i4', productId: 'p4', productName: 'Torta de Limão', quantity: 1, unitPrice: 60.00, subtotal: 60.00 }
    ]
  }
];

export const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Leite Condensado', category: 'Ingrediente', currentQuantity: 5, unit: 'un', minQuantity: 10 }, // Baixo
  { id: '2', name: 'Farinha de Trigo', category: 'Ingrediente', currentQuantity: 15, unit: 'kg', minQuantity: 5 },
  { id: '3', name: 'Caixa p/ Bolo 20x20', category: 'Embalagem', currentQuantity: 50, unit: 'un', minQuantity: 20 },
  { id: '4', name: 'Trufa Tradicional', category: 'Produto Pronto', currentQuantity: 8, unit: 'un', minQuantity: 15 }, // Baixo
];

export const mockTransactions: CashTransaction[] = [
  { id: '1', type: 'Entrada', category: 'Venda', description: 'Sinal Pedido 003', amount: 100.00, paymentMethod: 'Dinheiro', date: '2023-10-26T09:15:00', orderId: '3' },
  { id: '2', type: 'Saída', category: 'Insumos', description: 'Compra Atacadão', amount: 350.00, paymentMethod: 'Cartão de débito', date: '2023-10-26T11:30:00' },
  { id: '3', type: 'Entrada', category: 'Venda', description: 'Venda Balcão', amount: 45.00, paymentMethod: 'Pix', date: '2023-10-26T14:20:00' },
];
