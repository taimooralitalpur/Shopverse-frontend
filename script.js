// ===== LocalStorage Keys =====
const STORAGE_KEYS = {
  USERS: "shopverse_users",
  ADMINS: "shopverse_admins",
  PRODUCTS: "shopverse_products",
  CART: "shopverse_cart",
  ORDERS: "shopverse_orders",
  CURRENT_USER: "shopverse_current_user",
  CURRENT_ADMIN: "shopverse_current_admin",
};

// ===== Initialize LocalStorage =====
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
}

// Initialize storage on page load
initializeStorage();

// ===== Clear Old Data Function =====
function clearOldData() {
  // Clear old products to force reload of new handicraft items
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
}

// ===== Utility Functions =====
function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function redirectTo(page) {
  window.location.href = page;
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${
          type === "success"
            ? "#10b981"
            : type === "error"
            ? "#ef4444"
            : "#2563eb"
        };
        color: white;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
        max-width: 400px;
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== Landing Page Functions =====
function showLoginModal(userType = "user") {
  const loginModal = document.getElementById("loginModal");
  const loginTitle = document.getElementById("loginTitle");
  loginTitle.textContent = userType === "admin" ? "Admin Login" : "User Login";
  loginModal.setAttribute("data-type", userType);
  loginModal.style.display = "block";
}

function closeLoginModal() {
  document.getElementById("loginModal").style.display = "none";
  document.getElementById("loginForm").reset();
}

function showRegisterModal() {
  closeLoginModal();
  document.getElementById("registerModal").style.display = "block";
}

function closeRegisterModal() {
  document.getElementById("registerModal").style.display = "none";
  document.getElementById("registerForm").reset();
}

// ===== Authentication Functions =====
document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const userType =
    document.getElementById("loginModal").getAttribute("data-type") || "user";

  const users = JSON.parse(
    localStorage.getItem(
      userType === "admin" ? STORAGE_KEYS.ADMINS : STORAGE_KEYS.USERS
    )
  );

  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem(
      userType === "admin"
        ? STORAGE_KEYS.CURRENT_ADMIN
        : STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(user)
    );
    showNotification(`Welcome ${user.name}!`, "success");
    setTimeout(() => {
      redirectTo(userType === "admin" ? "admin.html" : "user.html");
    }, 1000);
  } else {
    showNotification("Invalid email or password", "error");
  }
});

document
  .getElementById("registerForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("registerName").value;
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById(
      "registerConfirmPassword"
    ).value;

    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));

    if (users.find((u) => u.email === email)) {
      showNotification("Email already registered", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    showNotification("Registration successful! Please login.", "success");
    setTimeout(() => {
      closeRegisterModal();
      showLoginModal("user");
    }, 1000);
  });

// ===== Admin Panel Functions =====
function loadAdminPanel() {
  const admin = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN));
  if (!admin) {
    redirectTo("index.html");
    return;
  }

  document.getElementById(
    "adminGreeting"
  ).textContent = `Welcome, ${admin.name}`;
  displayAdminProducts();
  updateAdminStats();
}

function showAddProductForm() {
  document.getElementById("productFormContainer").style.display = "block";
  document.getElementById("formTitle").textContent = "Add New Product";
  document.getElementById("submitBtn").textContent = "Add Product";
  document.getElementById("productForm").reset();
  document.getElementById("productForm").removeAttribute("data-product-id");
}

function cancelForm() {
  document.getElementById("productFormContainer").style.display = "none";
  document.getElementById("productForm").reset();
}

document
  .getElementById("productForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();

    const admin = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN));
    const productId = this.getAttribute("data-product-id");

    const productData = {
      name: document.getElementById("productName").value,
      price: parseFloat(document.getElementById("productPrice").value),
      category: document.getElementById("productCategory").value,
      stock: parseInt(document.getElementById("productStock").value),
      description: document.getElementById("productDescription").value,
      image: document.getElementById("productImage").value,
      adminId: admin.id,
      adminName: admin.name,
    };

    let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));

    if (productId) {
      const index = products.findIndex((p) => p.id == productId);
      if (index > -1) {
        products[index] = { ...products[index], ...productData };
        showNotification("Product updated successfully", "success");
      }
    } else {
      productData.id = Date.now();
      productData.createdAt = new Date().toISOString();
      products.push(productData);
      showNotification("Product added successfully", "success");
    }

    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    cancelForm();
    displayAdminProducts();
    updateAdminStats();
  });

