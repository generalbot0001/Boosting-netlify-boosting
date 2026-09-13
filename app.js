/* =========================================================
   REAL ABBA BOOSTING
   Supabase Authentication + Dashboard + Orders
   ========================================================= */

const supabaseClient = window.supabaseClient;

let currentUser = null;
let selectedPlatform = "";
let selectedService = "";

/* -----------------------------
   HELPERS
----------------------------- */

function $(id) {
  return document.getElementById(id);
}

function showMessage(message, type = "") {
  const msg = $("msg");
  if (!msg) return;

  msg.textContent = message;
  msg.className = "form-message " + type;
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function formatNaira(amount) {
  return "₦" + Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char];
  });
}

/* -----------------------------
   SERVICE PRICES
   Exact prices supplied
----------------------------- */

const SERVICE_PRICES = {
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

function getServicePrice(platform, service) {
  return SERVICE_PRICES[platform]?.[service] || 0;
}

function calculateOrderPrice() {
  const quantity = Number($("quantity")?.value || 0);

  if (!selectedPlatform || !selectedService || quantity <= 0) {
    return 0;
  }

  const pricePer1000 = getServicePrice(
    selectedPlatform,
    selectedService
  );

  return (quantity / 1000) * pricePer1000;
}

/* -----------------------------
   AUTH TAB SWITCHING
----------------------------- */

function switchAuthTab(tab) {
  const loginBox = $("loginBox");
  const signupBox = $("signupBox");

  if (!loginBox || !signupBox) return;

  if (tab === "signup") {
    loginBox.classList.add("hide");
    signupBox.classList.remove("hide");
  } else {
    signupBox.classList.add("hide");
    loginBox.classList.remove("hide");
  }

  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(tabButton => {
    tabButton.classList.toggle(
      "active",
      tabButton.dataset.tab === tab
    );
  });

  showMessage("");
}

window.switchAuthTab = switchAuthTab;

/* -----------------------------
   AUTH UI
----------------------------- */

function showAuth() {
  const auth = $("auth");
  const app = $("app");

  if (auth) auth.classList.remove("hide");
  if (app) app.classList.add("hide");
}

function showApp() {
  const auth = $("auth");
  const app = $("app");

  if (auth) auth.classList.add("hide");
  if (app) app.classList.remove("hide");
}

/* -----------------------------
   SIGN UP
----------------------------- */

async function handleSignup(event) {
  if (event) event.preventDefault();

  if (!supabaseClient) {
    showMessage(
      "Supabase is not connected. Please check supabase.js.",
      "error"
    );
    return;
  }

  const name = $("name")?.value.trim() || "";
  const email = $("email")?.value.trim() || "";
  const password = $("pass")?.value || "";

  if (!name) {
    showMessage("Please enter your full name.");
    return;
  }

  if (!email) {
    showMessage("Please enter your email address.");
    return;
  }

  if (!password) {
    showMessage("Please enter a password.");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters.");
    return;
  }

  showMessage("Creating your account...");

  const signupButton = $("signup");

  if (signupButton) {
    signupButton.disabled = true;
    signupButton.textContent = "Creating Account...";
  }

  try {
    const redirectUrl =
      window.location.origin + window.location.pathname;

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,

      options: {
        emailRedirectTo: redirectUrl,

        data: {
          full_name: name,
          display_name: name,
          name: name
        }
      }
    });

    if (error) {
      console.error("Supabase signup error:", error);

      showMessage(
        error.message || "Unable to create account.",
        "error"
      );

      return;
    }

    if (!data || !data.user) {
      showMessage(
        "Account was not created. Please try again.",
        "error"
      );

      return;
    }

    currentUser = data.user;

    /*
      IMPORTANT:

      When Supabase email confirmation is enabled,
      signUp() normally returns a user but NO session.

      We must NOT send the user back to Login.

      Instead we show the confirmation message.
    */

    if (!data.session) {
      showEmailConfirmationScreen(email);
      return;
    }

    /*
      If email confirmation is disabled,
      Supabase gives us a session immediately.
    */

    await openDashboard(data.user);

  } catch (error) {
    console.error("Signup exception:", error);

    showMessage(
      error?.message || "Something went wrong while creating your account.",
      "error"
    );

  } finally {
    if (signupButton) {
      signupButton.disabled = false;
      signupButton.textContent = "Create Account";
    }
  }
}

window.handleSignup = handleSignup;

