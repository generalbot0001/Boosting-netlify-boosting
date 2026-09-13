/* =========================================================
   REAL ABBA BOOSTING
   Supabase App JavaScript
========================================================= */

const supabase = window.supabaseClient;


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector) =>
  [...document.querySelectorAll(selector)];


/* =========================================================
   SERVICES & PRICES
========================================================= */

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


/* =========================================================
   APP STATE
========================================================= */

let currentUser = null;
let currentProfile = null;
let selectedPlatform = "";


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message) {
  const element = $("msg");

  if (element) {
    element.textContent = message || "";
  }
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {
  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message || "";

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(amount) {
  return (
    "₦" +
    Number(amount || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  );
}


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(page) {
  $$(".page").forEach((p) => {
    p.classList.remove("active");
  });

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


/* =========================================================
   OPEN APP
========================================================= */

function openApp(profile) {
  currentProfile = profile || null;

  const auth = $("auth");
  const app = $("app");

  if (auth) {
    auth.classList.add("hide");
  }

  if (app) {
    app.classList.remove("hide");
  }

  const name =
    profile?.full_name ||
    profile?.display_name ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.display_name ||
    currentUser?.email?.split("@")[0] ||
    "Abba";

  const email =
    currentUser?.email ||
    profile?.email ||
    "";

  if ($("welcome")) {
    $("welcome").textContent = name + " 👋";
  }

  if ($("acctName")) {
    $("acctName").textContent = name;
  }

  if ($("acctEmail")) {
    $("acctEmail").textContent = email;
  }

  if ($("acctEmail2")) {
    $("acctEmail2").textContent = email;
  }

  updateWallet(
    profile?.wallet_balance || 0
  );

  showPage("home");
}


/* =========================================================
   CLOSE APP
========================================================= */

function closeApp() {
  if ($("app")) {
    $("app").classList.add("hide");
  }

  if ($("auth")) {
    $("auth").classList.remove("hide");
  }
}


/* =========================================================
   WALLET
========================================================= */

function updateWallet(balance) {
  const walletAmount = formatMoney(balance);

  document.querySelectorAll(".wallet b").forEach(
    (element) => {
      element.textContent = walletAmount;
    }
  );
}


/* =========================================================
   SERVICE OPTIONS
========================================================= */

function updateServiceOptions(platform) {
  const serviceSelect = $("service");

  if (!serviceSelect) return;

  serviceSelect.innerHTML = "";

  const services = SERVICES[platform] || {};

  Object.keys(services).forEach(
    (serviceName) => {
      const option =
        document.createElement("option");

      option.value = serviceName;
      option.textContent = serviceName;

      serviceSelect.appendChild(option);
    }
  );

  calculateTotal();
}


/* =========================================================
   CALCULATE ORDER TOTAL
========================================================= */

function calculateTotal() {
  const quantityElement = $("quantity");
  const serviceElement = $("service");
  const totalElement = $("total");

  if (!quantityElement ||
      !serviceElement ||
      !totalElement) {
    return;
  }

  const quantity =
    Number(quantityElement.value) || 0;

  const service =
    serviceElement.value;

  const pricePerThousand =
    SERVICES[selectedPlatform]?.[service] || 0;

  const total =
    (quantity / 1000) *
    pricePerThousand;

  totalElement.textContent =
    formatMoney(total);
}


/* =========================================================
   LOAD USER PROFILE
========================================================= */

async function loadProfile() {
  if (!currentUser) {
    return null;
  }

  try {
    const {
      data,
      error
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (error) {
      console.error(
        "Profile error:",
        error
      );

      return null;
    }

    return data;

  } catch (error) {
    console.error(
      "Profile exception:",
      error
    );

    return null;
  }
}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {
  if (!currentUser) {
    return;
  }

  const list = $("ordersList");

  try {
    const {
      data,
      error
    } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.error(
        "Orders error:",
        error
      );

      if (list) {
        list.innerHTML = `
          <div class="card empty">
            Unable to load orders right now.
          </div>
        `;
      }

      return;
    }

    renderOrders(data || []);

  } catch (error) {
    console.error(
      "Orders exception:",
      error
    );
  }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

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


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(orders) {
  const list = $("ordersList");

  if (!list) {
    return;
  }

  if (!orders.length) {
    list.innerHTML = `
      <div class="card empty">
        No orders yet.
        Start boosting to see your orders here.
      </div>
    `;

    return;
  }

  list.innerHTML = orders
    .map((order) => {

      const date =
        order.created_at
          ? new Date(
              order.created_at
            ).toLocaleString("en-NG")
          : "";

      return `
        <article class="card order-card">

          <div>

            <strong>
              ${escapeHtml(order.platform)}
              —
              ${escapeHtml(order.service)}
            </strong>

            <small>
              Quantity:
              ${Number(
                order.quantity || 0
              ).toLocaleString()}
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
              String(
                order.status || "pending"
              ).toUpperCase()
            )}
          </span>

          ${
            order.admin_note
              ? `
                <small>
                  Admin note:
                  ${escapeHtml(
                    order.admin_note
                  )}
                </small>
              `
              : ""
          }

        </article>
      `;
    })
    .join("");
}


/* =========================================================
   SIGN UP
========================================================= */

async function handleSignup() {

  const name =
    $("name")?.value.trim() || "";

  const email =
    $("email")?.value.trim() || "";

  const password =
    $("pass")?.value || "";

  if (!name) {
    showMessage(
      "Please enter your name."
    );

    return;
  }

  if (!email) {
    showMessage(
      "Please enter your email."
    );

    return;
  }

  if (password.length < 6) {
    showMessage(
      "Password must be at least 6 characters."
    );

    return;
  }

  showMessage(
    "Creating your account..."
  );

  const signupButton = $("signup");

  if (signupButton) {
    signupButton.disabled = true;
    signupButton.textContent =
      "Creating account...";
  }

  try {

    const {
      data,
      error
    } = await supabase.auth.signUp({
      email: email,
      password: password,

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
      console.error(
        "Signup error:",
        error
      );

      showMessage(
        error.message
      );

      return;
    }

    console.log(
      "Signup result:",
      data
    );

    if (
      data.user &&
      !data.session
    ) {

      showMessage(
        "Account created! Check your email and click the confirmation link before logging in."
      );

      return;
    }

    showMessage(
      "Account created successfully. You can now continue."
    );

  } catch (error) {

    console.error(
      "Signup exception:",
      error
    );

    showMessage(
      "Something went wrong while creating your account."
    );

  } finally {

    if (signupButton) {
      signupButton.disabled = false;
      signupButton.textContent =
        "Sign Up";
    }
  }
}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin() {

  const email =
    $("loginEmail")?.value.trim() || "";

  const password =
    $("loginPass")?.value || "";

  if (!email) {
    showMessage(
      "Enter your email."
    );

    return;
  }

  if (!password) {
    showMessage(
      "Enter your password."
    );

    return;
  }

  showMessage(
    "Logging in..."
  );

  const loginButton = $("login");

  if (loginButton) {
    loginButton.disabled = true;
    loginButton.textContent =
      "Logging in...";
  }

  try {

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {

      console.error(
        "Login error:",
        error
      );

      showMessage(
        error.message
      );

      return;
    }

    if (!data.user) {

      showMessage(
        "Login failed. Please try again."
      );

      return;
    }

    /*
      Supabase normally prevents unconfirmed
      email users from signing in when email
      confirmation is required.
    */

    if (!data.user.email_confirmed_at) {

      showMessage(
        "Please confirm your email before logging in."
      );

      await supabase.auth.signOut();

      return;
    }

    currentUser =
      data.user;

    const profile =
      await loadProfile();

    openApp(
      profile || {
        full_name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.display_name ||
          data.user.email?.split("@")[0] ||
          "Abba",

        email:
          data.user.email,

        wallet_balance:
          0
      }
    );

    await loadOrders();

  } catch (error) {

    console.error(
      "Login exception:",
      error
    );

    showMessage(
      "Something went wrong while logging in."
    );

  } finally {

    if (loginButton) {
      loginButton.disabled = false;
      loginButton.textContent =
        "Login";
    }
  }
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

async function handleForgotPassword() {

  const email =
    $("loginEmail")?.value.trim() || "";

  if (!email) {

    showMessage(
      "Enter your email first."
    );

    return;
  }

  showMessage(
    "Sending password reset email..."
  );

  try {

    const {
      error
    } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            window.location.origin +
            window.location.pathname
        }
      );

    if (error) {

      console.error(
        "Password reset error:",
        error
      );

      showMessage(
        error.message
      );

      return;
    }

    showMessage(
      "Password reset email sent. Check your inbox."
    );

  } catch (error) {

    console.error(
      "Password reset exception:",
      error
    );

    showMessage(
      "Unable to send password reset email."
    );
  }
}


/* =========================================================
   PLACE ORDER
========================================================= */

async function handlePlaceOrder() {

  if (!currentUser) {

    showToast(
      "Please log in first."
    );

    return;
  }

  const quantity =
    Number(
      $("quantity")?.value
    );

  const link =
    $("url")?.value.trim() || "";

  const service =
    $("service")?.value || "";

  if (
    !selectedPlatform ||
    !service ||
    !quantity ||
    quantity < 1 ||
    !link
  ) {

    showToast(
      "Please complete all order fields."
    );

    return;
  }

  const pricePerThousand =
    SERVICES[selectedPlatform]?.[service];

  if (!pricePerThousand) {

    showToast(
      "This service is not available."
    );

    return;
  }

  const amount =
    (quantity / 1000) *
    pricePerThousand;

  const placeButton =
    $("place");

  if (placeButton) {
    placeButton.disabled = true;
    placeButton.textContent =
      "Submitting...";
  }

  try {

    const {
      error
    } = await supabase
      .from("orders")
      .insert({
        user_id:
          currentUser.id,

        platform:
          selectedPlatform,

        service:
          service,

        quantity:
          quantity,

        link:
          link,

        amount:
          amount,

        status:
          "pending",

        admin_note:
          ""
      });

    if (error) {

      console.error(
        "Order error:",
        error
      );

      showToast(
        "Order could not be submitted."
      );

      return;
    }

    if ($("quantity")) {
      $("quantity").value = "";
    }

    if ($("url")) {
      $("url").value = "";
    }

    calculateTotal();

    await loadOrders();

    showToast(
      "Order submitted successfully."
    );

    showPage("orders");

  } catch (error) {

    console.error(
      "Order exception:",
      error
    );

    showToast(
      "Something went wrong submitting the order."
    );

  } finally {

    if (placeButton) {
      placeButton.disabled = false;
      placeButton.textContent =
        "Place Order";
    }
  }
}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await supabase.auth.signOut();

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );
  }

  currentUser = null;
  currentProfile = null;

  closeApp();
  showMessage("");
}


/* =========================================================
   INITIALIZE APP
========================================================= */

async function initialize() {

  try {

    const {
      data,
      error
    } = await supabase.auth.getSession();

    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;
    }

    const session =
      data?.session;

    if (!session) {
      return;
    }

    const user =
      session.user;

    if (!user) {
      return;
    }

    if (!user.email_confirmed_at) {

      await supabase.auth.signOut();

      showMessage(
        "Please confirm your email before logging in."
      );

      return;
    }

    currentUser =
      user;

    const profile =
      await loadProfile();

    openApp(
      profile || {
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.display_name ||
          user.email?.split("@")[0] ||
          "Abba",

        email:
          user.email,

        wallet_balance:
          0
      }
    );

    await loadOrders();

  } catch (error) {

    console.error(
      "Initialization error:",
      error
    );
  }
}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

  supabase.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "Auth event:",
        event
      );

      if (event === "SIGNED_OUT") {

        currentUser = null;
        currentProfile = null;

        closeApp();

        return;
      }

      if (
        event === "PASSWORD_RECOVERY"
      ) {

        showMessage(
          "Password recovery link opened."
        );

        return;
      }

      if (
        event === "SIGNED_IN" &&
        session?.user
      ) {

        /*
          Delay database work until after
          the auth callback returns.
        */

        setTimeout(async () => {

          if (!session.user) {
            return;
          }

          if (
            !session.user.email_confirmed_at
          ) {

            showMessage(
              "Please confirm your email before continuing."
            );

            return;
          }

          currentUser =
            session.user;

          const profile =
            await loadProfile();

          openApp(
            profile || {
              full_name:
                session.user.user_metadata?.full_name ||
                session.user.user_metadata?.display_name ||
                session.user.email?.split("@")[0] ||
                "Abba",

              email:
                session.user.email,

              wallet_balance:
                0
            }
          );

          await loadOrders();

        }, 0);
      }
    }
  );
}


