// Glitchy Checkout App - PlayerZero Demo
// This app contains three intentional bugs to demonstrate PlayerZero's debugging capabilities

// Product catalog
const PRODUCTS = [
    {
        id: 'widget-pro',
        name: 'Premium Widget Pro',
        price: 49.99,
        description: 'The ultimate widget for all your widget needs. Advanced widget technology included.'
    },
    {
        id: 'widget-mini',
        name: 'Widget Mini',
        price: 19.99,
        description: 'Pocket-sized widget power. Perfect for widgeting on the go.'
    },
    {
        id: 'gadget-max',
        name: 'Gadget Max 4000',
        price: 129.5,
        description: 'Industrial grade gadget with quad-core widget acceleration.'
    },
    {
        id: 'doohickey-kit',
        name: 'Doohickey Starter Kit',
        price: 34.25,
        description: 'Everything a beginner needs to start their doohickey journey.'
    }
];

let cartCount = 0;
let cartLines = {}; // productId -> quantity
let selectedProductId = PRODUCTS[0].id;
let appliedDiscount = null;
let cart = null; // Bug 2: This will be null, causing TypeError when we try to access cart.items

// DOM Elements
const catalogContainer = document.getElementById('catalog');
const addBtn = document.getElementById('add-btn');
const checkoutBtn = document.getElementById('checkout-btn');
const discountInput = document.getElementById('discount-input');
const discountBtn = document.getElementById('discount-btn');
const cartCountDisplay = document.getElementById('cart-count');
const cartLinesDisplay = document.getElementById('cart-lines');
const cartTotalsDisplay = document.getElementById('cart-totals');
const statusMessage = document.getElementById('status-message');
const debugLog = document.getElementById('debug-log');

// Initialize cart object (comment this out to trigger Bug 2)
// cart = { items: [], total: 0 };

// Debug logging function
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);

    // Append to debug console in UI
    const logElement = document.createElement('div');
    logElement.style.marginBottom = '4px';
    logElement.style.color = type === 'error' ? '#c53030' : type === 'success' ? '#276749' : '#2c5282';
    logElement.textContent = logEntry;
    debugLog.appendChild(logElement);

    // Keep only last 10 logs
    while (debugLog.children.length > 10) {
        debugLog.removeChild(debugLog.firstChild);
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
}

function formatPrice(value) {
    return `$${value.toFixed(2)}`;
}

function getProduct(productId) {
    return PRODUCTS.find(product => product.id === productId);
}

function getSelectedProduct() {
    return getProduct(selectedProductId);
}

// Render the product catalog
function renderCatalog() {
    catalogContainer.innerHTML = '';

    PRODUCTS.forEach(product => {
        const card = document.createElement('div');
        card.className = product.id === selectedProductId ? 'product selected' : 'product';
        card.dataset.productId = product.id;

        const name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = product.name;

        const price = document.createElement('div');
        price.className = 'product-price';
        price.textContent = formatPrice(product.price);

        const description = document.createElement('div');
        description.className = 'product-description';
        description.textContent = product.description;

        card.appendChild(name);
        card.appendChild(price);
        card.appendChild(description);

        card.addEventListener('click', () => selectProduct(product.id));
        catalogContainer.appendChild(card);
    });
}

function selectProduct(productId) {
    const product = getProduct(productId);
    if (!product) {
        return;
    }

    selectedProductId = productId;
    renderCatalog();
    log(`Selected product: ${product.name} (${formatPrice(product.price)})`);
    showStatus(`Selected ${product.name} — ${formatPrice(product.price)}`, 'info');
}

function getSubtotal() {
    return Object.keys(cartLines).reduce((total, productId) => {
        const product = getProduct(productId);
        return product ? total + product.price * cartLines[productId] : total;
    }, 0);
}

