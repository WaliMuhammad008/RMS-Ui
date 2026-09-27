/**
 * Restaurant Management System - Main Script
 * Vanilla JS, DOM Manipulation, Local Storage
 */

// ==========================================
// 1. State Management & Initial Data
// ==========================================

// Default Menu Items if LocalStorage is empty
const defaultMenuItems = [
    { id: 1, name: 'Grilled Salmon', category: 'Main Course', price: 24.99, image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&q=80&w=400', desc: 'Fresh salmon with lemon butter sauce.' },
    { id: 2, name: 'Caesar Salad', category: 'Appetizer', price: 9.50, image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&q=80&w=400', desc: 'Classic Caesar salad with croutons and parmesan.' },
    { id: 3, name: 'Chocolate Lava Cake', category: 'Dessert', price: 7.99, image: 'https://images.unsplash.com/photo-1563805042-7684c8a9e9ce?auto=format&fit=crop&q=80&w=400', desc: 'Warm chocolate cake with a molten center.' }
];

// App State
let state = {
    isAuthenticated: localStorage.getItem('rms_auth') === 'true',
    menu: JSON.parse(localStorage.getItem('rms_menu')) || defaultMenuItems,
    orders: JSON.parse(localStorage.getItem('rms_orders')) || [],
    currentBill: [] // items currently in the billing section
};

// Save state to LocalStorage
const saveState = () => {
    localStorage.setItem('rms_menu', JSON.stringify(state.menu));
    localStorage.setItem('rms_orders', JSON.stringify(state.orders));
};

// ==========================================
// 2. Navigation & Authentication
// ==========================================

const loginPage = document.getElementById('login-page');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const navLinks = document.querySelectorAll('.nav-link[data-target]');
const sections = document.querySelectorAll('.content-section');

// Check Auth on Load
function checkAuth() {
    if (state.isAuthenticated) {
        loginPage.classList.remove('active');
        appContainer.classList.add('active');
        updateDashboard();
    } else {
        loginPage.classList.add('active');
        appContainer.classList.remove('active');
    }
}

// Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Dummy authentication (accepts any input for demo purposes)
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        state.isAuthenticated = true;
        localStorage.setItem('rms_auth', 'true');
        checkAuth();
    }
});

// Logout
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    state.isAuthenticated = false;
    localStorage.setItem('rms_auth', 'false');
    checkAuth();
});

// Section Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class from all links and sections
        navLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked link and target section
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        // Update specific view data
        if(targetId === 'dashboard-section') updateDashboard();
        if(targetId === 'menu-section') renderMenuCards();
        if(targetId === 'orders-section') renderOrdersTable();
        if(targetId === 'billing-section') populateBillDropdown();
    });
});

// ==========================================
// 3. Dashboard Functionality
// ==========================================

function updateDashboard() {
    // Stats
    const totalOrders = state.orders.length;
    const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);
    const activeOrders = state.orders.filter(o => o.status === 'Pending').length;

    document.getElementById('stat-total-orders').textContent = totalOrders;
    document.getElementById('stat-total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('stat-active-orders').textContent = activeOrders;

    // Recent Orders Table
    const recentOrdersBody = document.getElementById('dashboard-recent-orders');
    recentOrdersBody.innerHTML = '';
    
    // Get last 5 orders
    const recent = [...state.orders].reverse().slice(0, 5);
    
    if(recent.length === 0) {
        recentOrdersBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No recent orders</td></tr>';
        return;
    }

    recent.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>Table ${order.table}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
        `;
        recentOrdersBody.appendChild(tr);
    });
}

// ==========================================
// 4. Menu Management
// ==========================================

const menuForm = document.getElementById('add-menu-form');
const menuContainer = document.getElementById('menu-container');

// Render Menu
function renderMenuCards() {
    menuContainer.innerHTML = '';
    if (state.menu.length === 0) {
        menuContainer.innerHTML = '<p class="text-muted full-width">No menu items found. Add some above.</p>';
        return;
    }

    state.menu.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card shadow-sm';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
            <div class="menu-card-body">
                <div class="menu-card-cat">${item.category}</div>
                <div class="menu-card-title">${item.name}</div>
                <div class="menu-card-desc">${item.desc}</div>
                <div class="menu-card-footer">
                    <span class="menu-price">$${item.price.toFixed(2)}</span>
                    <button class="btn btn-danger btn-sm" onclick="deleteMenuItem(${item.id})">Delete</button>
                </div>
            </div>
        `;
        menuContainer.appendChild(card);
    });
}

// Add Menu Item
menuForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newItem = {
        id: Date.now(),
        name: document.getElementById('menu-name').value,
        category: document.getElementById('menu-category').value,
        price: parseFloat(document.getElementById('menu-price').value),
        image: document.getElementById('menu-image').value,
        desc: document.getElementById('menu-desc').value
    };

    state.menu.push(newItem);
    saveState();
    renderMenuCards();
    menuForm.reset();
    populateBillDropdown(); // update billing select options
});

