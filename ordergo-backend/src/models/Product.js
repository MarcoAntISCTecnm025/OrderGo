/**
 * Estructura del Objeto Producto (Firestore Schema Reference)
 * Collection: "products"
 */
class Product {
    constructor(data) {
        this.name = data.name;          // String (Ej: "Pizza Hawaiana Familiar")
        this.description = data.description; // String (Ej: "Jamón, piña y doble queso")
        this.price = Number(data.price);    // Number (Ej: 180.00)
        this.category = data.category;      // String (Ej: "Pizzas", "Bebidas", "Complementos")
        this.availability = data.availability !== undefined ? Boolean(data.availability) : true; // Boolean (true = activo/disponible)
        this.createdAt = new Date().toISOString();
    }
}

module.exports = Product;