// Refresh cart contents, totals and any applied discount
function updateCartDisplay() {
    cartCount = Object.keys(cartLines).reduce((total, productId) => total + cartLines[productId], 0);
    cartCountDisplay.textContent = cartCount;

    cartLinesDisplay.innerHTML = '';
    Object.keys(cartLines).forEach(productId => {
        const product = getProduct(productId);
        if (!product) {
            return;
        }
        const line = document.createElement('div');
        line.textContent = `${cartLines[productId]}x ${product.name} — ${formatPrice(product.price * cartLines[productId])}`;
        cartLinesDisplay.appendChild(line);
    });

    const subtotal = getSubtotal();
    const discountAmount = appliedDiscount ? subtotal * appliedDiscount.percentOff / 100 : 0;

    cartTotalsDisplay.innerHTML = '';
    cartTotalsDisplay.appendChild(buildTotalRow('Subtotal', formatPrice(subtotal)));
    if (appliedDiscount) {
        cartTotalsDisplay.appendChild(
            buildTotalRow(`Discount (${appliedDiscount.code})`, `-${formatPrice(discountAmount)}`)
        );
    }
    cartTotalsDisplay.appendChild(buildTotalRow('Total', formatPrice(subtotal - discountAmount), true));
}

function buildTotalRow(label, value, isGrandTotal = false) {
    const row = document.createElement('div');
    row.className = isGrandTotal ? 'cart-total-row grand' : 'cart-total-row';

    const labelElement = document.createElement('span');
    labelElement.textContent = label;

    const valueElement = document.createElement('span');
    valueElement.textContent = value;

    row.appendChild(labelElement);
    row.appendChild(valueElement);
    return row;
}

// Bug 1: The Network Failure (Failing API)
// This fetch request will fail with a 404 error
async function addToCart() {
    const product = getSelectedProduct();

    addBtn.disabled = true;
    showStatus(`⏳ Adding ${product.name} to cart...`, 'info');
    log(`Attempting to add ${product.name} to cart...`);

    try {
        // Bug 1: Invalid API endpoint (404 error)
        const response = await fetch('https://jsonplaceholder.typicode.com/invalid-endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                productId: product.id,
                product: product.name,
                price: product.price,
                quantity: 1
            })
        });

        log(`API Response Status: ${response.status}`, response.ok ? 'success' : 'error');

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        log(`${product.name} added successfully to cart`, 'success');

        cartLines[product.id] = (cartLines[product.id] || 0) + 1;
        updateCartDisplay();
        showStatus(`✅ Added ${product.name}! Total items: ${cartCount}`, 'success');

    } catch (error) {
        // Silent failure - user sees nothing useful
        log(`Error adding to cart: ${error.message}`, 'error');
        showStatus('❌ Failed to add item (Network error)', 'error');
        console.error('Fetch Error:', error);

        // PlayerZero will capture this error
        if (window.PlayerZero && window.PlayerZero.captureError) {
            window.PlayerZero.captureError(error);
        }
    } finally {
        addBtn.disabled = false;
    }
}

// Bug 3: The Unreachable Service (DNS / connection failure + timeout)
// Unlike Bug 1 (server responds with 404), this host never resolves, so fetch
// rejects with a TypeError before any response exists - or aborts on timeout.
const DISCOUNT_API_URL = 'https://discount-api.glitchy-checkout.invalid/v1/validate';
const DISCOUNT_TIMEOUT_MS = 5000;

