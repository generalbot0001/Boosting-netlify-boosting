"use strict";

const supabase = window.supabaseClient;

if (!supabase) {
    console.error("Supabase client was not loaded.");
    alert("Supabase failed to load. Please refresh the page.");
}

/* =========================================================
   REAL ABBA BOOSTING
   SUPABASE AUTH + DASHBOARD
   ========================================================= */

const SERVICES = {
    "TikTok Followers": {
        platform: "TikTok",
        price: 6000
    },
    "TikTok Likes": {
        platform: "TikTok",
        price: 1000
    },
    "TikTok Views": {
        platform: "TikTok",
        price: 400
    },

    "Instagram Followers": {
        platform: "Instagram",
        price: 5500
    },
    "Instagram Likes": {
        platform: "Instagram",
        price: 800
    },
    "Instagram Views": {
        platform: "Instagram",
        price: 300
    },

    "YouTube Subscribers": {
        platform: "YouTube",
        price: 65000
    },
    "YouTube Views": {
        platform: "YouTube",
        price: 2500
    },

    "Facebook Followers": {
        platform: "Facebook",
        price: 5300
    },

    "Telegram Members": {
        platform: "Telegram",
        price: 5000
    }
};

let currentUser = null;
let selectedService = "";


/* =========================================================
   HELPERS
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function show(id) {
    const element = $(id);
    if (element) element.style.display = "";
}

function hide(id) {
    const element = $(id);
    if (element) element.style.display = "none";
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatNaira(amount) {
    return "₦" + Number(amount || 0).toLocaleString("en-NG");
}

function getName(user) {
    return (
        user?.user_metadata?.full_name ||
        user?.user_metadata?.display_name ||
        user?.email?.split("@")[0] ||
        "Creator"
    );
}

function getEmail(user) {
    return user?.email || "";
}

function toast(message, type = "info") {
    let box = $("toast");

    if (!box) {
        box = document.createElement("div");
        box.id = "toast";

        box.style.position = "fixed";
        box.style.left = "50%";
        box.style.bottom = "90px";
        box.style.transform = "translateX(-50%)";
        box.style.zIndex = "99999";
        box.style.padding = "13px 18px";
        box.style.borderRadius = "12px";
        box.style.fontWeight = "700";
        box.style.maxWidth = "90%";
        box.style.textAlign = "center";

        document.body.appendChild(box);
    }

    box.textContent = message;

    if (type === "error") {
        box.style.background = "#ff3b30";
        box.style.color = "#fff";
    } else if (type === "success") {
        box.style.background = "#16a34a";
        box.style.color = "#fff";
    } else {
        box.style.background = "#0891b2";
        box.style.color = "#fff";
    }

    clearTimeout(window.__toastTimer);

    window.__toastTimer = setTimeout(() => {
        box.style.display = "none";
    }, 3500);

    box.style.display = "block";
}


/* =========================================================
   AUTH SCREENS
   ========================================================= */

function showAuth() {
    show("authScreen");
    hide("appScreen");
    hide("verificationScreen");
}

function showDashboard() {
    hide("authScreen");
    hide("verificationScreen");
    show("appScreen");

    updateAccountInformation();
    showPage("home");
}

function showVerification(email) {
    hide("authScreen");
    hide("appScreen");
    show("verificationScreen");

    setText("verificationEmail", email || "");

    const message = $("verificationMessage");

    if (message) {
        message.textContent =
            "We sent a confirmation link to " +
            (email || "your email") +
            ". Open your email and click the confirmation link.";
    }
}


/* =========================================================
   LOGIN / SIGNUP TABS
   ========================================================= */

function showLoginForm() {
    show("loginForm");
    hide("signupForm");

    const loginTab = $("loginTab");
    const signupTab = $("signupTab");

    if (loginTab) loginTab.classList.add("active");
    if (signupTab) signupTab.classList.remove("active");
}

function showSignupForm() {
    hide("loginForm");
    show("signupForm");

    const loginTab = $("loginTab");
    const signupTab = $("signupTab");

    if (loginTab) loginTab.classList.remove("active");
    if (signupTab) signupTab.classList.add("active");
}


