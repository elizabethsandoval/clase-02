// ============================================
// CONFIGURACIÓN
// ============================================
const API_BASE = 'http://127.0.0.1:8000';
const PROTECTED_TABS = ['servicios', 'mascotas', 'reporte'];

// ============================================
// ESTADO GLOBAL
// ============================================
let appState = {
    isLoggedIn: false,
    userEmail: null,
    servicios: []
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    restoreSessionFromLocalStorage();
    loadInitialData();
});

// ============================================
// UTILIDADES DE CARGA
// ============================================
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Cargando...';
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';
    } else {
        button.textContent = button.dataset.originalText || 'Enviar';
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// ============================================
// UTILIDADES DE SESIÓN
// ============================================
function saveSessionToLocalStorage() {
    const sessionData = {
        isLoggedIn: appState.isLoggedIn,
        userEmail: appState.userEmail,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('petcareSession', JSON.stringify(sessionData));
}

function restoreSessionFromLocalStorage() {
    const sessionString = localStorage.getItem('petcareSession');
    
    if (sessionString) {
        try {
            const sessionData = JSON.parse(sessionString);
            appState.isLoggedIn = sessionData.isLoggedIn;
            appState.userEmail = sessionData.userEmail;
            
            updateUserBadge();
            updateTabLocks();
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            localStorage.removeItem('petcareSession');
        }
    }
}

function clearSessionFromLocalStorage() {
    localStorage.removeItem('petcareSession');
}

// ============================================
// DIÁLOGO DE CONFIRMACIÓN
// ============================================
function showConfirmDialog(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    ;

    const modal = document.createElement('div');
    modal.style.cssText = 
        background-color: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    ;

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = 
        margin-bottom: 2rem;
        font-size: 1rem;
        color: var(--color-text-primary);
        text-align: center;
    ;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 
        display: flex;
        gap: 1rem;
        justify-content: center;
    ;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.style.cssText = 
        padding: 0.75rem 1.5rem;
        border: 2px solid var(--color-primary);
        background-color: white;
        color: var(--color-primary);
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    ;
    cancelBtn.onmouseover = () => {
        cancelBtn.style.backgroundColor = 'var(--color-primary-light)';
    };
    cancelBtn.onmouseout = () => {
        cancelBtn.style.backgroundColor = 'white';
    };

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirmar';
    confirmBtn.style.cssText = 
        padding: 0.75rem 1.5rem;
        background-color: var(--color-primary);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    ;
    confirmBtn.onmouseover = () => {
        confirmBtn.style.backgroundColor = 'var(--color-primary-dark)';
    };
    confirmBtn.onmouseout = () => {
        confirmBtn.style.backgroundColor = 'var(--color-primary)';
    };

    buttonsContainer.appendChild(cancelBtn);
    buttonsContainer.appendChild(confirmBtn);

    modal.appendChild(messageEl);
    modal.appendChild(buttonsContainer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const closeDialog = () => {
        overlay.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
    };

    cancelBtn.addEventListener('click', () => {
        closeDialog();
        onCancel();
    });

    confirmBtn.addEventListener('click', () => {
        closeDialog();
        onConfirm();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeDialog();
            onCancel();
        }
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            switchTab(tabName);
        });
    });

    document.querySelector('.form-saludo').addEventListener('submit', handleSaludo);
    document.querySelector('.form-registro').addEventListener('submit', handleRegister);
    document.querySelector('.form-login').addEventListener('submit', handleLogin);
    document.querySelector('.form-servicio').addEventListener('submit', handleAgregarServicio);
    document.querySelector('.form-mascota').addEventListener('submit', handleRegistrarMascota);
    document.querySelector('.form-buscar-mascota').addEventListener('submit', handleBuscarMascota);
    document.querySelector('.form-buscar-reporte').addEventListener('submit', handleBuscarReporte);

    document.querySelector('.btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        showConfirmDialog(
            '¿Realmente deseas cerrar sesión?',
            () => handleLogout(),
            () => {}
        );
    });
}

function loadInitialData() {
    loadServicios();
}