/* =========================================================
   DOM EVENT SETUP
========================================================= */

function setupEventListeners() {

  /* LOGIN / SIGN UP TABS */

  $$(".tab").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          $$(".tab").forEach(
            (tab) => {
              tab.classList.remove(
                "active"
              );
            }
          );

          button.classList.add(
            "active"
          );

          const isSignup =
            button.dataset.tab ===
            "signup";

          const loginBox =
            $("loginBox");

          const signupBox =
            $("signupBox");

          if (loginBox) {
            loginBox.classList.toggle(
              "hide",
              isSignup
            );
          }

          if (signupBox) {
            signupBox.classList.toggle(
              "hide",
              !isSignup
            );
          }

          showMessage("");
        }
      );
    }
  );


  /* LOGIN */

  $("login")?.addEventListener(
    "click",
    handleLogin
  );


  /* SIGN UP */

  $("signup")?.addEventListener(
    "click",
    handleSignup
  );


  /* FORGOT PASSWORD */

  $("forgot")?.addEventListener(
    "click",
    handleForgotPassword
  );


  /* NAVIGATION */

  $$("[data-page]").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;

          if (page) {
            showPage(page);
          }
        }
      );
    }
  );


  /* PLATFORM SELECTION */

  $$(".service[data-platform]").forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          selectedPlatform =
            button.dataset.platform;

          if ($("platform")) {
            $("platform").value =
              selectedPlatform;
          }

          if ($("orderTitle")) {
            $("orderTitle").textContent =
              selectedPlatform +
              " order";
          }

          updateServiceOptions(
            selectedPlatform
          );

          showPage("order");
        }
      );
    }
  );


  /* QUANTITY */

  $("quantity")?.addEventListener(
    "input",
    calculateTotal
  );


  /* SERVICE */

  $("service")?.addEventListener(
    "change",
    calculateTotal
  );


  /* PLACE ORDER */

  $("place")?.addEventListener(
    "click",
    handlePlaceOrder
  );


  /* LOGOUT */

  $("logout")?.addEventListener(
    "click",
    logout
  );

  $("logout2")?.addEventListener(
    "click",
    logout
  );
}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    if (!supabase) {

      console.error(
        "Supabase client was not found."
      );

      showMessage(
        "Supabase is not connected. Please check supabase.js."
      );

      return;
    }

    setupEventListeners();

    setupAuthListener();

    initialize();
  }
);