/* =========================================================
   SIGN UP
   ========================================================= */

async function signupUser(event) {
    if (event) event.preventDefault();

    const name = $("signupName")?.value.trim();
    const email = $("signupEmail")?.value.trim();
    const password = $("signupPassword")?.value || "";
    const confirm = $("signupConfirm")?.value || "";

    if (!name) {
        toast("Please enter your name.", "error");
        return;
    }

    if (!email) {
        toast("Please enter your email.", "error");
        return;
    }

    if (password.length < 6) {
        toast("Password must be at least 6 characters.", "error");
        return;
    }

    if (password !== confirm) {
        toast("Passwords do not match.", "error");
        return;
    }

    const button =
        $("signupButton") ||
        $("signupBtn") ||
        document.querySelector('#signupForm button[type="submit"]');

    const originalText = button?.textContent;

    if (button) {
        button.disabled = true;
        button.textContent = "Creating Account...";
    }

    try {
        const redirectUrl =
            window.location.origin + window.location.pathname;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,

            options: {
                emailRedirectTo: redirectUrl,

                data: {
                    full_name: name,
                    display_name: name
                }
            }
        });

        if (error) {
            console.error("Signup error:", error);
            toast(error.message, "error");
            return;
        }

        currentUser = data.user;

        /*
         * When email confirmation is enabled, Supabase normally
         * returns a user but NO active session.
         *
         * That is correct.
         *
         * We must show the verification screen instead of
         * sending the user back to login.
         */

        if (!data.session) {
            showVerification(email);
            toast(
                "Account created. Check your email to confirm it.",
                "success"
            );
        } else {
            showDashboard();
            toast("Account created successfully.", "success");
        }

    } catch (error) {
        console.error(error);
        toast(
            error?.message || "Something went wrong while creating your account.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || "Create Account";
        }
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(event) {
    if (event) event.preventDefault();

    const email = $("loginEmail")?.value.trim();
    const password = $("loginPassword")?.value || "";

    if (!email || !password) {
        toast("Enter your email and password.", "error");
        return;
    }

    const button =
        $("loginButton") ||
        $("loginBtn") ||
        document.querySelector('#loginForm button[type="submit"]');

    const originalText = button?.textContent;

    if (button) {
        button.disabled = true;
        button.textContent = "Logging in...";
    }

    try {
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            console.error("Login error:", error);

            /*
             * If email confirmation has not been completed,
             * Supabase usually returns:
             * "Email not confirmed"
             */
            if (
                error.message &&
                error.message.toLowerCase().includes("email not confirmed")
            ) {
                showVerification(email);
                toast(
                    "Please confirm your email before logging in.",
                    "error"
                );
            } else {
                toast(error.message, "error");
            }

            return;
        }

        currentUser = data.user;

        if (!currentUser?.email_confirmed_at) {
            showVerification(email);
            toast(
                "Please confirm your email before continuing.",
                "error"
            );
            return;
        }

        showDashboard();
        toast("Welcome back!", "success");

    } catch (error) {
        console.error(error);
        toast(
            error?.message || "Unable to log in.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || "Login";
        }
    }
}


/* =========================================================
   CHECK EMAIL VERIFICATION
   ========================================================= */

async function checkVerification() {
    try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            toast(
                "Your email is not confirmed yet. Open the confirmation email first.",
                "error"
            );
            return;
        }

        currentUser = data.user;

        if (!currentUser.email_confirmed_at) {
            toast(
                "Email is not confirmed yet. Please click the link in your email.",
                "error"
            );
            return;
        }

        showDashboard();
        toast("Email confirmed successfully!", "success");

    } catch (error) {
        console.error(error);
        toast(
            "Could not check your verification status.",
            "error"
        );
    }
}


/* =========================================================
   RESEND CONFIRMATION EMAIL
   ========================================================= */