function displayAdminProducts() {
  const admin = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN));
  let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));

  products = products.filter((p) => p.adminId === admin.id);

  const tbody = document.getElementById("productsTableBody");
  const noProductsMsg = document.getElementById("noProductsMsg");

  if (products.length === 0) {
    tbody.innerHTML = "";
    noProductsMsg.style.display = "block";
    return;
  }

  noProductsMsg.style.display = "none";
  tbody.innerHTML = products
    .map(
      (product) => `
        <tr>
            <td><img src="${product.image}" alt="${
        product.name
      }" class="product-image-thumb" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>Rs: ${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-edit" onclick="editProduct(${
                      product.id
                    })">Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${
                      product.id
                    })">Delete</button>
                </div>
            </td>
        </tr>
    `
    )
    .join("");
}

function editProduct(productId) {
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
  const product = products.find((p) => p.id == productId);

  if (product) {
    document.getElementById("productName").value = product.name;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productCategory").value = product.category;
    document.getElementById("productStock").value = product.stock;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("productImage").value = product.image;

    document.getElementById("productFormContainer").style.display = "block";
    document.getElementById("formTitle").textContent = "Edit Product";
    document.getElementById("submitBtn").textContent = "Update Product";
    document
      .getElementById("productForm")
      .setAttribute("data-product-id", productId);
  }
}

let productToDelete = null;
function deleteProduct(productId) {
  productToDelete = productId;
  document.getElementById("deleteConfirmModal").style.display = "block";
}

function closeDeleteModal() {
  document.getElementById("deleteConfirmModal").style.display = "none";
}

function confirmDelete() {
  if (productToDelete) {
    let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
    products = products.filter((p) => p.id != productToDelete);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    showNotification("Product deleted successfully", "success");
    displayAdminProducts();
    updateAdminStats();
    closeDeleteModal();
  }
}

function updateAdminStats() {
  const admin = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN));
  let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));

  products = products.filter((p) => p.adminId === admin.id);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

  document.getElementById("totalProducts").textContent = totalProducts;
  document.getElementById("totalStock").textContent = totalStock;
  document.getElementById("totalValue").textContent = totalValue.toFixed(2);
}

function adminLogout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
  redirectTo("index.html");
}

// ===== User Panel Functions =====
function loadUserPanel() {
  const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
  if (!user) {
    redirectTo("index.html");
    return;
  }

  document.getElementById("userGreeting").textContent = `Welcome, ${user.name}`;
  displayProducts();
  updateCartUI();

  // Search and filter functionality
  document
    .getElementById("searchInput")
    ?.addEventListener("input", filterProducts);
  document
    .getElementById("categoryFilter")
    ?.addEventListener("change", filterProducts);
}

