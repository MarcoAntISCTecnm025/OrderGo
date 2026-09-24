const express = require('express');
const router = express.Router();

// 💡 AQUÍ ESTABA EL DETALLE: Se debe incluir getSalesReport en la importación
const { 
    getOrders, 
    createOrder, 
    updateOrderStatus, 
    getSalesReport 
} = require('../controllers/orderController');

router.get('/', getOrders);
router.get('/report/sales', getSalesReport);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

module.exports = router;