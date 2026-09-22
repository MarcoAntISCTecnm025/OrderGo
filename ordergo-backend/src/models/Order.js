/**
 * Estructura del Objeto Pedido (Firestore Schema Reference)
 * Collection: "orders"
 */
class Order {
    constructor(data, orderNumber) {
        this.orderNumber = orderNumber || 1001;
        this.customerName = data.customerName;     // Nombre del cliente o referencia de mesa
        this.customerPhone = data.customerPhone;   // Teléfono de contacto
        this.isDineIn = data.isDineIn || false;    // Nuevo: Bandera para comer en local
        this.deliveryAddress = {                   // Dirección exacta de entrega o local
            street: data.deliveryAddress?.street || '',
            number: data.deliveryAddress?.number || '',
            neighborhood: data.deliveryAddress?.neighborhood || '',
            references: data.deliveryAddress?.references || ''
        };
        this.items = data.items || [];             // Arreglo de productos seleccionados
        this.paymentMethod = data.paymentMethod || 'Efectivo'; // Método de pago
        this.totalAmount = Number(data.totalAmount) || 0; // Monto total a pagar
        this.status = data.status || 'Pendiente';  // Estatus inicial
        this.createdAt = data.createdAt || new Date().toISOString();
    }
}

module.exports = Order;