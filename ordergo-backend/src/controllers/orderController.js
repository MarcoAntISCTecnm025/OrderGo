const { db } = require('../config/firebase');
const Order = require('../models/Order');

// 1. Obtener todos los pedidos
const getOrders = async (req, res) => {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const orders = [];
        
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 2. Crear un nuevo pedido (Comanda o Local)
const createOrder = async (req, res) => {
    try {
        const { customerName, customerPhone, deliveryAddress, items, totalAmount, isDineIn, paymentMethod } = req.body;

        if (!customerName || !items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Faltan datos obligatorios (nombre o productos) para procesar el pedido' 
            });
        }

        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef.orderBy('orderNumber', 'desc').limit(1).get();
        
        let nextOrderNumber = 1001;
        if (!snapshot.empty) {
            const lastOrder = snapshot.docs[0].data();
            if (lastOrder.orderNumber) {
                nextOrderNumber = lastOrder.orderNumber + 1;
            }
        }

        const orderPayload = {
            customerName,
            customerPhone: customerPhone || 'N/A',
            isDineIn: !!isDineIn,
            deliveryAddress: isDineIn ? { street: 'Local', number: 'S/N', neighborhood: 'Local', references: 'N/A' } : (deliveryAddress || {}),
            items,
            paymentMethod: paymentMethod || 'Efectivo',
            totalAmount,
            status: 'Pendiente',
            createdAt: new Date().toISOString()
        };

        const newOrder = new Order(orderPayload, nextOrderNumber);
        const docRef = await db.collection('orders').add(JSON.parse(JSON.stringify(newOrder)));

        res.status(201).json({
            success: true,
            message: `¡Pedido #${nextOrderNumber} registrado con éxito!`,
            data: { id: docRef.id, ...newOrder }
        });
    } catch (error) {
        console.error('Error detallado al crear pedido:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. Actualizar el estatus del pedido y notificar por Socket.io
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Pendiente', 'En Preparación', 'En Ruta', 'Entregado', 'Cancelado'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Estatus no válido' });
        }

        const orderRef = db.collection('orders').doc(id);
        const doc = await orderRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
        }

        await orderRef.update({ status });

        if (req.app && req.app.io) {
            req.app.io.to(`order_${id}`).emit('order_status_updated', {
                orderId: id,
                status: status,
                updatedAt: new Date().toISOString()
            });
            req.app.io.emit('global_order_update', { orderId: id, status });
        }

        res.status(200).json({
            success: true,
            message: `🔄 Estatus del pedido actualizado a: ${status}`
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Obtener reporte de ventas (Solo pedidos Entregados)
const getSalesReport = async (req, res) => {
    try {
        const snapshot = await db.collection('orders').where('status', '==', 'Entregado').get();
        
        let totalRevenue = 0;
        let totalOrders = 0;
        const ordersList = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            totalRevenue += Number(data.totalAmount) || 0;
            totalOrders += 1;
            ordersList.push({ id: doc.id, ...data });
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: totalRevenue.toFixed(2),
                totalOrders,
                ordersList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getOrders,
    createOrder,
    updateOrderStatus,
    getSalesReport,
};