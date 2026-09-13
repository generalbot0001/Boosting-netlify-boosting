// ==========================================
// REAL ABBA BOOSTING
// Supabase Authentication + Website Logic
// ==========================================

const supabase = window.supabaseClient;

// ==========================================
// SERVICE PRICES
// ==========================================

const SERVICES = {
  TikTok: {
    "Followers": 6000,
    "Likes": 1000,
    "Views": 400
  },

  Instagram: {
    "Followers": 5500,
    "Likes": 800,
    "Views": 300
  },

  YouTube: {
    "Subscribers": 65000,
    "Views": 2500
  },

  Facebook: {
    "Followers": 5300
  },

  Telegram: {
    "Members": 5000
  }
};

let selectedPlatform = "";
let currentUser = null;

// ==========================================
// HELPERS
// ==========================================

function money(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showMessage(message, type = "info") {
  const box = document.getElementById("msg");

  if (!box) return;

  box.textContent = message;
  box.className = "msg " + type;
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

// ==========================================
// AUTH TABS
// ==========================================

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(t => {
      t.classList.remove("active");
    });

    tab.classList.add("active");

    const target = tab.dataset.tab;

    const loginBox = document.getElementById("loginBox");
    const signupBox = document.getElementById("signupBox");

    if (target === "login") {
      loginBox?.classList.remove("hide");
      signupBox?.classList.add("hide");
    }

    if (target === "signup") {
      loginBox?.classList.add("hide");
      signupBox?.classList.remove("hide");
    }

    showMessage("");
  });
});

// ==========================================
// SIGN UP
// ==========================================

document.getElementById("signup")?.addEventListener("click", async () => {

  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("pass")?.value;

  if (!name || !email || !password) {
    showMessage("Please fill in all fields.", "error");
    return;
  }

  if (password.length < 6) {
    showMessage(
      "Password must be at least 6 characters.",
      "error"
    );
    return;
  }

  showMessage("Creating your account...", "info");

  try {

    const redirectUrl =
      window.location.origin + window.location.pathname;

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,

      options: {
        emailRedirectTo: redirectUrl,

        data: {
          full_name: name,
          display_name: name
        }
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {

      showMessage(
        "Account created! Check your email and click the verification link before logging in.",
        "success"
      );

      document.getElementById("name").value = "";
      document.getElementById("email").value = "";
      document.getElementById("pass").value = "";
    }

  } catch (error) {

    console.error(error);

    showMessage(
      error.message || "Unable to create account.",
      "error"
    );
  }
});

// ==========================================
// LOGIN
// ==========================================

document.getElementById("login")?.addEventListener("click", async () => {

  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPass")?.value;

  if (!email || !password) {
    showMessage("Enter your email and password.", "error");
    return;
  }

  showMessage("Logging in...", "info");

  try {

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      throw error;
    }

    currentUser = data.user;

    // Supabase email verification check
    if (!currentUser.email_confirmed_at) {

      await supabase.auth.signOut();

      showMessage(
        "Please verify your email address before logging in.",
        "error"
      );

      return;
    }

    openApp(currentUser);

  } catch (error) {

    console.error(error);

    showMessage(
      error.message || "Login failed.",
      "error"
    );
  }
});

// ==========================================
// FORGOT PASSWORD
// ==========================================

document.getElementById("forgot")?.addEventListener("click", async () => {

  const email = document.getElementById("loginEmail")?.value.trim();

  if (!email) {

    showMessage(
      "Enter your email address first.",
      "error"
    );

    return;
  }

  showMessage(
    "Sending password reset email...",
    "info"
  );

  try {

    const redirectUrl =
      window.location.origin + window.location.pathname;

    const { error } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

    if (error) {
      throw error;
    }

    showMessage(
      "Password reset email sent. Check your inbox.",
      "success"
    );

  } catch (error) {

    console.error(error);

    showMessage(
      error.message || "Unable to send reset email.",
      "error"
    );
  }
});

// ==========================================
// OPEN APP
// ==========================================

function openApp(user) {

  currentUser = user;

  const auth = document.getElementById("auth");
  const app = document.getElementById("app");

  if (auth) {
    auth.classList.add("hide");
  }

  if (app) {
    app.classList.remove("hide");
  }

  const name =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    "Creator";

  const welcome = document.getElementById("welcome");
  const acctName = document.getElementById("acctName");
  const acctEmail = document.getElementById("acctEmail");
  const acctEmail2 = document.getElementById("acctEmail2");

  if (welcome) {
    welcome.textContent = name + " 👋";
  }

  if (acctName) {
    acctName.textContent = name;
  }

  if (acctEmail) {
    acctEmail.textContent = user.email || "—";
  }

  if (acctEmail2) {
    acctEmail2.textContent = user.email || "—";
  }

  showPage("home");
}

// ==========================================
// LOGOUT
// ==========================================

async function logout() {

  await supabase.auth.signOut();

  currentUser = null;

  const app = document.getElementById("app");
  const auth = document.getElementById("auth");

  if (app) {
    app.classList.add("hide");
  }

  if (auth) {
    auth.classList.remove("hide");
  }

  showMessage(
    "You have been logged out.",
    "success"
  );
}

document.getElementById("logout")?.addEventListener(
  "click",
  logout
);

document.getElementById("logout2")?.addEventListener(
  "click",
  logout
);

// ==========================================
// NAVIGATION
// ==========================================