// ============================================
// NAVEGACIÓN Y TABS
// ============================================
function switchTab(tabName) {
    if (PROTECTED_TABS.includes(tabName) && !appState.isLoggedIn) {
        showAlert('Debes iniciar sesión para acceder a esta sección', 'error');
        return;
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const section = document.getElementById(tabName);
    if (section) {
        section.classList.add('active');
    }

    const link = document.querySelector('[data-tab="' + tabName + '"]');
    if (link) {
        link.classList.add('active');
    }

    if (tabName === 'reporte' && appState.isLoggedIn) {
        document.getElementById('reporte-email').value = appState.userEmail;
    }
}

function updateTabLocks() {
    PROTECTED_TABS.forEach(tabName => {
        const link = document.querySelector('[data-tab="' + tabName + '"]');
        if (appState.isLoggedIn) {
            link.classList.remove('locked');
            link.style.opacity = '1';
            link.style.pointerEvents = 'auto';
        } else {
            link.classList.add('locked');
            link.style.opacity = '0.4';
            link.style.pointerEvents = 'none';
        }
    });
}

// ============================================
// FORMULARIO SALUDO
// ============================================
async function handleSaludo(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-saludo').value;
    const button = e.target.querySelector('button[type="submit"]');

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/bienvenido/' + nombre);
        const data = await response.json();
        showAlert(data.mensaje, 'success');
        document.querySelector('.form-saludo').reset();
    } catch (error) {
        showAlert('Error al saludar: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('registro-email').value;
    const usuario = document.getElementById('registro-usuario').value;
    const password = document.getElementById('registro-password').value;
    const confirmPassword = document.getElementById('registro-confirm-password').value;
    const button = e.target.querySelector('button[type="submit"]');

    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contraseña: password })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert(data.mensaje || 'Registro exitoso', 'success');
            document.querySelector('.form-registro').reset();
        } else {
            showAlert(data.mensaje || data.detail || 'Error en el registro', 'error');
        }
    } catch (error) {
        showAlert('Error al registrar: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const button = e.target.querySelector('button[type="submit"]');

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: email, contraseña: password })
        });

        const data = await response.json();

        if (response.ok && data.datos) {
            appState.isLoggedIn = true;
            appState.userEmail = email;

            saveSessionToLocalStorage();
            updateUserBadge();
            updateTabLocks();
            showAlert(data.mensaje || 'Login exitoso', 'success');
            document.querySelector('.form-login').reset();

            setTimeout(() => {
                switchTab('servicios');
            }, 500);
        } else {
            showAlert(data.mensaje || data.detail || 'Credenciales inválidas', 'error');
        }
    } catch (error) {
        showAlert('Error al iniciar sesión: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

function handleLogout() {
    appState.isLoggedIn = false;
    appState.userEmail = null;

    clearSessionFromLocalStorage();
    updateUserBadge();
    updateTabLocks();
    showAlert('Sesión cerrada', 'success');
    switchTab('acceso');
}

function updateUserBadge() {
    const userNameEl = document.querySelector('.user-name');
    if (appState.isLoggedIn) {
        userNameEl.textContent = appState.userEmail.split('@')[0];
    } else {
        userNameEl.textContent = 'Usuario';
    }
}

// ============================================
// SERVICIOS
// ============================================
async function loadServicios() {
    try {
        const response = await fetch(API_BASE + '/servicios');
        const data = await response.json();
        appState.servicios = data.servicios || [];
        renderServicios();
        updateSelectServicios();
    } catch (error) {
        console.error('Error al cargar servicios:', error);
    }
}

function renderServicios() {
    const lista = document.getElementById('lista-servicios');
    if (appState.servicios.length === 0) {
        lista.innerHTML = '<li>No hay servicios disponibles</li>';
        return;
    }

    lista.innerHTML = appState.servicios.map(servicio => '<li><strong>' + servicio.nombre + '</strong><span style="color: var(--color-primary); font-weight: 600;">$' + servicio.precio.toFixed(2) + '</span></li>').join('');
}

function updateSelectServicios() {
    const select = document.getElementById('mascota-servicio');
    select.innerHTML = '<option value="">Selecciona un servicio</option>';
    appState.servicios.forEach(servicio => {
        const option = document.createElement('option');
        option.value = servicio.nombre;
        option.textContent = servicio.nombre + ' - $' + servicio.precio.toFixed(2);
        select.appendChild(option);
    });
}

async function handleAgregarServicio(e) {
    e.preventDefault();
    const nombre = document.getElementById('servicio-nombre').value;
    const precio = parseFloat(document.getElementById('servicio-precio').value);
    const button = e.target.querySelector('button[type="submit"]');

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/agregar-servicio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre, precio: precio })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Servicio agregado exitosamente', 'success');
            document.querySelector('.form-servicio').reset();
            await loadServicios();
        } else {
            showAlert(data.detail || 'Error al agregar servicio', 'error');
        }
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