function displayProducts(filter = {}) {
  let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));

  if (filter.category) {
    products = products.filter((p) => p.category === filter.category);
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    );
  }

  const grid = document.getElementById("productsGrid");
  const noMsg = document.getElementById("noProductsMsg");

  if (products.length === 0) {
    grid.innerHTML = "";
    noMsg.style.display = "block";
    return;
  }

  noMsg.style.display = "none";
  grid.innerHTML = products
    .map(
      (product) => `
        <div class="product-card">
            <img src="${product.image}" alt="${
        product.name
      }" class="product-image" onerror="this.src='https://via.placeholder.com/250x200'">
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">Rs: ${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${
                      product.id
                    })">Add to Cart</button>
                    <button class="btn-details" onclick="showProductDetails(${
                      product.id
                    })">Details</button>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function filterProducts() {
  const search = document.getElementById("searchInput")?.value || "";
  const category = document.getElementById("categoryFilter")?.value || "";

  displayProducts({ search, category });
}

function showProductDetails(productId) {
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
  const product = products.find((p) => p.id == productId);

  if (product) {
    document.getElementById("detailsImage").src = product.image;
    document.getElementById("detailsImage").onerror = function () {
      this.src = "https://via.placeholder.com/400x300";
    };
    document.getElementById("detailsName").textContent = product.name;
    document.getElementById("detailsDescription").textContent =
      product.description;
    document.getElementById(
      "detailsPrice"
    ).textContent = `Rs: ${product.price.toFixed(2)}`;
    document.getElementById("detailsStock").textContent =
      product.stock > 0 ? `${product.stock} in stock` : "Out of stock";
    document.getElementById("detailsCategory").textContent = product.category;
    document.getElementById("detailsQuantity").value = 1;
    document.getElementById("detailsQuantity").max = product.stock;

    if (product.stock === 0) {
      document.getElementById("addToCartFromDetailsBtn").disabled = true;
      document.getElementById("addToCartFromDetailsBtn").textContent =
        "Out of Stock";
    } else {
      document.getElementById("addToCartFromDetailsBtn").disabled = false;
      document.getElementById("addToCartFromDetailsBtn").textContent =
        "Add to Cart";
    }

    document
      .getElementById("productDetailsModal")
      .setAttribute("data-product-id", productId);
    document.getElementById("productDetailsModal").style.display = "block";
  }
}

function closeProductDetailsModal() {
  document.getElementById("productDetailsModal").style.display = "none";
}

function increaseQty() {
  const input = document.getElementById("detailsQuantity");
  if (parseInt(input.value) < parseInt(input.max)) {
    input.value = parseInt(input.value) + 1;
  }
}

function decreaseQty() {
  const input = document.getElementById("detailsQuantity");
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

function addToCartFromDetails() {
  const productId = document
    .getElementById("productDetailsModal")
    .getAttribute("data-product-id");
  const quantity = parseInt(document.getElementById("detailsQuantity").value);

  addToCart(productId, quantity);
  closeProductDetailsModal();
}

function addToCart(productId, quantity = 1) {
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
  const product = products.find((p) => p.id == productId);

  if (!product || product.stock < quantity) {
    showNotification("Insufficient stock", "error");
    return;
  }

  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  const cartItem = cart.find((item) => item.id == productId);

  if (cartItem) {
    if (cartItem.quantity + quantity > product.stock) {
      showNotification("Insufficient stock for this quantity", "error");
      return;
    }
    cartItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
    });
  }

  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  updateCartUI();
  showNotification(`${product.name} added to cart!`, "success");
}

function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  const cartCount = document.getElementById("cartCount");
  const emptyMsg = document.getElementById("emptyCartMsg");
  const cartItems = document.getElementById("cartItems");

  if (cartCount) {
    cartCount.textContent = cart.length;
  }

  if (cartItems) {
    if (cart.length === 0) {
      cartItems.innerHTML = "";
      emptyMsg.style.display = "block";
      document.getElementById("checkoutBtn").disabled = true;
    } else {
      emptyMsg.style.display = "none";
      document.getElementById("checkoutBtn").disabled = false;
      cartItems.innerHTML = cart
        .map(
          (item) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${
            item.name
          }" class="cart-item-image" onerror="this.src='https://via.placeholder.com/80'">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">Rs: ${item.price.toFixed(
                          2
                        )}</div>
                        <div class="cart-item-qty">
                            <button onclick="updateCartQty(${
                              item.id
                            }, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQty(${
                              item.id
                            }, 1)">+</button>
                        </div>
                        <button class="cart-item-remove" onclick="removeFromCart(${
                          item.id
                        })">Remove</button>
                    </div>
                </div>
            `
        )
        .join("");
    }
    updateCartSummary();
  }
}

