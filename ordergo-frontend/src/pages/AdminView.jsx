import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Utensils, BarChart3, LogOut, Trash2, Edit, Plus, FileText, CheckCircle, X, Printer } from 'lucide-react';

export default function AdminView({ onLogout }) {
    // Cambiamos el estado inicial a 'productos' ya que eliminamos la gestión de usuarios
    const [activeSection, setActiveSection] = useState('productos');

    // Estados de datos (se eliminó el estado y funciones de 'users')
    const [products, setProducts] = useState([]);
    const [salesReport, setSalesReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Estados para el Modal / Formulario de Productos
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        description: '',
        price: '',
        category: 'General',
        availability: true
    });

    // Cargar datos según la sección activa
    useEffect(() => {
        if (activeSection === 'productos') fetchProducts();
        if (activeSection === 'reportes') fetchSalesReport();
    }, [activeSection]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products');
            if (response.data.success) setProducts(response.data.data);
        } catch (err) {
            console.error('Error al cargar productos:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/orders/report/sales');
            if (response.data.success) setSalesReport(response.data.data);
        } catch (err) {
            console.error('Error al generar reporte:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto del menú?')) return;
        try {
            await api.delete(`/products/${id}`);
            setProducts(products.filter(p => p.id !== id));
            setMessage('Producto eliminado correctamente.');
        } catch (err) {
            alert('No se pudo eliminar el producto.');
        }
    };

    // Abrir modal para crear
    const handleOpenCreateProduct = () => {
        setEditingProduct(null);
        setProductForm({ name: '', description: '', price: '', category: 'General', availability: true });
        setShowProductModal(true);
    };

    // Abrir modal para editar
    const handleOpenEditProduct = (product) => {
        setEditingProduct(product.id);
        setProductForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price || '',
            category: product.category || 'General',
            availability: product.availability ?? true
        });
        setShowProductModal(true);
    };

    // Guardar (Crear o Actualizar) producto
    const handleSaveProduct = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct}`, productForm);
                setMessage('🔄 Producto actualizado correctamente.');
            } else {
                await api.post('/products', productForm);
                setMessage('✅ Producto creado exitosamente.');
            }
            setShowProductModal(false);
            fetchProducts();
        } catch (err) {
            console.error('Error al guardar producto:', err);
            alert('Hubo un error al guardar el producto.');
        }
    };

    // Función para generar y abrir la vista de impresión/PDF del reporte
    const handlePrintPDFReport = () => {
        if (!salesReport || !salesReport.ordersList) {
            alert('No hay datos suficientes para generar el reporte.');
            return;
        }

        const productMap = {};
        salesReport.ordersList.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const name = item.name || item.nombre || 'Producto';
                    const quantity = Number(item.quantity || item.cantidad || 1);
                    const price = Number(item.price || item.precio || 0);

                    if (!productMap[name]) {
                        productMap[name] = { quantity: 0, total: 0 };
                    }
                    productMap[name].quantity += quantity;
                    productMap[name].total += (quantity * price);
                });
            }
        });

        let granTotal = 0;
        let rowsHtml = '';
        
        Object.keys(productMap).forEach(productName => {
            const item = productMap[productName];
            granTotal += item.total;
            rowsHtml += `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${productName}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.total.toFixed(2)}</td>
                </tr>
            `;
        });

        const printWindow = window.open('', '_blank', 'width=600,height=600');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Reporte de Ventas - OrderGo</title>
                    <style>
                        body { font-family: monospace; padding: 20px; color: #000; }
                        h2, p { text-align: center; margin: 5px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { border-bottom: 2px solid #000; text-align: left; padding: 8px; }
                        .total { margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <h2>OrderGo - Cadereyta de Montes</h2>
                    <p>Reporte de Productos Vendidos</p>
                    <p style="font-size: 12px; color: #555;">Fecha: ${new Date().toLocaleString()}</p>
                    <hr style="border: dashed 1px #000; margin: 15px 0;" />
                    <table>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th style="text-align: center;">Cant.</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <div class="total">
                        Suma Total: $${granTotal.toFixed(2)}
                    </div>
                    <script>
                        window.onload = function() {
                            window.print();
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Roboto, Inter, sans-serif' }}>
            
            {/* Sidebar */}
            <aside style={{ width: '260px', backgroundColor: '#1B4965', color: '#FFFFFF', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src="/OGlogo.png" alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', backgroundColor: '#FF6B35', padding: '2px 8px', borderRadius: '4px' }}>Gerencia</span>
                </div>

                <nav style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <button 
                        onClick={() => setActiveSection('productos')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', backgroundColor: activeSection === 'productos' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', textAlign: 'left' }}
                    >
                        <Utensils size={20} /> Productos Ofertados
                    </button>
                    <button 
                        onClick={() => setActiveSection('reportes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', backgroundColor: activeSection === 'reportes' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', textAlign: 'left' }}
                    >
                        <BarChart3 size={20} /> Reportes de Venta
                    </button>
                </nav>

                <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                        onClick={onLogout}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', backgroundColor: '#FF6B35', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flexGrow: 1, padding: '40px', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <div>
                        <h2 style={{ fontSize: '26px', color: '#1B4965', fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>
                            {activeSection === 'productos' && 'Catálogo de Productos Ofertados'}
                            {activeSection === 'reportes' && 'Reportes Financieros y de Ventas'}
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Panel de administración centralizado OrderGo - Cadereyta de Montes</p>
                    </div>

                    {activeSection === 'productos' && (
                        <button 
                            onClick={handleOpenCreateProduct}
                            style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        >
                            <Plus size={18} /> Agregar Producto
                        </button>
                    )}
                </header>

                {message && (
                    <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '12px 20px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <CheckCircle size={18} /> {message}
                    </div>
                )}

                {loading && <p style={{ color: '#64748B' }}>Cargando información...</p>}

                {/* 1. SECCIÓN PRODUCTOS */}
                {activeSection === 'productos' && !loading && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {products.length > 0 ? products.map((p) => (
                                <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', color: '#1B4965', margin: '0 0 8px 0' }}>{p.name}</h3>
                                        <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 12px 0' }}>{p.description}</p>
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#FF6B35' }}>${p.price}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                                        <button onClick={() => handleOpenEditProduct(p)} style={{ backgroundColor: '#E3F2FD', color: '#1565C0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Edit size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleDeleteProduct(p.id)} style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ color: '#64748B' }}>No hay productos registrados en el menú.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. SECCIÓN REPORTES */}
                {activeSection === 'reportes' && !loading && (
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', color: '#1B4965', margin: 0 }}>Métricas y Corte de Caja</h3>
                                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Resumen general de las operaciones realizadas en la plataforma.</p>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={fetchSalesReport} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={16} /> Actualizar Reporte
                                </button>
                                <button onClick={handlePrintPDFReport} style={{ backgroundColor: '#1B4965', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Printer size={16} /> Descargar PDF / Imprimir
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginTop: '20px' }}>
                            <div style={{ backgroundColor: '#F8F9FA', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #1B4965' }}>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>TOTAL DE VENTAS ACUMULADAS</span>
                                <h4 style={{ fontSize: '28px', color: '#1B4965', margin: '8px 0 0 0' }}>
                                    ${salesReport?.totalRevenue || '0.00'}
                                </h4>
                            </div>
                            <div style={{ backgroundColor: '#F8F9FA', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #FF6B35' }}>
                                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>PEDIDOS PROCESADOS</span>
                                <h4 style={{ fontSize: '28px', color: '#FF6B35', margin: '8px 0 0 0' }}>
                                    {salesReport?.totalOrders || '0'}
                                </h4>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* MODAL PARA CREAR / EDITAR PRODUCTO */}
            {showProductModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '450px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, color: '#1B4965' }}>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                            <button onClick={() => setShowProductModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5568', marginBottom: '5px' }}>Nombre del Producto</label>
                                <input 
                                    type="text" 
                                    required
                                    value={productForm.name} 
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                                    placeholder="Ej. Hamburguesa Doble"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5568', marginBottom: '5px' }}>Descripción</label>
                                <textarea 
                                    rows="3"
                                    value={productForm.description} 
                                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                                    placeholder="Ingredientes o detalles..."
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5568', marginBottom: '5px' }}>Precio ($)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    value={productForm.price} 
                                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4A5568', marginBottom: '5px' }}>Categoría</label>
                                <input 
                                    type="text" 
                                    value={productForm.category} 
                                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                                    placeholder="Ej. Alimentos, Bebidas"
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowProductModal(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: 'white', color: '#4A5568', fontWeight: '600', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#FF6B35', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                    {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}