// Delete Menu Item
window.deleteMenuItem = function(id) {
    if(confirm('Are you sure you want to delete this item?')) {
        state.menu = state.menu.filter(item => item.id !== id);
        saveState();
        renderMenuCards();
        populateBillDropdown();
    }
};

// ==========================================
// 5. Order Management
// ==========================================

const ordersTableBody = document.getElementById('orders-table-body');
const searchOrdersInput = document.getElementById('search-orders');
const addDummyOrderBtn = document.getElementById('add-dummy-order-btn');

function renderOrdersTable(filterText = '') {
    ordersTableBody.innerHTML = '';
    
    let filteredOrders = state.orders;
    if (filterText) {
        const lowerFilter = filterText.toLowerCase();
        filteredOrders = state.orders.filter(o => 
            o.id.toString().includes(lowerFilter) || 
            o.customer.toLowerCase().includes(lowerFilter)
        );
    }

    if (filteredOrders.length === 0) {
        ordersTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No orders found.</td></tr>';
        return;
    }

    filteredOrders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.table}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>
                ${order.status === 'Pending' ? 
                    `<button class="btn btn-success btn-sm" onclick="completeOrder(${order.id})">Mark Completed</button>` : 
                    `<span class="text-muted">Done</span>`
                }
            </td>
        `;
        ordersTableBody.appendChild(tr);
    });
}

window.completeOrder = function(id) {
    const orderIndex = state.orders.findIndex(o => o.id === id);
    if(orderIndex > -1) {
        state.orders[orderIndex].status = 'Completed';
        saveState();
        renderOrdersTable(searchOrdersInput.value);
        updateDashboard();
    }
}

searchOrdersInput.addEventListener('input', (e) => {
    renderOrdersTable(e.target.value);
});

// Add Dummy Order for Testing
addDummyOrderBtn.addEventListener('click', () => {
    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        customer: 'Guest ' + Math.floor(Math.random() * 100),
        table: Math.floor(1 + Math.random() * 15),
        total: parseFloat((10 + Math.random() * 50).toFixed(2)),
        status: 'Pending',
        items: []
    };
    state.orders.push(newOrder);
    saveState();
    renderOrdersTable(searchOrdersInput.value);
});

// ==========================================
// 6. Billing Section
// ==========================================

const billMenuSelect = document.getElementById('bill-menu-select');
const addBillBtn = document.getElementById('add-to-bill-btn');
const billItemsContainer = document.getElementById('bill-items-container');
const emptyBillMsg = document.getElementById('empty-bill-msg');

function populateBillDropdown() {
    billMenuSelect.innerHTML = '<option value="">-- Choose Item --</option>';
    state.menu.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        billMenuSelect.appendChild(opt);
    });
}

addBillBtn.addEventListener('click', () => {
    const itemId = parseInt(billMenuSelect.value);
    if(!itemId) return;

    const menuItem = state.menu.find(m => m.id === itemId);
    if(!menuItem) return;

    // Check if already in bill
    const existing = state.currentBill.find(b => b.item.id === itemId);
    if(existing) {
        existing.qty += 1;
    } else {
        state.currentBill.push({ item: menuItem, qty: 1 });
    }
    
    renderBill();
});

window.updateBillQty = function(id, change) {
    const billItem = state.currentBill.find(b => b.item.id === id);
    if(billItem) {
        billItem.qty += change;
        if(billItem.qty <= 0) {
            state.currentBill = state.currentBill.filter(b => b.item.id !== id);
        }
        renderBill();
    }
};

function renderBill() {
    // Toggle Empty message
    if(state.currentBill.length === 0) {
        emptyBillMsg.style.display = 'block';
        billItemsContainer.innerHTML = '';
        billItemsContainer.appendChild(emptyBillMsg);
    } else {
        emptyBillMsg.style.display = 'none';
        billItemsContainer.innerHTML = '';
        state.currentBill.forEach(b => {
            const div = document.createElement('div');
            div.className = 'bill-item';
            div.innerHTML = `
                <div class="bill-item-details">
                    <div><strong>${b.item.name}</strong></div>
                    <div class="text-muted">$${b.item.price.toFixed(2)} x ${b.qty}</div>
                </div>
                <div class="bill-item-actions">
                    <button class="qty-btn" onclick="updateBillQty(${b.item.id}, -1)">-</button>
                    <span>${b.qty}</span>
                    <button class="qty-btn" onclick="updateBillQty(${b.item.id}, 1)">+</button>
                </div>
            `;
            billItemsContainer.appendChild(div);
        });
    }

    calculateBillTotals();
}

function calculateBillTotals() {
    const subtotal = state.currentBill.reduce((sum, b) => sum + (b.item.price * b.qty), 0);
    const tax = subtotal * 0.05; // 5% tax
    const total = subtotal + tax;

    document.getElementById('bill-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('bill-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('bill-total').textContent = `$${total.toFixed(2)}`;
}

document.getElementById('clear-bill-btn').addEventListener('click', () => {
    if(confirm('Clear the current bill?')) {
        state.currentBill = [];
        renderBill();
    }
});

// ==========================================
// Initialization
// ==========================================
checkAuth();
renderMenuCards();
renderOrdersTable();
populateBillDropdown();