/* -----------------------------
   EMAIL CONFIRMATION SCREEN
----------------------------- */

function showEmailConfirmationScreen(email) {
  const loginBox = $("loginBox");
  const signupBox = $("signupBox");

  if (loginBox) loginBox.classList.add("hide");
  if (signupBox) signupBox.classList.add("hide");

  let verificationBox = $("verificationBox");

  /*
    Create the screen automatically if the current
    index.html doesn't already contain one.
  */

  if (!verificationBox) {
    verificationBox = document.createElement("div");

    verificationBox.id = "verificationBox";

    verificationBox.className = "auth-card";

    verificationBox.innerHTML = `
      <div style="
        text-align:center;
        padding:10px 0;
      ">

        <div style="
          font-size:48px;
          margin-bottom:15px;
        ">📧</div>

        <h2>Check your email</h2>

        <p style="
          margin:12px 0;
          opacity:.8;
        ">
          We created your REAL ABBA BOOSTING account.
        </p>

        <p style="
          font-weight:700;
          word-break:break-word;
          margin:15px 0;
        " id="verificationEmail">
          ${escapeHtml(email)}
        </p>

        <p style="
          opacity:.75;
          line-height:1.6;
        ">
          We sent a confirmation link to your email.
          Open the email and tap the confirmation link.
        </p>

        <button
          id="checkVerificationBtn"
          type="button"
          class="primary"
          style="margin-top:20px;"
        >
          I've Confirmed My Email
        </button>

        <button
          id="backToLoginBtn"
          type="button"
          style="
            width:100%;
            margin-top:10px;
            background:transparent;
            border:0;
            color:#4da3ff;
          "
        >
          Back to Login
        </button>

        <p
          id="verificationMessage"
          style="
            margin-top:15px;
            line-height:1.5;
          "
        ></p>

      </div>
    `;

    const authContainer = $("auth");

    if (authContainer) {
      authContainer.appendChild(verificationBox);
    }
  }

  verificationBox.classList.remove("hide");

  const verificationEmail = $("verificationEmail");

  if (verificationEmail) {
    verificationEmail.textContent = email;
  }

  const verificationMessage = $("verificationMessage");

  if (verificationMessage) {
    verificationMessage.textContent =
      "📧 Confirmation email sent. Check your inbox and spam folder.";
  }

  const checkButton = $("checkVerificationBtn");

  if (checkButton && !checkButton.dataset.bound) {
    checkButton.dataset.bound = "true";

    checkButton.addEventListener("click", checkEmailVerification);
  }

  const backButton = $("backToLoginBtn");

  if (backButton && !backButton.dataset.bound) {
    backButton.dataset.bound = "true";

    backButton.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();

      verificationBox.classList.add("hide");

      switchAuthTab("login");

      if ($("loginEmail")) {
        $("loginEmail").value = email;
      }
    });
  }
}

/* -----------------------------
   CHECK EMAIL VERIFICATION
----------------------------- */

async function checkEmailVerification() {
  const message = $("verificationMessage");

  if (message) {
    message.textContent = "Checking your email verification...";
  }

  try {
    const {
      data: {
        user
      }
    } = await supabaseClient.auth.getUser();

    if (!user) {
      if (message) {
        message.textContent =
          "Please log in after confirming your email.";
      }

      return;
    }

    currentUser = user;

    if (!user.email_confirmed_at) {
      if (message) {
        message.textContent =
          "Your email is not confirmed yet. Open the confirmation email and tap the link first.";
      }

      return;
    }

    if (message) {
      message.textContent =
        "Email confirmed! Opening your dashboard...";
    }

    setTimeout(() => {
      openDashboard(user);
    }, 700);

  } catch (error) {
    console.error(error);

    if (message) {
      message.textContent =
        error?.message ||
        "Could not check your email verification.";
    }
  }
}

/* -----------------------------
   LOGIN
----------------------------- */