function showPage(pageName) {

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageName);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll("nav button").forEach(button => {
    button.classList.remove("active");

    if (button.dataset.page === pageName) {
      button.classList.add("active");
    }
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-page]").forEach(button => {

  button.addEventListener("click", () => {

    const page = button.dataset.page;

    if (page) {
      showPage(page);
    }

  });

});

// ==========================================
// PLATFORM SELECTION
// ==========================================

document.querySelectorAll(".service[data-platform]").forEach(button => {

  button.addEventListener("click", () => {

    selectedPlatform =
      button.dataset.platform;

    const platformInput =
      document.getElementById("platform");

    if (platformInput) {
      platformInput.value =
        selectedPlatform;
    }

    setupServiceOptions();

    showPage("order");
  });

});

// ==========================================
// SERVICE OPTIONS
// ==========================================

function setupServiceOptions() {

  const select =
    document.getElementById("service");

  if (!select || !selectedPlatform) {
    return;
  }

  select.innerHTML = "";

  const services =
    SERVICES[selectedPlatform];

  if (!services) {
    return;
  }

  Object.keys(services).forEach(service => {

    const option =
      document.createElement("option");

    option.value = service;
    option.textContent =
      `${service} — ${money(services[service])} / 1,000`;

    select.appendChild(option);

  });

  calculateTotal();
}

document.getElementById("service")?.addEventListener(
  "change",
  calculateTotal
);

document.getElementById("quantity")?.addEventListener(
  "input",
  calculateTotal
);

// ==========================================
// PRICE CALCULATOR
// ==========================================

function calculateTotal() {

  const quantity =
    Number(
      document.getElementById("quantity")?.value || 0
    );

  const service =
    document.getElementById("service")?.value;

  const totalElement =
    document.getElementById("total");

  if (!totalElement) {
    return;
  }

  if (
    !selectedPlatform ||
    !service ||
    !SERVICES[selectedPlatform]?.[service]
  ) {
    totalElement.textContent = "₦0.00";
    return;
  }

  const pricePerThousand =
    SERVICES[selectedPlatform][service];

  const total =
    (quantity / 1000) * pricePerThousand;

  totalElement.textContent =
    money(total);
}

// ==========================================
// PLACE ORDER
// ==========================================

document.getElementById("place")?.addEventListener(
  "click",
  async () => {

    if (!currentUser) {
      showToast("Please log in first.");
      return;
    }

    const service =
      document.getElementById("service")?.value;

    const quantity =
      Number(
        document.getElementById("quantity")?.value || 0
      );

    const url =
      document.getElementById("url")?.value.trim();

    if (!selectedPlatform) {
      showToast("Please select a platform.");
      return;
    }

    if (!service) {
      showToast("Please select a service.");
      return;
    }

    if (quantity < 100) {
      showToast("Minimum order is 100.");
      return;
    }

    if (!url) {
      showToast("Enter your post or profile link.");
      return;
    }

    const pricePerThousand =
      SERVICES[selectedPlatform][service];

    const total =
      (quantity / 1000) * pricePerThousand;

    /*
      Database orders will be connected after
      we create the Supabase database tables.
    */

    const localOrder = {
      id: "RAB-" + Date.now(),
      user_id: currentUser.id,
      platform: selectedPlatform,
      service: service,
      quantity: quantity,
      link: url,
      amount: total,
      status: "pending",
      created_at: new Date().toISOString()
    };

    const existingOrders =
      JSON.parse(
        localStorage.getItem("rab_orders") || "[]"
      );

    existingOrders.unshift(localOrder);

    localStorage.setItem(
      "rab_orders",
      JSON.stringify(existingOrders)
    );

    showToast(
      "Order submitted successfully."
    );

    document.getElementById("quantity").value = "";
    document.getElementById("url").value = "";

    calculateTotal();

    loadOrders();

    setTimeout(() => {
      showPage("orders");
    }, 500);
  }
);

// ==========================================
// LOAD ORDERS
// ==========================================

function loadOrders() {

  const list =
    document.getElementById("ordersList");

  if (!list) {
    return;
  }

  const orders =
    JSON.parse(
      localStorage.getItem("rab_orders") || "[]"
    );

  if (!orders.length) {

    list.innerHTML = `
      <div class="card empty">
        No orders yet.
        Start boosting to see your orders here.
      </div>
    `;

    return;
  }

  list.innerHTML = "";

  orders.forEach(order => {

    const item =
      document.createElement("div");

    item.className = "card order-card";

    item.innerHTML = `
      <div>
        <strong>${order.platform} ${order.service}</strong>
      </div>

      <p>
        Quantity:
        ${Number(order.quantity).toLocaleString()}
      </p>

      <p>
        Amount:
        ${money(order.amount)}
      </p>

      <p>
        Status:
        <strong>${order.status}</strong>
      </p>

      <small>
        ${new Date(order.created_at).toLocaleString("en-NG")}
      </small>
    `;

    list.appendChild(item);

  });
}

// ==========================================
// SUPABASE SESSION
// ==========================================

async function checkSession() {

  try {

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.user) {

      currentUser = session.user;

      if (currentUser.email_confirmed_at) {
        openApp(currentUser);
      }

    }

  } catch (error) {

    console.error(
      "Session check error:",
      error
    );

  }
}

// ==========================================
// AUTH STATE CHANGES
// ==========================================

supabase.auth.onAuthStateChange(
  (event, session) => {

    if (
      session?.user &&
      session.user.email_confirmed_at
    ) {
      currentUser = session.user;
    }

  }
);

// ==========================================
// START
// ==========================================

loadOrders();

checkSession();

showPage("home");
