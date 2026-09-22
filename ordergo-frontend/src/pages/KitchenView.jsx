import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';
import { ChefHat, User, ArrowRight, Plus, Trash2, X, Utensils } from 'lucide-react';

export default function KitchenView() {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]); 
    const [draggedOrderId, setDraggedOrderId] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

    const [newOrderForm, setNewOrderForm] = useState({
        customerName: '',
        customerPhone: '',
        isDineIn: false,
        street: '',
        number: '',
        neighborhood: '',
        references: '',
        paymentMethod: 'Efectivo'
    });

    const [orderItems, setOrderItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        name: '',
        quantity: 1,
        price: 0
    });

    const fetchOrders = async () => {
        try {
            const response = await api.get('/orders');
            if (response.data.success && Array.isArray(response.data.data)) {
                const normalizedOrders = response.data.data.map(order => {
                    let currentStatus = order.status;
                    if (currentStatus === 'En preparacion' || currentStatus === 'en preparacion') {
                        currentStatus = 'En Preparación';
                    }
                    return { ...order, status: currentStatus };
                });
                setOrders(normalizedOrders);
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await api.get('/products');
            if (response.data.success && Array.isArray(response.data.data)) {
                setProducts(response.data.data);
                if (response.data.data.length > 0) {
                    setCurrentItem({
                        name: response.data.data[0].name,
                        quantity: 1,
                        price: response.data.data[0].price
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar productos del menú:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchProducts(); 

        socket.on('global_order_update', (update) => {
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === update.orderId ? { ...order, status: update.status } : order
                )
            );
        });

        return () => {
            socket.off('global_order_update');
        };
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status`, { status: newStatus });
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder(prev => ({ ...prev, status: newStatus }));
            }

            if (newStatus === 'Entregado') {
                setTimeout(async () => {
                    try {
                        await api.delete(`/orders/${orderId}`);
                        setOrders(prev => prev.filter(o => o.id !== orderId));
                        setSelectedOrder(prev => (prev?.id === orderId ? null : prev));
                    } catch (err) {
                        console.error('Error al auto-eliminar pedido entregado:', err);
                    }
                }, 3 * 60 * 1000); // 3 minutos
            }
        } catch (error) {
            console.error('Error al actualizar estatus:', error);
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('¿Estás seguro de eliminar este pedido?')) return;
        try {
            await api.delete(`/orders/${orderId}`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            alert('No se pudo eliminar el pedido. Revisa la consola.');
        }
    };

    const handleAddProductToOrder = () => {
        if (!currentItem.name) return;
        const existingIndex = orderItems.findIndex(item => item.name === currentItem.name);
        if (existingIndex > -1) {
            const updated = [...orderItems];
            updated[existingIndex].quantity += Number(currentItem.quantity);
            setOrderItems(updated);
        } else {
            setOrderItems([...orderItems, { ...currentItem, quantity: Number(currentItem.quantity) }]);
        }
    };

    const handleRemoveItemFromCart = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const calculateTotalAmount = () => {
        return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (orderItems.length === 0) {
            alert('Debe agregar al menos un producto al pedido.');
            return;
        }

        try {
            const totalAmount = calculateTotalAmount();

            const payload = {
                customerName: newOrderForm.customerName || 'Cliente en Local',
                customerPhone: newOrderForm.isDineIn ? 'N/A' : newOrderForm.customerPhone,
                isDineIn: newOrderForm.isDineIn,
                deliveryAddress: newOrderForm.isDineIn ? {
                    street: 'Consumo en Local',
                    number: 'S/N',
                    neighborhood: 'Local',
                    references: 'N/A'
                } : {
                    street: newOrderForm.street,
                    number: newOrderForm.number,
                    neighborhood: newOrderForm.neighborhood,
                    references: newOrderForm.references
                },
                items: orderItems,
                paymentMethod: newOrderForm.paymentMethod,
                totalAmount: totalAmount
            };

            const response = await api.post('/orders', payload);
            if (response.data.success) {
                fetchOrders();
                setIsCreateModalOpen(false);
                setNewOrderForm({
                    customerName: '',
                    customerPhone: '',
                    isDineIn: false,
                    street: '',
                    number: '',
                    neighborhood: '',
                    references: '',
                    paymentMethod: 'Efectivo'
                });
                setOrderItems([]);
            }
        } catch (error) {
            console.error('Error al crear pedido:', error);
            alert('Error al guardar el pedido. Verifica los datos.');
        }
    };

    const handleDragStart = (e, order) => {
        if (order.status === 'Entregado') {
            e.preventDefault();
            return;
        }
        setDraggedOrderId(order.id);
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        if (draggedOrderId) {
            handleStatusChange(draggedOrderId, targetStatus);
            setDraggedOrderId(null);
        }
    };

    const columns = [
        { title: 'Pendientes', statusKey: 'Pendiente', color: '#E65100', bgHeader: '#FFF3E0' },
        { title: 'En Preparación', statusKey: 'En Preparación', color: '#1565C0', bgHeader: '#E3F2FD' },
        { title: 'En Ruta / Servido', statusKey: 'En Ruta', color: '#6A1B9A', bgHeader: '#F3E5F5' },
        { title: 'Entregados / Cobrados', statusKey: 'Entregado', color: '#2E7D32', bgHeader: '#E8F5E9' }
    ];

    const inputStyle = {
        width: '100%',
        padding: '8px',
        border: '1px solid #CBD5E0',
        borderRadius: '4px',
        backgroundColor: '#FFFFFF',
        color: '#2D3748',
        fontSize: '13px',
        boxSizing: 'border-box'
    };

    const disabledInputStyle = {
        ...inputStyle,
        backgroundColor: '#E2E8F0',
        color: '#4A5568',
        cursor: 'not-allowed'
    };

    return (
        <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            
            <header style={{ 
                backgroundColor: '#1B4965', 
                color: '#FFFFFF', 
                padding: '12px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ChefHat size={24} color="#FF6B35" />
                    <h1 style={{ fontSize: '18px', fontWeight: '600', margin: 0, letterSpacing: '0.5px' }}>
                        OrderGo <span style={{ fontWeight: '300', opacity: 0.8 }}>| Panel de Operaciones</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button 
                        onClick={() => { fetchProducts(); setIsCreateModalOpen(true); }}
                        style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}
                    >
                        <Plus size={16} /> Nuevo Pedido
                    </button>
                </div>
            </header>

            <main style={{ padding: '16px', flexGrow: 1, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'flex-start' }}>
                    {columns.map(col => {
                        const columnOrders = orders.filter(o => o.status === col.statusKey);
                        return (
                            <div 
                                key={col.statusKey}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.statusKey)}
                                style={{ 
                                    backgroundColor: '#EDF2F7', 
                                    borderRadius: '8px', 
                                    padding: '12px',
                                    minHeight: '80vh',
                                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <div style={{ 
                                    backgroundColor: col.bgHeader, 
                                    color: col.color, 
                                    padding: '10px 12px', 
                                    borderRadius: '6px', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    <span>{col.title}</span>
                                    <span style={{ backgroundColor: 'white', color: col.color, padding: '1px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>
                                        {columnOrders.length}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
                                    {columnOrders.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#A0AEC0', padding: '30px 10px', fontSize: '12px', border: '2px dashed #CBD5E0', borderRadius: '6px' }}>
                                            Sin comandas
                                        </div>
                                    ) : (
                                        columnOrders.map(order => (
                                            <div 
                                                key={order.id}
                                                draggable={order.status !== 'Entregado'}
                                                onDragStart={(e) => handleDragStart(e, order)}
                                                onClick={() => setSelectedOrder(order)}
                                                style={{ 
                                                    backgroundColor: '#FFFFFF', 
                                                    borderRadius: '6px', 
                                                    padding: '12px', 
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                                                    borderLeft: `4px solid ${col.color}`,
                                                    cursor: order.status === 'Entregado' ? 'default' : 'pointer',
                                                    opacity: order.status === 'Entregado' ? 0.9 : 1,
                                                    transition: 'transform 0.1s ease',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#1B4965' }}>
                                                        #{order.orderNumber || order.id.slice(-5)}
                                                    </span>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#FF6B35' }}>
                                                        ${order.totalAmount || 0}
                                                    </span>
                                                </div>

                                                <div style={{ marginBottom: '8px', fontSize: '12px', color: '#2D3748' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                                                        {order.isDineIn ? <Utensils size={13} color="#E65100" /> : <User size={13} color="#718096" />}
                                                        <span>{order.customerName} {order.isDineIn && <span style={{fontSize: '10px', backgroundColor: '#FFF3E0', color: '#E65100', padding: '1px 4px', borderRadius: '4px'}}>Local</span>}</span>
                                                    </div>
                                                </div>

                                                <div style={{ borderTop: '1px solid #E2E8F0', padding: '6px 0', fontSize: '12px', color: '#4A5568' }}>
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx}>{item.quantity}x {item.name}</div>
                                                    ))}
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                                                    {order.status === 'Pendiente' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'En Preparación'); }}
                                                            style={{ background: 'none', border: 'none', color: '#1565C0', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                        >
                                                            Preparar <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                    {order.status === 'En Preparación' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'En Ruta'); }}
                                                            style={{ background: 'none', border: 'none', color: '#6A1B9A', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                        >
                                                            {order.isDineIn ? 'Servir' : 'Enviar'} <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                    {order.status === 'En Ruta' && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'Entregado'); }}
                                                            style={{ background: 'none', border: 'none', color: '#2E7D32', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
                                                        >
                                                            Entregar <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* MODAL DETALLES / ELIMINAR PEDIDO */}
            {selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '450px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Pedido #{selectedOrder.orderNumber || selectedOrder.id.slice(-5)}</h2>
                            <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>
                        
                        <div style={{ fontSize: '13px', color: '#333', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            <div><strong>Tipo:</strong> {selectedOrder.isDineIn ? '🍽️ Comer en Local' : '🛵 Pedido a Domicilio'}</div>
                            <div><strong>Cliente:</strong> {selectedOrder.customerName}</div>
                            <div><strong>Estatus Actual:</strong> {selectedOrder.status}</div>
                            <div><strong>Método de Pago:</strong> {selectedOrder.paymentMethod || 'Efectivo'}</div>
                            
                            {!selectedOrder.isDineIn && selectedOrder.deliveryAddress && (
                                <div><strong>Dirección:</strong> {selectedOrder.deliveryAddress.street} #{selectedOrder.deliveryAddress.number}, Col. {selectedOrder.deliveryAddress.neighborhood}</div>
                            )}

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px' }}>
                                <strong>Productos:</strong>
                                {selectedOrder.items?.map((it, i) => (
                                    <div key={i}>- {it.quantity}x {it.name} (${it.price * it.quantity} total)</div>
                                ))}
                            </div>
                            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#FF6B35', marginTop: '8px' }}>
                                Total: ${selectedOrder.totalAmount}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                            <button 
                                onClick={() => handleDeleteOrder(selectedOrder.id)}
                                style={{ backgroundColor: '#D32F2F', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' }}
                            >
                                <Trash2 size={16} /> Eliminar Pedido
                            </button>
                            <button 
                                onClick={() => setSelectedOrder(null)}
                                style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NUEVO PEDIDO */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1B4965', margin: 0 }}>Registrar Nuevo Pedido</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                            
                            <div style={{ backgroundColor: '#FFF3E0', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #FFE0B2' }}>
                                <input 
                                    type="checkbox" 
                                    id="isDineInCheck"
                                    checked={newOrderForm.isDineIn}
                                    onChange={e => setNewOrderForm({...newOrderForm, isDineIn: e.target.checked})}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor="isDineInCheck" style={{ fontWeight: '600', color: '#E65100', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Utensils size={16} /> Pedido para Comer aquí (Local / Mesa)
                                </label>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Nombre / Referencia de Mesa del Cliente</label>
                                <input type="text" required value={newOrderForm.customerName} onChange={e => setNewOrderForm({...newOrderForm, customerName: e.target.value})} placeholder={newOrderForm.isDineIn ? "Ej. Mesa 3 o Luis" : "Ej. Juan Pérez"} style={inputStyle} />
                            </div>

                            {!newOrderForm.isDineIn && (
                                <div>
                                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Teléfono</label>
                                    <input type="text" required value={newOrderForm.customerPhone} onChange={e => setNewOrderForm({...newOrderForm, customerPhone: e.target.value})} placeholder="Ej. 4411234567" style={inputStyle} />
                                </div>
                            )}

                            <div style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '4px', fontWeight: 'bold', color: '#1B4965' }}>Agregar Productos al Pedido</div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'flex-end', backgroundColor: '#F8F9FA', padding: '10px', borderRadius: '6px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Producto</label>
                                    <select 
                                        value={currentItem.name} 
                                        onChange={e => {
                                            const selectedName = e.target.value;
                                            const found = products.find(p => p.name === selectedName);
                                            setCurrentItem({
                                                ...currentItem,
                                                name: selectedName,
                                                price: found ? found.price : 0
                                            });
                                        }}
                                        style={inputStyle}
                                    >
                                        {products.map(p => (
                                            <option key={p.id || p.name} value={p.name}>{p.name} (${p.price})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Cant.</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        value={currentItem.quantity} 
                                        onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} 
                                        style={inputStyle} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Precio Unit.</label>
                                    <input 
                                        type="number" 
                                        readOnly 
                                        value={currentItem.price} 
                                        style={disabledInputStyle} 
                                    />
                                </div>
                                <div>
                                    <button 
                                        type="button" 
                                        onClick={handleAddProductToOrder}
                                        style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', height: '35px' }}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {orderItems.length > 0 && (
                                <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px', maxHeight: '120px', overflowY: 'auto', backgroundColor: '#FFF' }}>
                                    {orderItems.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #F1F5F9', fontSize: '12px' }}>
                                            <span><strong>{item.quantity}x</strong> {item.name} (${item.price} c/u) = <strong>${item.price * item.quantity}</strong></span>
                                            <button type="button" onClick={() => handleRemoveItemFromCart(index)} style={{ background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                        </div>
                                    ))}
                                    <div style={{ textAlign: 'right', fontWeight: '700', color: '#FF6B35', marginTop: '6px', fontSize: '14px' }}>
                                        Total General: ${calculateTotalAmount()}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Método de Pago</label>
                                <select value={newOrderForm.paymentMethod} onChange={e => setNewOrderForm({...newOrderForm, paymentMethod: e.target.value})} style={inputStyle}>
                                    <option value="Efectivo" style={{ color: '#000' }}>💵 Efectivo</option>
                                    <option value="Tarjeta" style={{ color: '#000' }}>💳 Tarjeta (Terminal)</option>
                                    <option value="Transferencia" style={{ color: '#000' }}>📱 Transferencia</option>
                                </select>
                            </div>

                            {!newOrderForm.isDineIn && (
                                <>
                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '8px', marginTop: '4px', fontWeight: 'bold', color: '#1B4965' }}>Dirección de Entrega</div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Calle</label>
                                            <input type="text" required={!newOrderForm.isDineIn} value={newOrderForm.street} onChange={e => setNewOrderForm({...newOrderForm, street: e.target.value})} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Número</label>
                                            <input type="text" required={!newOrderForm.isDineIn} value={newOrderForm.number} onChange={e => setNewOrderForm({...newOrderForm, number: e.target.value})} style={inputStyle} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Colonia / Sector</label>
                                        <input type="text" required={!newOrderForm.isDineIn} value={newOrderForm.neighborhood} onChange={e => setNewOrderForm({...newOrderForm, neighborhood: e.target.value})} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#2D3748' }}>Referencias</label>
                                        <input type="text" value={newOrderForm.references} onChange={e => setNewOrderForm({...newOrderForm, references: e.target.value})} placeholder="Ej. Casa de dos pisos color blanco" style={inputStyle} />
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ backgroundColor: '#CBD5E0', color: '#2D3748', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Cancelar</button>
                                <button type="submit" style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Guardar Pedido</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}