async function resendVerification() {
    const email =
        $("verificationEmail")?.textContent?.trim() ||
        $("signupEmail")?.value.trim() ||
        $("loginEmail")?.value.trim();

    if (!email) {
        toast("Email address not found.", "error");
        return;
    }

    try {
        const { error } = await supabase.auth.resend({
            type: "signup",
            email: email
        });

        if (error) {
            console.error(error);
            toast(error.message, "error");
            return;
        }

        toast(
            "A new confirmation email has been sent.",
            "success"
        );

    } catch (error) {
        console.error(error);
        toast(
            "Unable to resend the confirmation email.",
            "error"
        );
    }
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function forgotPassword() {
    const email = $("loginEmail")?.value.trim();

    if (!email) {
        toast(
            "Enter your email address first.",
            "error"
        );
        return;
    }

    try {
        const redirectUrl =
            window.location.origin +
            window.location.pathname +
            "?reset=1";

        const { error } =
            await supabase.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: redirectUrl
                }
            );

        if (error) {
            toast(error.message, "error");
            return;
        }

        toast(
            "Password reset email sent. Check your inbox.",
            "success"
        );

    } catch (error) {
        console.error(error);
        toast(
            "Unable to send the password reset email.",
            "error"
        );
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser() {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error(error);
    }

    currentUser = null;
    showAuth();
    showLoginForm();

    toast("You have been logged out.", "success");
}


/* =========================================================
   ACCOUNT INFORMATION
   ========================================================= */

function updateAccountInformation() {
    if (!currentUser) return;

    const name = getName(currentUser);
    const email = getEmail(currentUser);

    setText("welcomeName", name);
    setText("accountName", name);
    setText("accountEmail", email);
    setText("accountEmail2", email);

    const accountName = $("accountName");

    if (accountName && "value" in accountName) {
        accountName.value = name;
    }

    const accountEmail = $("accountEmail");

    if (accountEmail && "value" in accountEmail) {
        accountEmail.value = email;
    }

    const accountEmail2 = $("accountEmail2");

    if (accountEmail2 && "value" in accountEmail2) {
        accountEmail2.value = email;
    }
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageName) {
    document
        .querySelectorAll(".app-page")
        .forEach(page => {
            page.style.display = "none";
        });

    const page =
        $("page-" + pageName) ||
        $("page" + pageName);

    if (page) {
        page.style.display = "";
    }

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");

            if (
                item.dataset.page === pageName ||
                item.getAttribute("data-page") === pageName
            ) {
                item.classList.add("active");
            }
        });

    if (pageName === "orders") {
        loadOrders();
    }

    if (pageName === "order") {
        updateOrderPrice();
    }
}


/* =========================================================
   SERVICES
   ========================================================= */

function selectPlatform(platform) {
    const serviceSelect = $("serviceType");

    if (!serviceSelect) return;

    const options = Object.entries(SERVICES)
        .filter(([, service]) => service.platform === platform)
        .map(([name]) => name);

    serviceSelect.innerHTML =
        '<option value="">Select a service</option>';

    options.forEach(name => {
        const option = document.createElement("option");

        option.value = name;
        option.textContent =
            name +
            " — " +
            formatNaira(SERVICES[name].price) +
            " / 1,000";

        serviceSelect.appendChild(option);
    });

    serviceSelect.value = "";

    showPage("order");
}

function selectService(serviceName) {
    selectedService = serviceName;

    const service = SERVICES[serviceName];

    if (!service) return;

    const serviceSelect = $("serviceType");

    if (serviceSelect) {
        serviceSelect.value = serviceName;
    }

    showPage("order");
    updateOrderPrice();
}


/* =========================================================
   ORDER PRICE
   ========================================================= */

function getQuantity() {
    const input = $("orderQuantity");

    const quantity = Number(input?.value || 0);

    if (!Number.isFinite(quantity) || quantity < 0) {
        return 0;
    }

    return Math.floor(quantity);
}

function updateOrderPrice() {
    const serviceName =
        $("serviceType")?.value ||
        selectedService;

    const quantity = getQuantity();

    const service = SERVICES[serviceName];

    const total =
        service
            ? (quantity / 1000) * service.price
            : 0;

    setText("orderTotal", formatNaira(total));
    setText("totalPrice", formatNaira(total));

    const totalInput = $("orderTotalInput");

    if (totalInput) {
        totalInput.value = total.toFixed(2);
    }

    return total;
}