// ============================================
// MASCOTAS
// ============================================
async function handleRegistrarMascota(e) {
    e.preventDefault();
    const correo = document.getElementById('mascota-email').value;
    const nombre = document.getElementById('mascota-nombre').value;
    const tipo_servicio = document.getElementById('mascota-servicio').value;
    const fecha = document.getElementById('mascota-fecha').value;
    const button = e.target.querySelector('button[type="submit"]');

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/registrar-mascota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: correo, nombre: nombre, tipo_servicio: tipo_servicio, fecha: fecha })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Mascota registrada exitosamente', 'success');
            document.querySelector('.form-mascota').reset();
            await loadMascotas(correo);
        } else {
            showAlert(data.detail || 'Error al registrar mascota', 'error');
        }
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function handleBuscarMascota(e) {
    e.preventDefault();
    const nombre = document.getElementById('buscar-mascota-nombre').value;
    const button = e.target.querySelector('button[type="submit"]');
    
    if (!nombre) {
        showAlert('Ingresa un nombre para buscar', 'error');
        return;
    }

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/mascotas/' + nombre);
        const data = await response.json();

        if (response.ok && data.mascotas) {
            renderMascotas(data.mascotas);
            showAlert('Búsqueda completada', 'success');
        } else {
            showAlert('No se encontraron mascotas', 'error');
            renderMascotas([]);
        }
    } catch (error) {
        showAlert('Error en la búsqueda: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

async function loadMascotas(correo) {
    try {
        const response = await fetch(API_BASE + '/mascotas/' + correo);
        const data = await response.json();

        if (response.ok && data.mascotas) {
            renderMascotas(data.mascotas);
        } else {
            renderMascotas([]);
        }
    } catch (error) {
        console.error('Error al cargar mascotas:', error);
        renderMascotas([]);
    }
}

function renderMascotas(mascotas) {
    const lista = document.getElementById('lista-mascotas');
    
    if (!mascotas || mascotas.length === 0) {
        lista.innerHTML = '<li>No hay mascotas registradas</li>';
        return;
    }

    lista.innerHTML = mascotas.map(mascota => '<li><div style="margin-bottom: 0.5rem;"><strong style="font-size: 1.1rem;">' + mascota.nombre + '</strong></div><div style="font-size: 0.9rem; color: var(--color-text-secondary);"><p>📧 ' + mascota.correo + '</p><p>🛠️ ' + mascota.tipo_servicio + '</p><p>📅 ' + mascota.fecha + '</p></div></li>').join('');
}

// ============================================
// REPORTE
// ============================================
async function handleBuscarReporte(e) {
    e.preventDefault();
    const correo = document.getElementById('reporte-email').value;
    const button = e.target.querySelector('button[type="submit"]');

    if (!correo) {
        showAlert('Ingresa un correo para buscar', 'error');
        return;
    }

    setButtonLoading(button, true);

    try {
        const response = await fetch(API_BASE + '/reporte/' + correo);
        const data = await response.json();

        if (response.ok) {
            renderReporte(data);
            showAlert('Reporte cargado', 'success');
        } else {
            showAlert(data.detail || 'Error al cargar reporte', 'error');
            renderReporte(null);
        }
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
        renderReporte(null);
    } finally {
        setButtonLoading(button, false);
    }
}

function renderReporte(data) {
    const resultados = document.getElementById('resultados-area');

    if (!data) {
        resultados.innerHTML = '<p>No hay datos disponibles</p>';
        return;
    }

    const serviciosHtml = data.servicios && data.servicios.length > 0
        ? data.servicios.map(s => '<span style="display: inline-block; background-color: var(--color-primary); color: white; padding: 0.35rem 0.75rem; border-radius: 20px; font-size: 0.85rem; margin-right: 0.5rem; margin-bottom: 0.5rem;">' + s + '</span>').join('')
        : '<p style="color: var(--color-text-secondary);">Sin servicios</p>';

    resultados.innerHTML = '<div style="text-align: left; max-width: 600px; margin: 0 auto;"><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem;"><div style="background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%); color: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-md);"><p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Servicios Usados</p><p style="font-size: 2rem; font-weight: 700;">' + data.cantidad_servicios + '</p></div><div style="background: linear-gradient(135deg, var(--color-success) 0%, #34d399 100%); color: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-md);"><p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Total Gastado</p><p style="font-size: 2rem; font-weight: 700;">$' + data.total_gastado.toFixed(2) + '</p></div><div style="background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: white; padding: 1.5rem; border-radius: 10px; text-align: center; box-shadow: var(--shadow-md);"><p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 0.5rem;">Correo</p><p style="font-size: 0.95rem; font-weight: 600; word-break: break-all;">' + data.correo + '</p></div></div><div><h4 style="margin-bottom: 1rem; color: var(--color-text-primary);">Servicios Utilizados</h4><div>' + serviciosHtml + '</div></div></div>';
}

// ============================================
// ALERTAS
// ============================================
function showAlert(message, type) {
    if (!type) type = 'info';
    
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alert-container';
        alertContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        document.body.appendChild(alertContainer);
    }

    const alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.style.cssText = 'padding: 1rem; border-radius: 8px; margin-bottom: 0.5rem; animation: slideIn 0.3s ease; box-shadow: var(--shadow-lg);';

    if (type === 'success') {
        alert.style.cssText += 'background-color: var(--color-success-light); color: #047857; border-left: 4px solid var(--color-success);';
    } else if (type === 'error') {
        alert.style.cssText += 'background-color: var(--color-error-light); color: #991b1b; border-left: 4px solid var(--color-error);';
    } else {
        alert.style.cssText += 'background-color: #dbeafe; color: #1e40af; border-left: 4px solid #3b82f6;';
    }

    alert.textContent = message;
    alertContainer.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// ============================================
// ESTILOS DE ANIMACIÓN
// ============================================
const style = document.createElement('style');
style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } } @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
document.head.appendChild(style);

// ============================================
// INICIALIZAR BLOQUEOS DE TABS
// ============================================
updateTabLocks();