async function applyDiscount() {
    const code = discountInput.value.trim().toUpperCase();

    if (!code) {
        showStatus('❌ Enter a discount code first', 'error');
        log('Discount validation skipped: no code entered', 'error');
        return;
    }

    discountBtn.disabled = true;
    showStatus(`⏳ Validating discount code ${code}...`, 'info');
    log(`Validating discount code: ${code}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DISCOUNT_TIMEOUT_MS);

    try {
        // Bug 3: Discount service host does not exist (no response at all)
        const response = await fetch(DISCOUNT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code: code,
                subtotal: getSubtotal(),
                itemCount: cartCount
            }),
            signal: controller.signal
        });

        log(`Discount API Response Status: ${response.status}`, response.ok ? 'success' : 'error');

        if (!response.ok) {
            throw new Error(`Discount API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        appliedDiscount = { code: code, percentOff: data.percentOff };
        updateCartDisplay();
        log(`Discount ${code} applied (${data.percentOff}% off)`, 'success');
        showStatus(`✅ Discount ${code} applied!`, 'success');

    } catch (error) {
        const timedOut = error.name === 'AbortError';
        const reason = timedOut
            ? `Discount service timed out after ${DISCOUNT_TIMEOUT_MS}ms`
            : `Discount service unreachable: ${error.message}`;

        log(reason, 'error');
        showStatus('❌ Could not apply discount code (Service unavailable)', 'error');
        console.error('Discount Error:', error);

        // PlayerZero will capture this error
        if (window.PlayerZero && window.PlayerZero.captureError) {
            window.PlayerZero.captureError(error, {
                context: 'applyDiscount',
                code: code,
                endpoint: DISCOUNT_API_URL,
                timedOut: timedOut
            });
        }
    } finally {
        clearTimeout(timeoutId);
        discountBtn.disabled = false;
    }
}

// Bug 2: The JS Exception (Frontend Crash)
// This function tries to access a property of null/undefined
function checkout() {
    checkoutBtn.disabled = true;
    showStatus('⏳ Processing checkout...', 'info');
    log('Checkout initiated');

    try {
        // Bug 2: cart is null, accessing cart.items will throw TypeError
        if (cartCount === 0) {
            showStatus('❌ Your cart is empty!', 'error');
            log('Checkout failed: Empty cart', 'error');
            return;
        }

        // THIS LINE WILL CRASH - cart is null
        // TypeError: Cannot read property 'items' of null
        const items = cart.items; // BUG 2 TRIGGER

        log(`Processing ${items.length} items...`);

        // Simulate checkout delay
        setTimeout(() => {
            cartLines = {};
            appliedDiscount = null;
            updateCartDisplay();
            showStatus('✅ Checkout successful! Thank you for your purchase.', 'success');
            log('Checkout completed successfully', 'success');
            checkoutBtn.disabled = false;
        }, 1500);

    } catch (error) {
        log(`Checkout error: ${error.message}`, 'error');
        showStatus(`❌ Checkout failed: ${error.message}`, 'error');
        console.error('Checkout Error:', error);

        // PlayerZero will capture this error with stack trace
        if (window.PlayerZero && window.PlayerZero.captureError) {
            window.PlayerZero.captureError(error, {
                context: 'checkout',
                cartCount: cartCount,
                discountCode: appliedDiscount ? appliedDiscount.code : null,
                timestamp: new Date().toISOString()
            });
        }

        checkoutBtn.disabled = false;
    }
}

// Event listeners
addBtn.addEventListener('click', () => {
    log('Add to Cart button clicked');
    addToCart();
});

checkoutBtn.addEventListener('click', () => {
    log('Checkout button clicked');
    checkout();
});

discountBtn.addEventListener('click', () => {
    log('Apply Discount button clicked');
    applyDiscount();
});

discountInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        log('Discount code submitted via Enter key');
        applyDiscount();
    }
});

// Initialize app
function initializeApp() {
    log('Glitchy Checkout app initialized', 'success');
    log('PlayerZero project: glitchy-checkout-demo', 'info');
    log(`Catalog loaded with ${PRODUCTS.length} products`, 'info');
    log('Ready to demonstrate bugs...', 'info');
    renderCatalog();
    updateCartDisplay();
    showStatus('👋 Welcome! Pick a product, add it to your cart, and try a discount code.', 'info');
}

// Start the app. This script is loaded at the end of <body>, so the DOM is
// already parsed; waiting for DOMContentLoaded as well would initialize twice
// and duplicate every startup log line.
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export for debugging
window.glitchyCheckout = {
    addToCart,
    checkout,
    applyDiscount,
    selectProduct,
    getProducts: () => PRODUCTS,
    getCartCount: () => cartCount,
    getCart: () => cart,
    getDiscount: () => appliedDiscount,
    log
};
