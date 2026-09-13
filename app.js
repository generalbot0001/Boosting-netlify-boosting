const supabase = window.supabaseClient;

const $ = (id) => document.getElementById(id);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const SERVICES = {
  TikTok: {
    Followers: 6000,
    Likes: 1000,
    Views: 400
  },
  Instagram: {
    Followers: 5500,
    Likes: 800,
    Views: 300
  },
  YouTube: {
    Subscribers: 65000,
    Views: 2500
  },
  Facebook: {
    Followers: 5300
  },
  Telegram: {
    Members: 5000
  }
};

let currentUser = null;
let currentProfile = null;
let selectedPlatform = "";

function showMessage(message) {
  $("msg").textContent = message || "";
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function formatMoney(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function showPage(page) {
  $$(".page").forEach((p) => p.classList.remove("active"));

  const target = $(page);
  if (target) {
    target.classList.add("active");
  }

  $$("nav button").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function openApp(profile) {
  currentProfile = profile;

  $("auth").classList.add("hide");
  $("app").classList.remove("hide");

  const name =
    profile?.full_name ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.display_name ||
    currentUser?.email?.split("@")[0] ||
    "Abba";

  const email = currentUser?.email || profile?.email || "";

  $("welcome").textContent = name + " 👋";
  $("acctName").textContent = name;
  $("acctEmail").textContent = email;
  $("acctEmail2").textContent = email;

  updateWallet(profile?.wallet_balance || 0);

  showPage("home");
}

function closeApp() {
  $("app").classList.add("hide");
  $("auth").classList.remove("hide");
}

function updateWallet(balance) {
  const walletAmount = formatMoney(balance);

  document.querySelectorAll(".wallet b").forEach((element) => {
    element.textContent = walletAmount;
  });
}

function updateServiceOptions(platform) {
  const serviceSelect = $("service");

  serviceSelect.innerHTML = "";

  const services = SERVICES[platform] || {};

  Object.keys(services).forEach((serviceName) => {
    const option = document.createElement("option");
    option.value = serviceName;
    option.textContent = serviceName;
    serviceSelect.appendChild(option);
  });

  calculateTotal();
}

function calculateTotal() {
  const quantity = Number($("quantity").value) || 0;
  const service = $("service").value;
  const pricePerThousand =
    SERVICES[selectedPlatform]?.[service] || 0;

  const total = (quantity / 1000) * pricePerThousand;

  $("total").textContent = formatMoney(total);
}

async function loadProfile() {
  if (!currentUser) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", currentUser.id)
    .single();

  if (error) {
    console.error("Profile error:", error);
    return null;
  }

  return data;
}

async function loadOrders() {
  if (!currentUser) return;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", currentUser.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Orders error:", error);
    $("ordersList").innerHTML = `
      <div class="card empty">
        Unable to load orders right now.
      </div>
    `;
    return;
  }

  renderOrders(data || []);
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function renderOrders(orders) {
  const list = $("ordersList");

  if (!orders.length) {
    list.innerHTML = `
      <div class="card empty">
        No orders yet. Start boosting to see your orders here.
      </div>
    `;
    return;
  }

  list.innerHTML = orders
    .map((order) => {
      const date = order.created_at
        ? new Date(order.created_at).toLocaleString("en-NG")
        : "";

      return `
        <article class="card order-card">
          <div>
            <strong>
              ${escapeHtml(order.platform)} —
              ${escapeHtml(order.service)}
            </strong>

            <small>
              Quantity:
              ${Number(order.quantity).toLocaleString()}
            </small>

            <small>
              Total:
              ${formatMoney(order.amount)}
            </small>

            <small>
              ${escapeHtml(order.link)}
            </small>

            <small>
              ${escapeHtml(date)}
            </small>
          </div>

          <span class="status">
            ${escapeHtml(
              String(order.status || "pending").toUpperCase()
            )}
          </span>

          ${
            order.admin_note
              ? `<small>Admin note: ${escapeHtml(order.admin_note)}</small>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

async function handleSignup() {
  const name = $("name").value.trim();
  const email = $("email").value.trim();
  const password = $("pass").value;

  if (!name || !email || password.length < 6) {
    showMessage(
      "Enter your name, valid email and a 6+ character password."
    );
    return;
  }

  showMessage("Creating your account...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        window.location.origin +
        window.location.pathname,

      data: {
        full_name: name,
        display_name: name
      }
    }
  });

  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }

  if (data.user && !data.session) {
    showMessage(
      "Account created! Check your email and click the confirmation link before logging in."
    );
    return;
  }

  showMessage("Account created successfully.");
}

async function handleLogin() {
  const email = $("loginEmail").value.trim();
  const password = $("loginPass").value;

  if (!email || !password) {
    showMessage("Enter your email and password.");
    return;
  }

  showMessage("Logging in...");

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }

  if (!data.user.email_confirmed_at) {
    showMessage(
      "Please confirm your email before logging in."
    );

    await supabase.auth.signOut();
    return;
  }

  currentUser = data.user;

  const profile = await loadProfile();

  openApp(
    profile || {
      full_name:
        data.user.user_metadata?.full_name ||
        data.user.email.split("@")[0],
      email: data.user.email,
      wallet_balance: 0
    }
  );

  await loadOrders();
}

async function handleForgotPassword() {
  const email = $("loginEmail").value.trim();

  if (!email) {
    showMessage("Enter your email first.");
    return;
  }

  showMessage("Sending password reset email...");

  const { error } =
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        window.location.origin +
        window.location.pathname
    });

  if (error) {
    console.error(error);
    showMessage(error.message);
    return;
  }

  showMessage(
    "Password reset email sent. Check your inbox."
  );
}