/* =========================================================
   SUBMIT ORDER
   ========================================================= */

async function submitOrder(event) {
    if (event) event.preventDefault();

    if (!currentUser) {
        toast("Please log in first.", "error");
        return;
    }

    const serviceName = $("serviceType")?.value;
    const quantity = getQuantity();
    const link = $("orderLink")?.value.trim() || "";
    const message = $("orderMessage")?.value.trim() || "";

    if (!serviceName) {
        toast("Select a service.", "error");
        return;
    }

    if (quantity < 1) {
        toast("Enter a valid quantity.", "error");
        return;
    }

    if (!link) {
        toast("Enter the link to your account/post.", "error");
        return;
    }

    const service = SERVICES[serviceName];

    if (!service) {
        toast("Invalid service selected.", "error");
        return;
    }

    const total = (quantity / 1000) * service.price;

    const button =
        $("placeOrderButton") ||
        $("submitOrderButton") ||
        document.querySelector('#orderForm button[type="submit"]');

    const originalText = button?.textContent;

    if (button) {
        button.disabled = true;
        button.textContent = "Submitting...";
    }

    try {
        /*
         * This uses a flexible order payload.
         * Your Supabase orders table should contain these fields.
         */

        const order = {
            user_id: currentUser.id,
            email: currentUser.email,
            name: getName(currentUser),

            platform: service.platform,
            service: serviceName,

            quantity: quantity,
            link: link,
            message: message,

            amount: total,
            total: total,

            status: "pending",
            admin_note: ""
        };

        const { data, error } =
            await supabase
                .from("orders")
                .insert(order)
                .select()
                .single();

        if (error) {
            console.error("Order error:", error);

            toast(
                "Order could not be submitted: " +
                error.message,
                "error"
            );

            return;
        }

        console.log("Order created:", data);

        toast(
            "Order submitted successfully!",
            "success"
        );

        if ($("orderForm")) {
            $("orderForm").reset();
        }

        selectedService = "";

        updateOrderPrice();

        showPage("orders");

    } catch (error) {
        console.error(error);

        toast(
            "Something went wrong while submitting the order.",
            "error"
        );
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                originalText || "Place Order";
        }
    }
}


/* =========================================================
   LOAD ORDERS
   ========================================================= */

async function loadOrders() {
    const container =
        $("ordersList") ||
        $("ordersContainer");

    if (!container || !currentUser) return;

    container.innerHTML =
        '<div class="loading">Loading your orders...</div>';

    try {
        const { data, error } =
            await supabase
                .from("orders")
                .select("*")
                .eq("user_id", currentUser.id)
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            console.error("Orders error:", error);

            container.innerHTML =
                '<div class="empty-state">' +
                escapeHTML(error.message) +
                "</div>";

            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML =
                '<div class="empty-state">' +
                "You have no orders yet." +
                "</div>";

            return;
        }

        container.innerHTML = data
            .map(order => {
                const status =
                    order.status || "pending";

                const amount =
                    order.amount ??
                    order.total ??
                    0;

                const service =
                    order.service || "Service";

                const quantity =
                    order.quantity || 0;

                const link =
                    order.link || "";

                const note =
                    order.admin_note ||
                    order.adminNote ||
                    "";

                return `
                    <div class="order-card">

                        <div class="order-card-top">
                            <strong>
                                ${escapeHTML(service)}
                            </strong>

                            <span class="order-status ${escapeHTML(status)}">
                                ${escapeHTML(
                                    String(status).toUpperCase()
                                )}
                            </span>
                        </div>

                        <div class="order-info">
                            <div>
                                Quantity:
                                <strong>
                                    ${Number(quantity).toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                Amount:
                                <strong>
                                    ${formatNaira(amount)}
                                </strong>
                            </div>

                            <div>
                                Link:
                                <a
                                    href="${escapeHTML(link)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open
                                </a>
                            </div>

                            ${
                                note
                                    ? `
                                        <div class="admin-note">
                                            <strong>Admin note:</strong>
                                            ${escapeHTML(note)}
                                        </div>
                                    `
                                    : ""
                            }
                        </div>

                    </div>
                `;
            })
            .join("");

    } catch (error) {
        console.error(error);

        container.innerHTML =
            '<div class="empty-state">Unable to load orders.</div>';
    }
}