async function handleLogin(event) {
  if (event) event.preventDefault();

  if (!supabaseClient) {
    showMessage(
      "Supabase is not connected.",
      "error"
    );
    return;
  }

  const email = $("loginEmail")?.value.trim() || "";
  const password = $("loginPass")?.value || "";

  if (!email || !password) {
    showMessage("Enter your email and password.");
    return;
  }

  showMessage("Signing in...");

  const loginButton = $("login");

  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
  }

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("Login error:", error);

      showMessage(
        error.message || "Login failed.",
        "error"
      );

      return;
    }

    if (!data?.user) {
      showMessage(
        "Login failed. Please try again.",
        "error"
      );

      return;
    }

    currentUser = data.user;

    if (!data.user.email_confirmed_at) {
      showEmailConfirmationScreen(email);
      return;
    }

    await openDashboard(data.user);

  } catch (error) {
    console.error(error);

    showMessage(
      error?.message || "Unable to log in.",
      "error"
    );

  } finally {
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent = "Login";
    }
  }
}

/* -----------------------------
   FORGOT PASSWORD
----------------------------- */

async function handleForgotPassword() {
  const email = $("loginEmail")?.value.trim() || "";

  if (!email) {
    showMessage(
      "Enter your email address first."
    );

    return;
  }

  showMessage("Sending password reset email...");

  try {
    const redirectUrl =
      window.location.origin +
      window.location.pathname;

    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: redirectUrl
        }
      );

    if (error) {
      showMessage(
        error.message,
        "error"
      );

      return;
    }

    showMessage(
      "Password reset email sent. Check your inbox and spam folder."
    );

  } catch (error) {
    showMessage(
      error?.message ||
      "Could not send password reset email.",
      "error"
    );
  }
}

/* -----------------------------
   PROFILE
----------------------------- */