function updateCartQty(productId, change) {
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  const item = cart.find((c) => c.id == productId);
  const product = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)).find(
    (p) => p.id == productId
  );

  if (item) {
    const newQty = item.quantity + change;
    if (newQty > 0 && newQty <= product.stock) {
      item.quantity = newQty;
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
      updateCartUI();
    } else if (newQty > product.stock) {
      showNotification("Cannot exceed available stock", "error");
    }
  }
}

function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  cart = cart.filter((item) => item.id != productId);
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  updateCartUI();
  showNotification("Item removed from cart", "success");
}

function updateCartSummary() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("tax").textContent = tax.toFixed(2);
  document.getElementById("cartTotal").textContent = total.toFixed(2);

  document.getElementById("checkoutTotal").textContent = total.toFixed(2);
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  sidebar.classList.toggle("active");
}

document.getElementById("cartToggle")?.addEventListener("click", function (e) {
  e.preventDefault();
  toggleCart();
});

function checkout() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  if (cart.length === 0) {
    showNotification("Your cart is empty", "error");
    return;
  }

  // Display checkout items
  displayCheckoutItems();

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.18;
  const delivery = subtotal > 500 ? 0 : 50;
  const total = subtotal + tax + delivery;

  document.getElementById("checkoutSubtotal").textContent = subtotal.toFixed(2);
  document.getElementById("checkoutTax").textContent = tax.toFixed(2);
  document.getElementById("checkoutDelivery").textContent = delivery.toFixed(2);
  document.getElementById("checkoutTotal").textContent = total.toFixed(2);

  document.getElementById("checkoutModal").style.display = "block";
}