/* =========================================================
   AUTH STATE
   ========================================================= */

async function initializeAuth() {
    try {
        const { data } =
            await supabase.auth.getSession();

        const session = data?.session;

        if (!session?.user) {
            showAuth();
            return;
        }

        const { data: userData } =
            await supabase.auth.getUser();

        currentUser = userData?.user || session.user;

        if (!currentUser.email_confirmed_at) {
            showVerification(currentUser.email);
            return;
        }

        showDashboard();

    } catch (error) {
        console.error("Auth initialization error:", error);
        showAuth();
    }
}


/* =========================================================
   SUPABASE AUTH LISTENER
   ========================================================= */

supabase?.auth.onAuthStateChange(
    async (event, session) => {

        console.log("Auth event:", event);

        if (
            event === "SIGNED_IN" &&
            session?.user
        ) {
            currentUser = session.user;

            if (currentUser.email_confirmed_at) {
                showDashboard();
            } else {
                showVerification(currentUser.email);
            }
        }

        if (event === "SIGNED_OUT") {
            currentUser = null;
            showAuth();
        }

        if (event === "PASSWORD_RECOVERY") {
            console.log("Password recovery started.");
        }
    }
);


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* Login/signup tabs */

    $("loginTab")?.addEventListener(
        "click",
        showLoginForm
    );

    $("signupTab")?.addEventListener(
        "click",
        showSignupForm
    );


    /* Forms */

    $("loginForm")?.addEventListener(
        "submit",
        loginUser
    );

    $("signupForm")?.addEventListener(
        "submit",
        signupUser
    );

    $("orderForm")?.addEventListener(
        "submit",
        submitOrder
    );


    /* Verification */

    $("checkVerificationBtn")?.addEventListener(
        "click",
        checkVerification
    );

    $("resendVerificationBtn")?.addEventListener(
        "click",
        resendVerification
    );

    $("verificationLogoutBtn")?.addEventListener(
        "click",
        logoutUser
    );


    /* Forgot password */

    $("forgotPasswordBtn")?.addEventListener(
        "click",
        forgotPassword
    );


    /* Logout buttons */

    $("logoutBtn")?.addEventListener(
        "click",
        logoutUser
    );

    $("logoutButton")?.addEventListener(
        "click",
        logoutUser
    );


    /* Order quantity */

    $("orderQuantity")?.addEventListener(
        "input",
        updateOrderPrice
    );

    $("serviceType")?.addEventListener(
        "change",
        () => {
            selectedService =
                $("serviceType").value;

            updateOrderPrice();
        }
    );


    /* Navigation */

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.addEventListener(
                "click",
                () => {

                    const page =
                        item.dataset.page;

                    if (page) {
                        showPage(page);
                    }
                }
            );
        });


    /*
     * Make service cards work automatically
     * when they contain data-service.
     */

    document
        .querySelectorAll("[data-service]")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const service =
                        card.dataset.service;

                    if (
                        SERVICES[service]
                    ) {
                        selectService(service);
                    }
                }
            );
        });


    /*
     * Platform buttons.
     */

    document
        .querySelectorAll("[data-platform]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {
                    selectPlatform(
                        button.dataset.platform
                    );
                }
            );
        });


    initializeAuth();
});


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.showPage = showPage;
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;

window.signupUser = signupUser;
window.loginUser = loginUser;

window.checkVerification =
    checkVerification;

window.resendVerification =
    resendVerification;

window.logoutUser =
    logoutUser;

window.forgotPassword =
    forgotPassword;

window.selectPlatform =
    selectPlatform;

window.selectService =
    selectService;

window.updateOrderPrice =
    updateOrderPrice;

window.submitOrder =
    submitOrder;

window.loadOrders =
    loadOrders;
