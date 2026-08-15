import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("AUTH HANDLER VERSION: SIGNUP LOGIN CODE 2026-08-15");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const supabaseUrl = Deno.env.get("PROJECT_URL");
const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is incomplete.");
}

const supabase = createClient(
    supabaseUrl,
    serviceRoleKey
);

function jsonResponse(
    data: Record<string, unknown>,
    status = 200
) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        }
    );
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    if (req.method !== "POST") {
        return jsonResponse(
            {
                error: "Method not allowed."
            },
            405
        );
    }

    try {
        const contentLength = req.headers.get("content-length");

        if (
            contentLength &&
            Number(contentLength) > 8192
        ) {
            return jsonResponse(
                {
                    error:
                        "Request body is too large. Maximum allowed size is 8KB."
                },
                413
            );
        }

        const body = await req.json();
        const action = body.action;

        if (action === "signup") {
            const firstName = body.first_name?.trim();
            const lastName = body.last_name?.trim();
            const phone = body.phone?.trim();
            const email = body.email?.trim().toLowerCase();
            const password = body.password;

            if (!firstName) {
                return jsonResponse(
                    {
                        error: "First name is required for signup."
                    },
                    400
                );
            }

            if (!/^[A-Za-z ]+$/.test(firstName)) {
                return jsonResponse(
                    {
                        error:
                            "First name must contain only letters and spaces."
                    },
                    400
                );
            }

            if (!lastName) {
                return jsonResponse(
                    {
                        error: "Last name is required for signup."
                    },
                    400
                );
            }

            if (!/^[A-Za-z ]+$/.test(lastName)) {
                return jsonResponse(
                    {
                        error:
                            "Last name must contain only letters and spaces."
                    },
                    400
                );
            }

            if (!phone) {
                return jsonResponse(
                    {
                        error: "Phone number is required for signup."
                    },
                    400
                );
            }

            if (!/^0\d+$/.test(phone)) {
                return jsonResponse(
                    {
                        error:
                            "Phone number must start with 0 and contain only digits."
                    },
                    400
                );
            }

            if (!email) {
                return jsonResponse(
                    {
                        error: "Email is required for signup."
                    },
                    400
                );
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return jsonResponse(
                    {
                        error:
                            "Please provide a valid email address."
                    },
                    400
                );
            }

            if (!password) {
                return jsonResponse(
                    {
                        error: "Password is required for signup."
                    },
                    400
                );
            }

            const {
                data,
                error
            } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (error) {
                console.error(
                    "User creation error:",
                    error
                );

                return jsonResponse(
                    {
                        error: error.message
                    },
                    400
                );
            }

            if (!data.user) {
                return jsonResponse(
                    {
                        error:
                            "User account could not be created."
                    },
                    500
                );
            }

            const {
                error: profileError
            } = await supabase
                .from("profiles")
                .insert({
                    id: data.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    phone
                });

            if (profileError) {
                console.error(
                    "Profile insert error:",
                    profileError
                );

                return jsonResponse(
                    {
                        error:
                            "User account was created, but the profile could not be created."
                    },
                    500
                );
            }

            return jsonResponse(
                {
                    message:
                        "Signup successful. Please log in."
                },
                201
            );
        }

        if (action === "login") {
            const email = body.email?.trim().toLowerCase();
            const password = body.password;

            if (!email) {
                return jsonResponse(
                    {
                        error: "Email is required for login."
                    },
                    400
                );
            }

            if (!password) {
                return jsonResponse(
                    {
                        error: "Password is required for login."
                    },
                    400
                );
            }

            const {
                data: lockout,
                error: lockoutCheckError
            } = await supabase
                .from("account_lockouts")
                .select(
                    "locked_until, lockout_type"
                )
                .eq("email", email)
                .maybeSingle();

            if (lockoutCheckError) {
                console.error(
                    "Lockout check error:",
                    lockoutCheckError
                );

                return jsonResponse(
                    {
                        error:
                            "Unable to check account lockout status."
                    },
                    500
                );
            }

            if (lockout) {
                const lockedUntil =
                    new Date(lockout.locked_until);

                if (lockedUntil > new Date()) {
                    const minutes = Math.ceil(
                        (
                            lockedUntil.getTime() -
                            Date.now()
                        ) / 60000
                    );

                    return jsonResponse(
                        {
                            error:
                                `Account is locked. Please try again in ${minutes} minute(s).`
                        },
                        429
                    );
                }

                await supabase
                    .from("account_lockouts")
                    .delete()
                    .eq("email", email);
            }

            const tenMinutesAgo =
                new Date(
                    Date.now() -
                    10 * 60 * 1000
                ).toISOString();

            const {
                count: failedCount,
                error: countError
            } = await supabase
                .from("login_attempts")
                .select("*", {
                    count: "exact",
                    head: true
                })
                .eq("email", email)
                .eq("success", false)
                .gte(
                    "attempted_at",
                    tenMinutesAgo
                );

            if (countError) {
                console.error(
                    "Failed attempt count error:",
                    countError
                );

                return jsonResponse(
                    {
                        error:
                            "Unable to check login attempts."
                    },
                    500
                );
            }

            const {
                data: loginData,
                error: loginError
            } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (loginError) {
                await supabase
                    .from("login_attempts")
                    .insert({
                        email,
                        success: false
                    });

                if ((failedCount ?? 0) >= 2) {
                    const shortLockout =
                        new Date(
                            Date.now() +
                            10 * 60 * 1000
                        ).toISOString();

                    await supabase
                        .from("account_lockouts")
                        .upsert(
                            {
                                email,
                                locked_until:
                                    shortLockout,
                                lockout_type:
                                    "short"
                            },
                            {
                                onConflict: "email"
                            }
                        );

                    return jsonResponse(
                        {
                            error:
                                "Too many failed login attempts. Your account has been locked for 10 minutes."
                        },
                        429
                    );
                }

                return jsonResponse(
                    {
                        error:
                            "Invalid email or password."
                    },
                    401
                );
            }

            await supabase
                .from("login_attempts")
                .insert({
                    email,
                    success: true
                });

            await supabase
                .from("account_lockouts")
                .delete()
                .eq("email", email);

            return jsonResponse(
                {
                    message: "Login successful.",
                    user: loginData.user,
                    session: loginData.session
                },
                200
            );
        }

        return jsonResponse(
            {
                error:
                    "Invalid action. Use signup or login."
            },
            400
        );
    } catch (error) {
        console.error(
            "Auth handler error:",
            error
        );

        if (error instanceof SyntaxError) {
            return jsonResponse(
                {
                    error: "Invalid JSON body."
                },
                400
            );
        }

        return jsonResponse(
            {
                error:
                    "An error occurred processing your request."
            },
            500
        );
    }
});