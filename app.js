// REAL ABBA BOOSTING
// Frontend service, pricing and navigation logic

const SERVICES = {
  tiktok: [
    { name: "TikTok Followers", price: 6000 },
    { name: "TikTok Likes", price: 1000 },
    { name: "TikTok Views", price: 400 }
  ],

  instagram: [
    { name: "Instagram Followers", price: 5500 },
    { name: "Instagram Likes", price: 800 },
    { name: "Instagram Views", price: 300 }
  ],

  youtube: [
    { name: "YouTube Subscribers", price: 65000 },
    { name: "YouTube Views", price: 2500 }
  ],

  facebook: [
    { name: "Facebook Followers", price: 5300 }
  ],

  telegram: [
    { name: "Telegram Members", price: 5000 }
  ]
};

let selectedService = null;
let orders = [];

function formatNaira(amount) {
  return "₦" + Number(amount).toLocaleString("en-NG");
}

function showPage(pageName) {
  document.querySelectorAll(".app-page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageName);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.remove("active");

    if (item.dataset.page === pageName) {
      item.classList.add("active");
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function selectService(serviceName, price) {
  selectedService = {
    name: serviceName,
    price: Number(price)
  };

  const serviceInput = document.getElementById("orderService");

  if (serviceInput) {
    serviceInput.value = serviceName;
  }

  updateOrderTotal();
  showPage("order");
}

function updateOrderTotal() {
  const quantityInput = document.getElementById("orderQuantity");
  const totalElement = document.getElementById("orderTotal");

  if (!quantityInput || !totalElement || !selectedService) {
    return;
  }

  let quantity = Number(quantityInput.value) || 0;

  if (quantity < 0) {
    quantity = 0;
  }

  const total = (quantity / 1000) * selectedService.price;

  totalElement.textContent = formatNaira(total);
}

function loadServices() {
  const container = document.getElementById("servicesContainer");

  if (!container) return;

  container.innerHTML = "";

  Object.keys(SERVICES).forEach(platform => {
    SERVICES[platform].forEach(service => {
      const card = document.createElement("div");

      card.className = "service-card";

      card.innerHTML = `
        <div class="service-icon">📈</div>
        <h3>${service.name}</h3>
        <p>High-quality social media boosting service.</p>
        <div class="price">
          ${formatNaira(service.price)} / 1,000
        </div>
        <button
          class="primary-btn"
          style="margin-top:12px;"
          onclick="selectService('${service.name}', ${service.price})"
        >
          Order Now
        </button>
      `;

      container.appendChild(card);
    });
  });
}

function submitOrder(event) {
  event.preventDefault();

  if (!selectedService) {
    showToast("Please select a service first.");
    return;
  }

  const quantityInput = document.getElementById("orderQuantity");
  const linkInput = document.getElementById("orderLink");

  const quantity = Number(quantityInput?.value || 0);
  const link = linkInput?.value.trim() || "";

  if (quantity < 100) {
    showToast("Minimum order quantity is 100.");
    return;
  }

  if (!link) {
    showToast("Please enter your social media link.");
    return;
  }

  const total = (quantity / 1000) * selectedService.price;

  const order = {
    id: "RAB" + Date.now(),
    service: selectedService.name,
    quantity: quantity,
    link: link,
    amount: total,
    status: "pending",
    createdAt: new Date().toLocaleString("en-NG")
  };

  orders.unshift(order);

  localStorage.setItem(
    "realAbbaOrders",
    JSON.stringify(orders)
  );

  showToast("Order submitted successfully!");

  event.target.reset();

  selectedService = null;

  updateOrderList();

  setTimeout(() => {
    showPage("orders");
  }, 700);
}

function loadOrders() {
  try {
    orders = JSON.parse(
      localStorage.getItem("realAbbaOrders") || "[]"
    );
  } catch (error) {
    orders = [];
  }

  updateOrderList();
}

function updateOrderList() {
  const container = document.getElementById("ordersContainer");

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = "";

  orders.forEach(order => {
    const item = document.createElement("div");

    item.className = "order-item";

    item.innerHTML = `
      <div class="order-item-top">
        <h3>${order.service}</h3>
        <span class="status ${order.status}">
          ${order.status}
        </span>
      </div>

      <div class="order-meta">
        <div>Order ID: ${order.id}</div>
        <div>Quantity: ${Number(order.quantity).toLocaleString()}</div>
        <div>Amount: ${formatNaira(order.amount)}</div>
        <div>Date: ${order.createdAt}</div>
      </div>
    `;

    container.appendChild(item);
  });
}

function setupNavigation() {
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;

      if (page) {
        showPage(page);
      }
    });
  });
}

function setupOrderForm() {
  const form = document.getElementById("orderForm");

  if (form) {
    form.addEventListener("submit", submitOrder);
  }

  const quantity = document.getElementById("orderQuantity");

  if (quantity) {
    quantity.addEventListener("input", updateOrderTotal);
  }
}

function setupAuthDemo() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", event => {
      event.preventDefault();

      const authScreen = document.getElementById("authScreen");
      const appScreen = document.getElementById("appScreen");

      if (authScreen) authScreen.style.display = "none";
      if (appScreen) appScreen.style.display = "block";

      showPage("home");
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", event => {
      event.preventDefault();

      const authScreen = document.getElementById("authScreen");
      const appScreen = document.getElementById("appScreen");

      if (authScreen) authScreen.style.display = "none";
      if (appScreen) appScreen.style.display = "block";

      showPage("home");
    });
  }
}

function setupTabs() {
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t => {
        t.classList.remove("active");
      });

      document.querySelectorAll(".auth-form").forEach(form => {
        form.classList.remove("active");
      });

      tab.classList.add("active");

      const target = document.getElementById(
        tab.dataset.target
      );

      if (target) {
        target.classList.add("active");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadServices();
  loadOrders();
  setupNavigation();
  setupOrderForm();
  setupAuthDemo();
  setupTabs();

  showPage("home");
});
