const { db } = require('../config/firebase');
const Product = require('../models/Product');

// 1. Obtener todos los productos del menú
const getProducts = async (req, res) => {
    try {
        const snapshot = await db.collection('products').get();
        const products = [];
        
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Crear un nuevo producto
const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, availability } = req.body;

        // Validación básica
        if (!name || !price || !category) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (nombre, precio, categoría)' });
        }

        const newProduct = new Product({ name, description, price, category, availability });
        const docRef = await db.collection('products').add(JSON.parse(JSON.stringify(newProduct)));

        res.status(201).json({
            success: true,
            message: '✅ Producto creado exitosamente',
            data: { id: docRef.id, ...newProduct }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Actualizar un producto
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const dataToUpdate = req.body;

        const productRef = db.collection('products').doc(id);
        const doc = await productRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        await productRef.update(dataToUpdate);

        res.status(200).json({
            success: true,
            message: '🔄 Producto actualizado correctamente'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Eliminar un producto
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productRef = db.collection('products').doc(id);
        const doc = await productRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        await productRef.delete();

        res.status(200).json({
            success: true,
            message: '🗑️ Producto eliminado correctamente'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};