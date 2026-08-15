const AUTH_FUNCTION_URL ="https://bsywozoqkyjstsowbmel.supabase.co/functions/v1/auth-handler";

        const loginTab =
            document.getElementById("loginTab");

        const signupTab =
            document.getElementById("signupTab");

        const loginForm =
            document.getElementById("loginForm");

        const signupForm =
            document.getElementById("signupForm");

        const loginMessage =
            document.getElementById("loginMessage");

        const signupMessage =
            document.getElementById("signupMessage");

        const loginBtn =
            document.getElementById("loginBtn");

        const signupBtn =
            document.getElementById("signupBtn");

        function showMessage(element, message, type) {
            element.textContent = message;
            element.className = `message ${type}`;
        }

        function clearMessage(element) {
            element.textContent = "";
            element.className = "message";
        }

        function showLogin() {
            loginTab.classList.add("active");
            signupTab.classList.remove("active");

            loginForm.classList.add("active");
            signupForm.classList.remove("active");

            clearMessage(signupMessage);
        }

        function showSignup() {
            signupTab.classList.add("active");
            loginTab.classList.remove("active");

            signupForm.classList.add("active");
            loginForm.classList.remove("active");

            clearMessage(loginMessage);
        }

        async function sendAuthRequest(body) {
            const response = await fetch(
                AUTH_FUNCTION_URL,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(body)
                }
            );

            const result = await response.json();

            return {
                response,
                result
            };
        }

        loginTab.addEventListener("click", showLogin);
        signupTab.addEventListener("click", showSignup);

        signupForm.addEventListener(
            "submit",
            async function(event) {
                event.preventDefault();

                clearMessage(signupMessage);

                const firstName =
                    document.getElementById("firstName")
                        .value.trim();

                const lastName =
                    document.getElementById("lastName")
                        .value.trim();

                const email =
                    document.getElementById("signupEmail")
                        .value.trim();

                const phone =
                    document.getElementById("phone")
                        .value.trim();

                const password =
                    document.getElementById("signupPassword")
                        .value;

                signupBtn.disabled = true;
                signupBtn.textContent = "Creating Account...";

                try {
                    const { response, result } =
                        await sendAuthRequest({
                            action: "signup",
                            first_name: firstName,
                            last_name: lastName,
                            email: email,
                            phone: phone,
                            password: password
                        });

                    if (!response.ok) {
                        showMessage(
                            signupMessage,
                            result.error ||
                            "Unable to create account.",
                            "error"
                        );
                        return;
                    }

                    showMessage(
                        signupMessage,
                        result.message ||
                        "Signup successful. Please log in.",
                        "success"
                    );

                    signupForm.reset();

                    setTimeout(() => {
                        showLogin();
                        document.getElementById(
                            "loginEmail"
                        ).value = email;
                    }, 1200);
                } catch (error) {
                    console.error(error);

                    showMessage(
                        signupMessage,
                        "Unable to connect to the authentication server.",
                        "error"
                    );
                } finally {
                    signupBtn.disabled = false;
                    signupBtn.textContent = "Create Account";
                }
            }
        );

        loginForm.addEventListener(
            "submit",
            async function(event) {
                event.preventDefault();

                clearMessage(loginMessage);

                const email =
                    document.getElementById("loginEmail")
                        .value.trim();

                const password =
                    document.getElementById("loginPassword")
                        .value;

                loginBtn.disabled = true;
                loginBtn.textContent = "Logging In...";

                try {
                    const { response, result } =
                        await sendAuthRequest({
                            action: "login",
                            email: email,
                            password: password
                        });

                    if (!response.ok) {
                        showMessage(
                            loginMessage,
                            result.error ||
                            "Unable to log in.",
                            "error"
                        );
                        return;
                    }

                    if (
                        !result.session?.access_token
                    ) {
                        showMessage(
                            loginMessage,
                            "Login succeeded, but no session token was returned.",
                            "error"
                        );
                        return;
                    }

                    sessionStorage.setItem(
                        "qc_token",
                        result.session.access_token
                    );

                    window.location.href =
                        "dashboard.html";
                } catch (error) {
                    console.error(error);

                    showMessage(
                        loginMessage,
                        "Unable to connect to the authentication server.",
                        "error"
                    );
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.textContent = "Login";
                }
            }
        );

        if (sessionStorage.getItem("qc_token")) {
            window.location.href = "dashboard.html";
        }