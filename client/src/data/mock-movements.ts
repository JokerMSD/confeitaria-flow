export const mockMovements: InventoryMovement[] = [
  { id: '1', itemId: '1', type: 'Entrada', quantity: 10, date: '2023-10-20T10:00:00', reason: 'Compra de fornecedor' },
  { id: '2', itemId: '1', type: 'Saída', quantity: 5, date: '2023-10-25T14:30:00', reason: 'Uso em produção (Pedido 001)' },
  { id: '3', itemId: '4', type: 'Ajuste', quantity: -2, date: '2023-10-26T09:00:00', reason: 'Itens vencidos' }
];