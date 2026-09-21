// =========================
// BUYER LOGIN
// =========================

const buyerLoginForm =
    document.getElementById("buyerLoginForm");

const passwordInput =
    document.getElementById("password");

const showPasswordButton =
    document.getElementById("showPassword");


// Show / Hide Password

if (showPasswordButton && passwordInput) {

    showPasswordButton.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            showPasswordButton.textContent = "Hide";

        } else {

            passwordInput.type = "password";

            showPasswordButton.textContent = "Show";

        }

    });

}


// Login Form Validation

if (buyerLoginForm) {

    buyerLoginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            passwordInput.value.trim();


        if (email === "" || password === "") {

            alert("Please enter your email/phone and password.");

            return;

        }


        if (password.length < 6) {

            alert("Password must contain at least 6 characters.");

            return;

        }


        alert("Login successful! Welcome to Dharshini Mart");

        window.location.href = "home.html";

    });

}


// =========================
// SELLER LOGIN
// =========================

const sellerLoginForm =
    document.getElementById("sellerLoginForm");

const sellerPasswordInput =
    document.getElementById("sellerPassword");

const showSellerPasswordButton =
    document.getElementById("showSellerPassword");


if (showSellerPasswordButton && sellerPasswordInput) {

    showSellerPasswordButton.addEventListener("click", function () {

        if (sellerPasswordInput.type === "password") {

            sellerPasswordInput.type = "text";

            showSellerPasswordButton.textContent = "Hide";

        } else {

            sellerPasswordInput.type = "password";

            showSellerPasswordButton.textContent = "Show";

        }

    });

}


if (sellerLoginForm) {

    sellerLoginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("sellerEmail").value.trim();

        const password =
            sellerPasswordInput.value.trim();


        if (email === "" || password === "") {

            alert("Please enter your email/phone and password.");

            return;

        }


        if (password.length < 6) {

            alert("Password must contain at least 6 characters.");

            return;

        }


        alert("Seller login successful! Welcome to your store");

        window.location.href = "seller-dashboard.html";

    });

}


// =========================
// ADMIN LOGIN
// =========================

const adminLoginForm =
    document.getElementById("adminLoginForm");

const adminPasswordInput =
    document.getElementById("adminPassword");

const showAdminPasswordButton =
    document.getElementById("showAdminPassword");


if (showAdminPasswordButton && adminPasswordInput) {

    showAdminPasswordButton.addEventListener("click", function () {

        if (adminPasswordInput.type === "password") {

            adminPasswordInput.type = "text";

            showAdminPasswordButton.textContent = "Hide";

        } else {

            adminPasswordInput.type = "password";

            showAdminPasswordButton.textContent = "Show";

        }

    });

}


if (adminLoginForm) {

    adminLoginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const email =
            document.getElementById("adminEmail").value.trim();

        const password =
            adminPasswordInput.value.trim();


        if (email === "" || password === "") {

            alert("Please enter admin email and password.");

            return;

        }


        if (password.length < 6) {

            alert("Password must contain at least 6 characters.");

            return;

        }


        alert("Admin login successful! Welcome to control center");

        window.location.href = "admin-dashboard.html";

    });

}


// =========================
// PRODUCT SEARCH
// =========================

const productSearch =
    document.getElementById("productSearch");

const productCards =
    document.querySelectorAll(".product-card");


if (productSearch) {

    productSearch.addEventListener("input", function () {

        const searchText =
            productSearch.value.toLowerCase().trim();


        productCards.forEach(function (card) {

            const productName =
                card.querySelector("h3").textContent.toLowerCase();

            const category =
                card.querySelector(".product-category")
                .textContent.toLowerCase();


            if (
                productName.includes(searchText) ||
                category.includes(searchText)
            ) {

                card.style.display = "";

            } else {

                card.style.display = "none";

            }

        });

    });

}


// =========================
// CATEGORY FILTER
// =========================

const categoryCards =
    document.querySelectorAll(".category-card");


if (categoryCards.length > 0) {

    categoryCards.forEach(function (category) {

        category.addEventListener("click", function () {

            const selectedCategory =
                category.querySelector("h3")
                .textContent
                .toLowerCase();


            productCards.forEach(function (card) {

                const productCategory =
                    card.querySelector(".product-category")
                    .textContent
                    .toLowerCase();


                if (selectedCategory === productCategory) {

                    card.style.display = "";

                } else {

                    card.style.display = "none";

                }

            });

        });

    });

}


// =========================
// ADD TO CART
// =========================

const cartButtons =
    document.querySelectorAll(".cart-button");


if (cartButtons.length > 0) {

    cartButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const productCard =
                button.closest(".product-card");


            if (!productCard) {
                return;
            }


            const productName =
                productCard.querySelector("h3")
                .textContent;


            const productPrice =
                productCard.querySelector(".product-price")
                .textContent;


            let cart =
                JSON.parse(localStorage.getItem("cart")) || [];


            cart.push({

                name: productName,

                price: productPrice

            });


            localStorage.setItem(
                "cart",
                JSON.stringify(cart)
            );


            alert(
                productName +
                " added to cart! 🛒"
            );

        });

    });

}


// =========================
// CHECKOUT
// =========================

function checkoutCart() {

    const cart =
        JSON.parse(localStorage.getItem("cart")) || [];


    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }


    window.location.href = "checkout.html";

}


// =========================
// ADD TO WISHLIST
// =========================

const wishlistButtons =
    document.querySelectorAll(".wishlist-button");


if (wishlistButtons.length > 0) {

    wishlistButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const productCard =
                button.closest(".product-card");


            if (!productCard) {

                alert("Product not found.");

                return;

            }


            const productName =
                productCard.querySelector("h3")
                .textContent;


            const productPrice =
                productCard.querySelector(".product-price")
                .textContent;


            let wishlist =
                JSON.parse(localStorage.getItem("wishlist")) || [];


            wishlist.push({

                name: productName,

                price: productPrice

            });


            localStorage.setItem(
                "wishlist",
                JSON.stringify(wishlist)
            );


            alert(
                productName +
                " added to wishlist! ❤️"
            );

        });

    });

}