async function handlePlaceOrder() {
  if (!currentUser) {
    showToast("Please log in first.");
    return;
  }

  const quantity = Number($("quantity").value);
  const link = $("url").value.trim();
  const service = $("service").value;

  if (!selectedPlatform || !service || !quantity || quantity < 1 || !link) {
    showToast("Please complete all order fields.");
    return;
  }

  const pricePerThousand =
    SERVICES[selectedPlatform]?.[service];

  if (!pricePerThousand) {
    showToast("This service is not available.");
    return;
  }

  const amount =
    (quantity / 1000) * pricePerThousand;

  $("place").disabled = true;
  $("place").textContent = "Submitting...";

  const { error } = await supabase
    .from("orders")
    .insert({
      user_id: currentUser.id,
      platform: selectedPlatform,
      service: service,
      quantity: quantity,
      link: link,
      amount: amount,
      status: "pending",
      admin_note: ""
    });

  $("place").disabled = false;
  $("place").textContent = "Place Order";

  if (error) {
    console.error("Order error:", error);
    showToast("Order could not be submitted.");
    return;
  }

  $("quantity").value = "";
  $("url").value = "";
  calculateTotal();

  await loadOrders();

  showToast("Order submitted successfully.");
  showPage("orders");
}

async function logout() {
  await supabase.auth.signOut();

  currentUser = null;
  currentProfile = null;

  closeApp();
  showMessage("");
}

async function initialize() {
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return;
  }

  if (!session.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return;
  }

  currentUser = session.user;

  const profile = await loadProfile();

  openApp(
    profile || {
      full_name:
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] ||
        "Abba",
      email: session.user.email,
      wallet_balance: 0
    }
  );

  await loadOrders();
}

/* LOGIN / SIGN UP TABS */

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".tab").forEach((tab) =>
      tab.classList.remove("active")
    );

    button.classList.add("active");

    const signup =
      button.dataset.tab === "signup";

    $("loginBox").classList.toggle("hide", signup);
    $("signupBox").classList.toggle("hide", !signup);

    showMessage("");
  });
});

/* LOGIN */

$("login").addEventListener("click", handleLogin);

/* SIGN UP */

$("signup").addEventListener("click", handleSignup);

/* FORGOT PASSWORD */

$("forgot").addEventListener(
  "click",
  handleForgotPassword
);

/* NAVIGATION */

$$("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

/* PLATFORM SELECTION */

$$(".service[data-platform]").forEach((button) => {
  button.addEventListener("click", () => {
    selectedPlatform =
      button.dataset.platform;

    $("platform").value = selectedPlatform;
    $("orderTitle").textContent =
      selectedPlatform + " order";

    updateServiceOptions(selectedPlatform);
    showPage("order");
  });
});

/* PRICE CALCULATION */

$("quantity").addEventListener(
  "input",
  calculateTotal
);

$("service").addEventListener(
  "change",
  calculateTotal
);

/* PLACE ORDER */

$("place").addEventListener(
  "click",
  handlePlaceOrder
);

/* LOGOUT */

$("logout").addEventListener(
  "click",
  logout
);

$("logout2").addEventListener(
  "click",
  logout
);

/* AUTH STATE */

supabase.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "SIGNED_OUT") {
      currentUser = null;
      currentProfile = null;
      closeApp();
      return;
    }

    if (
      event === "SIGNED_IN" &&
      session?.user?.email_confirmed_at
    ) {
      currentUser = session.user;

      const profile = await loadProfile();

      openApp(
        profile || {
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "Abba",
          email: session.user.email,
          wallet_balance: 0
        }
      );

      await loadOrders();
    }
  }
);

/* START */

initialize();
