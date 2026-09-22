import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Users, Utensils, BarChart3, LogOut, Trash2, Edit, Plus, FileText, CheckCircle } from 'lucide-react';

export default function AdminView({ onLogout }) {
    const [activeSection, setActiveSection] = useState('usuarios');

    // Estados de datos
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [salesReport, setSalesReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Cargar datos según la sección activa
    useEffect(() => {
        if (activeSection === 'usuarios') fetchUsers();
        if (activeSection === 'productos') fetchProducts();
        if (activeSection === 'reportes') fetchSalesReport();
    }, [activeSection]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Asumiendo un endpoint GET /users en tu backend
            const response = await api.get('/users');
            if (response.data.success) setUsers(response.data.data);
        } catch (err) {
            console.error('Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            // Asumiendo tu ruta de productos existente
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
            const response = await api.get('/orders/report/sales'); // Ajusta según tu ruta de reportes
            if (response.data.success) setSalesReport(response.data.data);
        } catch (err) {
            console.error('Error al generar reporte:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (uid) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${uid}`);
            setUsers(users.filter(u => u.uid !== uid));
            setMessage('Usuario eliminado correctamente.');
        } catch (err) {
            alert('No se pudo eliminar el usuario.');
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

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8F9FA', fontFamily: 'Roboto, Inter, sans-serif' }}>
            
            {/* Sidebar Material Design */}
            <aside style={{ width: '260px', backgroundColor: '#1B4965', color: '#FFFFFF', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src="/OGlogo.png" alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', backgroundColor: '#FF6B35', padding: '2px 8px', borderRadius: '4px' }}>Gerencia</span>
                </div>

                <nav style={{ padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <button 
                        onClick={() => setActiveSection('usuarios')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px', backgroundColor: activeSection === 'usuarios' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', textAlign: 'left' }}
                    >
                        <Users size={20} /> Gestión de Usuarios
                    </button>
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
                            {activeSection === 'usuarios' && 'Control de Usuarios del Sistema'}
                            {activeSection === 'productos' && 'Catálogo de Productos Ofertados'}
                            {activeSection === 'reportes' && 'Reportes Financieros y de Ventas'}
                        </h2>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>Panel de administración centralizado OrderGo - Cadereyta de Montes</p>
                    </div>
                </header>

                {message && (
                    <div style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '12px 20px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <CheckCircle size={18} /> {message}
                    </div>
                )}

                {loading && <p style={{ color: '#64748B' }}>Cargando información...</p>}

                {/* 1. SECCIÓN USUARIOS */}
                {activeSection === 'usuarios' && !loading && (
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                            <thead style={{ backgroundColor: '#F1F5F9', color: '#1B4965', borderBottom: '2px solid #E2E8F0' }}>
                                <tr>
                                    <th style={{ padding: '16px' }}>Usuario</th>
                                    <th style={{ padding: '16px' }}>Correo Interno</th>
                                    <th style={{ padding: '16px' }}>Rol</th>
                                    <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length > 0 ? users.map((u) => (
                                    <tr key={u.uid} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '16px', fontWeight: '600', color: '#2D3748' }}>{u.username}</td>
                                        <td style={{ padding: '16px', color: '#64748B' }}>{u.email}</td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ backgroundColor: u.role === 'gerente' ? '#E3F2FD' : '#FFF3E0', color: u.role === 'gerente' ? '#1565C0' : '#E65100', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button onClick={() => handleDeleteUser(u.uid)} style={{ backgroundColor: '#FFEBEE', color: '#C62828', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>No hay usuarios registrados o cargados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 2. SECCIÓN PRODUCTOS */}
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

                {/* 3. SECCIÓN REPORTES */}
                {activeSection === 'reportes' && !loading && (
                    <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', color: '#1B4965', margin: 0 }}>Métricas y Corte de Caja</h3>
                                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Resumen general de las operaciones realizadas en la plataforma.</p>
                            </div>
                            <button onClick={fetchSalesReport} style={{ backgroundColor: '#FF6B35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} /> Actualizar Reporte
                            </button>
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
        </div>
    );
}