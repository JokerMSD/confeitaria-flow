export type LegacyOrderStatus =
  | "Novo"
  | "Confirmado"
  | "Em produção"
  | "Pronto"
  | "Entregue"
  | "Cancelado";
export type PaymentStatus = "Pendente" | "Parcial" | "Pago";
export type PaymentMethod =
  | "Pix"
  | "Dinheiro"
  | "Cartão de crédito"
  | "Cartão de débito"
  | "Transferência";

export interface LegacyOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface LegacyOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  orderDate: string;
  deliveryDate: string;
  deliveryTime?: string;
  status: LegacyOrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  items: LegacyOrderItem[];
}

export type OrderStatus = LegacyOrderStatus;
export type OrderItem = LegacyOrderItem;
export type Order = LegacyOrder;

export interface CashTransaction {
  id: string;
  type: "Entrada" | "Saída";
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  orderId?: string;
}

export const mockOrders: LegacyOrder[] = [
  {
    id: "1",
    orderNumber: "PED-001",
    customerName: "Maria Silva",
    phone: "(11) 98765-4321",
    orderDate: "2023-10-25",
    deliveryDate: "2023-10-26",
    deliveryTime: "14:00",
    status: "Novo",
    paymentMethod: "Pix",
    paymentStatus: "Pendente",
    totalAmount: 150,
    paidAmount: 0,
    items: [
      {
        id: "i1",
        productId: "p1",
        productName: "Bolo de Morango 1kg",
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
    ],
  },
  {
    id: "2",
    orderNumber: "PED-002",
    customerName: "João Santos",
    phone: "(11) 91234-5678",
    orderDate: "2023-10-24",
    deliveryDate: "2023-10-25",
    deliveryTime: "10:00",
    status: "Em produção",
    paymentMethod: "Cartão de crédito",
    paymentStatus: "Pago",
    totalAmount: 85.5,
    paidAmount: 85.5,
    items: [
      {
        id: "i2",
        productId: "p2",
        productName: "Caixa 6 Trufas",
        quantity: 3,
        unitPrice: 28.5,
        subtotal: 85.5,
      },
    ],
  },
  {
    id: "3",
    orderNumber: "PED-003",
    customerName: "Ana Oliveira",
    phone: "(11) 97777-8888",
    orderDate: "2023-10-26",
    deliveryDate: "2023-10-26",
    deliveryTime: "16:30",
    status: "Pronto",
    paymentMethod: "Dinheiro",
    paymentStatus: "Parcial",
    totalAmount: 220,
    paidAmount: 100,
    items: [
      {
        id: "i3",
        productId: "p3",
        productName: "Cento Salgados Sortidos",
        quantity: 2,
        unitPrice: 80,
        subtotal: 160,
      },
      {
        id: "i4",
        productId: "p4",
        productName: "Torta de Limão",
        quantity: 1,
        unitPrice: 60,
        subtotal: 60,
      },
    ],
  },
];

export const mockTransactions: CashTransaction[] = [
  {
    id: "1",
    type: "Entrada",
    category: "Venda",
    description: "Sinal Pedido 003",
    amount: 100,
    paymentMethod: "Dinheiro",
    date: "2023-10-26T09:15:00",
    orderId: "3",
  },
  {
    id: "2",
    type: "Saída",
    category: "Insumos",
    description: "Compra Atacadão",
    amount: 350,
    paymentMethod: "Cartão de débito",
    date: "2023-10-26T11:30:00",
  },
  {
    id: "3",
    type: "Entrada",
    category: "Venda",
    description: "Venda Balcão",
    amount: 45,
    paymentMethod: "Pix",
    date: "2023-10-26T14:20:00",
  },
];