function displayCheckoutItems() {
  const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
  const itemsList = document.getElementById("checkoutItemsList");

  itemsList.innerHTML = cart
    .map(
      (item) => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${
        item.name
      }" class="checkout-item-image" onerror="this.src='https://via.placeholder.com/70'">
      <div class="checkout-item-details">
        <div class="checkout-item-name">${item.name}</div>
        <div class="checkout-item-meta">
          <span>Qty: ${item.quantity}</span>
          <span>Rs: ${item.price.toFixed(2)} each</span>
        </div>
        <div class="checkout-item-price">Subtotal: Rs: ${(
          item.price * item.quantity
        ).toFixed(2)}</div>
      </div>
    </div>
  `
    )
    .join("");
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").style.display = "none";
  document.getElementById("checkoutForm").reset();
}

document
  .getElementById("checkoutForm")
  ?.addEventListener("submit", function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER));
    const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART));
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.18;
    const delivery = subtotal > 500 ? 0 : 50;
    const total = subtotal + tax + delivery;

    const order = {
      id: Date.now(),
      userId: user.id,
      userName: document.getElementById("checkoutName").value,
      email: document.getElementById("checkoutEmail").value,
      phone: document.getElementById("checkoutPhone").value,
      address: document.getElementById("checkoutAddress").value,
      city: document.getElementById("checkoutCity").value,
      state: document.getElementById("checkoutState").value,
      zip: document.getElementById("checkoutZip").value,
      items: cart,
      subtotal: subtotal,
      tax: tax,
      delivery: delivery,
      total: total,
      orderDate: new Date().toISOString(),
      status: "Confirmed",
      cardLast4: document.getElementById("checkoutCard").value.slice(-4),
    };

    let orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS));
    orders.push(order);
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));

    closeCheckoutModal();
    showSuccessModal(order);
  });

function showSuccessModal(order) {
  const message = `✅ Order #${order.id} confirmed!\n\nDelivering to: ${
    order.address
  }, ${order.city} - ${order.zip}\n\nTotal: Rs: ${order.total.toFixed(
    2
  )}\n\nYou will receive a confirmation email at ${order.email}`;
  document.getElementById("successMessage").textContent = message;
  document.getElementById("successModal").style.display = "block";
}

function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none";
  updateCartUI();
  toggleCart();
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  redirectTo("index.html");
}

// ===== Modal Close on Outside Click =====
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

// ===== Initialize Page =====
document.addEventListener("DOMContentLoaded", function () {
  // Refresh demo data to ensure latest products are loaded
  addDemoData();

  const currentPage = getCurrentPage();

  if (currentPage === "admin.html") {
    loadAdminPanel();
  } else if (currentPage === "user.html") {
    loadUserPanel();
  }

  // Main page navigation
  document.getElementById("loginBtn")?.addEventListener("click", function (e) {
    e.preventDefault();
    showLoginModal("user");
  });

  document
    .getElementById("registerBtn")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      showRegisterModal();
    });

  document.getElementById("logoutBtn")?.addEventListener("click", function (e) {
    e.preventDefault();
    logout();
  });
});

// ===== Add Demo Data (Optional) =====
function addDemoData() {
  // Clear old data first to ensure fresh handicraft products
  clearOldData();

  // Demo admin
  const admins = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMINS));
  if (admins.length === 0) {
    admins.push({
      id: 1001,
      name: "Artisan Admin",
      email: "admin@shopverse.com",
      password: "admin123",
    });
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  }

  // Demo user
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS));
  if (users.length === 0) {
    users.push({
      id: 2001,
      name: "John Doe",
      email: "user@shopverse.com",
      password: "user123",
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Clear old products and add new Local Handicraft Art Items
  const demoProducts = [
    {
      id: 3001,
      name: "Decorated Clay Pot",
      price: 450,
      category: "Pottery",
      stock: 50,
      description:
        "Beautifully decorated clay pot handcrafted by skilled artisans with traditional designs and patterns. Each piece is unique, featuring intricate hand-painted details. Perfect for home decor or traditional use.",
      image: "images/1.webp",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3002,
      name: "Ajrak Pattern Rug",
      price: 1200,
      category: "Textiles",
      stock: 30,
      description:
        "Traditional hand-printed Ajrak pattern rug featuring authentic block-printed designs. Created using natural dyes and traditional printing techniques passed down through generations. A stunning piece of textile heritage.",
      image: "images/2.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3003,
      name: "Bridal Bangles",
      price: 850,
      category: "Jewelry",
      stock: 100,
      description:
        "Exquisite handcrafted bridal bangles featuring intricate traditional designs and embellishments. Handmade with precision by master artisans using traditional techniques. A cherished accessory for special occasions.",
      image: "images/3.webp",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3004,
      name: "Blue Pottery",
      price: 750,
      category: "Pottery",
      stock: 75,
      description:
        "Traditional blue pottery handcrafted with distinctive cobalt blue glaze and intricate patterns. Each piece is hand-painted and fired using time-honored techniques. A classic representation of regional pottery art.",
      image: "images/4.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3005,
      name: "Truck Art Painted Pot",
      price: 599,
      category: "Pottery",
      stock: 40,
      description:
        "Vibrant truck art painted pot featuring bold, colorful traditional designs inspired by folk art. Hand-painted with natural colors and traditional motifs. A unique piece celebrating colorful artisanal craftsmanship.",
      image: "images/5.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3006,
      name: "Wooden Elephant",
      price: 650,
      category: "Crafts",
      stock: 60,
      description:
        "Hand-carved wooden elephant sculpture showcasing traditional woodcraft skills. Intricately carved with attention to detail and natural wood finish. A beautiful decorative piece representing cultural craftsmanship.",
      image: "images/7.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3007,
      name: "Wooden Flower Stand",
      price: 950,
      category: "Crafts",
      stock: 45,
      description:
        "Elegantly crafted wooden flower stand handmade by skilled woodworkers. Features traditional carved designs and sturdy construction. Perfect for displaying flowers or plants with artistic flair.",
      image: "images/8.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
    {
      id: 3008,
      name: "Wooden Chest and Side Table",
      price: 2500,
      category: "Furniture",
      stock: 55,
      description:
        "Beautifully handcrafted wooden chest and side table combination piece. Features traditional carved patterns and joinery. A functional and decorative furniture piece that adds rustic elegance to any space.",
      image: "images/99.jpg",
      adminId: 1001,
      adminName: "Local Artisan",
    },
  ];

  // Always overwrite products with new handicraft items
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(demoProducts));
}