async function loadProfile(user) {
  try {
    const { data, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
      console.warn("Profile lookup:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

/* -----------------------------
   OPEN DASHBOARD
----------------------------- */

async function openDashboard(user) {
  currentUser = user;

  showApp();

  const metadata = user.user_metadata || {};

  const profile = await loadProfile(user);

  const name =
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    metadata.full_name ||
    metadata.display_name ||
    metadata.name ||
    "Creator";

  const email =
    user.email ||
    "Account";

  if ($("welcome")) {
    $("welcome").textContent =
      `${name} 👋`;
  }

  if ($("acctName")) {
    $("acctName").textContent =
      name;
  }

  if ($("acctEmail")) {
    $("acctEmail").textContent =
      email;
  }

  if ($("acctEmail2")) {
    $("acctEmail2").textContent =
      email;
  }

  if (profile?.wallet_balance !== undefined) {
    updateWallet(profile.wallet_balance);
  } else {
    updateWallet(0);
  }

  showPage("home");

  await loadOrders();

  showMessage("");
}

/* -----------------------------
   WALLET
----------------------------- */

function updateWallet(balance) {
  const formatted = formatNaira(balance);

  document
    .querySelectorAll(".wallet-mini strong, #walletBalance")
    .forEach(element => {
      element.textContent = formatted;
    });
}

/* -----------------------------
   NAVIGATION
----------------------------- */

function showPage(page) {
  document
    .querySelectorAll(".app-page")
    .forEach(section => {
      section.classList.remove("active");
    });

  const target =
    $("page-" + page);

  if (target) {
    target.classList.add("active");
  }

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === page
      );
    });

  window.scrollTo({
    top: 0,
    behavior: "instant"
  });
}

window.showPage = showPage;

/* -----------------------------
   SERVICE SELECTION
----------------------------- */

function openOrder(platform) {
  selectedPlatform = platform;

  const serviceSelect = $("service");

  if (serviceSelect) {
    serviceSelect.innerHTML = "";

    const services =
      Object.keys(
        SERVICE_PRICES[platform] || {}
      );

    services.forEach(service => {
      const option =
        document.createElement("option");

      option.value = service;
      option.textContent =
        `${service} — ${formatNaira(
          SERVICE_PRICES[platform][service]
        )} / 1,000`;

      serviceSelect.appendChild(option);
    });

    selectedService =
      services[0] || "";

    serviceSelect.value =
      selectedService;
  }

  if ($("platform")) {
    $("platform").value =
      platform;
  }

  updateOrderTotal();

  showPage("order");
}

function updateOrderTotal() {
  const quantity =
    Number($("quantity")?.value || 0);

  const service =
    $("service")?.value || selectedService;

  selectedService = service;

  const pricePer1000 =
    getServicePrice(
      selectedPlatform,
      service
    );

  const total =
    quantity > 0
      ? (quantity / 1000) * pricePer1000
      : 0;

  if ($("total")) {
    $("total").textContent =
      formatNaira(total);
  }

  return total;
}

/* -----------------------------
   PLACE ORDER
----------------------------- */

async function handleOrder(event) {
  if (event) event.preventDefault();

  if (!currentUser) {
    showToast("Please log in first.");
    return;
  }

  const platform =
    selectedPlatform ||
    $("platform")?.value ||
    "";

  const service =
    $("service")?.value ||
    selectedService ||
    "";

  const quantity =
    Number($("quantity")?.value || 0);

  const link =
    $("url")?.value.trim() || "";

  const total =
    calculateOrderPrice();

  if (!platform) {
    showMessage("Please select a platform.");
    return;
  }

  if (!service) {
    showMessage("Please select a service.");
    return;
  }

  if (!quantity || quantity < 1) {
    showMessage("Enter a valid quantity.");
    return;
  }

  if (!link) {
    showMessage("Enter your profile, post or video link.");
    return;
  }

  if (!supabaseClient) {
    showMessage("Supabase is not connected.");
    return;
  }

  showMessage("Submitting order...");

  try {
    const { error } =
      await supabaseClient
        .from("orders")
        .insert({
          uid: currentUser.id,
          name:
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.display_name ||
            "Customer",
          email: currentUser.email,
          platform: platform,
          service: service,
          quantity: quantity,
          link: link,
          amount: total,
          status: "pending",
          adminNote: ""
        });

    if (error) {
      console.error("Order error:", error);

      showMessage(
        error.message ||
        "Could not place order.",
        "error"
      );

      return;
    }

    showToast(
      "Order submitted successfully."
    );

    $("orderForm")?.reset();

    selectedService = "";

    if ($("total")) {
      $("total").textContent =
        formatNaira(0);
    }

    await loadOrders();

    showPage("orders");

  } catch (error) {
    console.error(error);

    showMessage(
      error?.message ||
      "Something went wrong while placing your order.",
      "error"
    );
  }
}

/* -----------------------------
   LOAD ORDERS
----------------------------- */

async function loadOrders() {
  const list = $("ordersList");

  if (!list || !currentUser) {
    return;
  }

  list.innerHTML = `
    <div class="empty-state">
      <div>⏳</div>
      <h3>Loading orders...</h3>
      <p>Please wait.</p>
    </div>
  `;

  try {
    const { data, error } =
      await supabaseClient
        .from("orders")
        .select("*")
        .eq("uid", currentUser.id)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.warn(
        "Orders could not be loaded:",
        error.message
      );

      list.innerHTML = `
        <div class="empty-state">
          <div>📦</div>
          <h3>No orders yet</h3>
          <p>Your submitted orders will appear here.</p>
        </div>
      `;

      return;
    }

    if (!data || data.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div>📦</div>
          <h3>No orders yet</h3>
          <p>Start by choosing a service and placing your first order.</p>
          <button
            class="primary-btn"
            type="button"
            data-go="services"
          >
            Browse Services
          </button>
        </div>
      `;

      const browse =
        list.querySelector("[data-go]");

      if (browse) {
        browse.addEventListener(
          "click",
          () => showPage("services")
        );
      }

      return;
    }

    list.innerHTML =
      data.map(order => {

        const status =
          order.status || "pending";

        const amount =
          order.amount || 0;

        const date =
          order.created_at
            ? new Date(
                order.created_at
              ).toLocaleString()
            : "";

        return `
          <div class="order-item">

            <strong>
              ${escapeHtml(
                order.platform || ""
              )}
              —
              ${escapeHtml(
                order.service || ""
              )}
            </strong>

            <span>
              Quantity:
              ${Number(
                order.quantity || 0
              ).toLocaleString()}
            </span>

            <span>
              Amount:
              ${formatNaira(amount)}
            </span>

            <span>
              Status:
              ${escapeHtml(status)}
            </span>

            <span>
              ${escapeHtml(date)}
            </span>

            <span>
              ${escapeHtml(
                order.link || ""
              )}
            </span>

            ${
              order.adminNote
                ? `
                  <small>
                    Admin note:
                    ${escapeHtml(
                      order.adminNote
                    )}
                  </small>
                `
                : ""
            }

          </div>
        `;
      }).join("");

  } catch (error) {
    console.error(error);

    list.innerHTML = `
      <div class="empty-state">
        <div>📦</div>
        <h3>Unable to load orders</h3>
        <p>Please try again later.</p>
      </div>
    `;
  }
}

/* -----------------------------
   LOGOUT
----------------------------- */

async function logoutUser() {
  try {
    await supabaseClient.auth.signOut();
  } catch (error) {
    console.error(error);
  }

  currentUser = null;

  showAuth();

  switchAuthTab("login");

  if ($("loginPass")) {
    $("loginPass").value = "";
  }

  showToast("You have been logged out.");
}

window.logoutUser = logoutUser;

/* -----------------------------
   WHATSAPP
----------------------------- */

function contactWhatsApp() {
  /*
    Replace this number with your REAL ABBA BOOSTING
    WhatsApp number when you are ready.
  */

  const phone =
    "2340000000000";

  window.open(
    `https://wa.me/${phone}`,
    "_blank"
  );
}

window.contactWhatsApp =
  contactWhatsApp;

/* -----------------------------
   INITIALIZATION
----------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (!supabaseClient) {
      console.error(
        "supabaseClient is missing."
      );

      showMessage(
        "Supabase connection is missing. Check supabase.js.",
        "error"
      );

      return;
    }

    /* AUTH TABS */

    document
      .querySelectorAll(".tab")
      .forEach(tab => {

        tab.addEventListener(
          "click",
          () => {
            switchAuthTab(
              tab.dataset.tab
            );
          }
        );

      });

    /* LOGIN FORM */

    const loginForm =
      $("loginForm");

    if (loginForm) {
      loginForm.addEventListener(
        "submit",
        handleLogin
      );
    }

    /* SIGNUP FORM */

    const signupForm =
      $("signupForm");

    if (signupForm) {
      signupForm.addEventListener(
        "submit",
        handleSignup
      );
    }

    /* SIGNUP BUTTON FALLBACK */

    const signupButton =
      $("signup");

    if (
      signupButton &&
      !signupButton.dataset.bound
    ) {
      signupButton.dataset.bound =
        "true";

      signupButton.addEventListener(
        "click",
        handleSignup
      );
    }

    /* FORGOT PASSWORD */

    const forgot =
      $("forgot");

    if (forgot) {
      forgot.addEventListener(
        "click",
        handleForgotPassword
      );
    }

    /* NAVIGATION */

    document
      .querySelectorAll(".nav-item")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            showPage(
              button.dataset.page
            );
          }
        );

      });

    /* DATA-GO BUTTONS */

    document
      .querySelectorAll("[data-go]")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {
            showPage(
              button.dataset.go
            );
          }
        );

      });

    /* SERVICE CARDS */

    document
      .querySelectorAll(".service-card")
      .forEach(card => {

        card.addEventListener(
          "click",
          () => {
            openOrder(
              card.dataset.platform ||
              card.dataset.service
            );
          }
        );

      });

    /* ORDER FORM */

    const orderForm =
      $("orderForm");

    if (orderForm) {
      orderForm.addEventListener(
        "submit",
        handleOrder
      );
    }

    /* QUANTITY */

    const quantity =
      $("quantity");

    if (quantity) {
      quantity.addEventListener(
        "input",
        updateOrderTotal
      );
    }

    /* SERVICE */

    const service =
      $("service");

    if (service) {
      service.addEventListener(
        "change",
        updateOrderTotal
      );
    }

    /* LOGOUT BUTTONS */

    $("logout")?.addEventListener(
      "click",
      logoutUser
    );

    $("logout2")?.addEventListener(
      "click",
      logoutUser
    );

    /* WHATSAPP */

    $("homeWhatsapp")?.addEventListener(
      "click",
      contactWhatsApp
    );

    $("accountWhatsapp")?.addEventListener(
      "click",
      contactWhatsApp
    );

    /* EXISTING SESSION */

    try {

      const {
        data: {
          session
        }
      } =
        await supabaseClient.auth.getSession();

      if (session?.user) {

        currentUser =
          session.user;

        if (
          session.user.email_confirmed_at
        ) {
          await openDashboard(
            session.user
          );
        } else {
          showAuth();

          showEmailConfirmationScreen(
            session.user.email
          );
        }

      } else {
        showAuth();
      }

    } catch (error) {
      console.error(
        "Session error:",
        error
      );

      showAuth();
    }

    /* AUTH STATE */

    supabaseClient.auth.onAuthStateChange(
      async (event, session) => {

        console.log(
          "Auth event:",
          event
        );

        if (
          session?.user &&
          session.user.email_confirmed_at
        ) {
          currentUser =
            session.user;
        }

      }
    );

  }
);
