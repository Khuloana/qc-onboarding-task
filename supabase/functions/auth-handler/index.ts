import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

Deno.serve(async (req) => {
    if(req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }
    try{
        const contentLength = req.headers.get("content-length");

        if(contentLength && Number(contentLength) > 8192) {
            return new Response(
                JSON.stringify({
                    error: "Request body is too large. Maximum allowed size is 8KB.",
                }),
                {
                    status: 413,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }

        const body = await req.json();
        const action = body.action;

        if(action === "signup") {

            const firstName = body.first_name?.trim();

            if (!firstName) {
                return new Response(
                    JSON.stringify({
                        error: "First name is required for signup.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            if(!/^[A-Za-z ]+$/.test(firstName)) {
                return new Response(
                    JSON.stringify({
                        error: "First name must contain only letters and spaces.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const lastName = body.last_name?.trim();

            if (!lastName) {
                return new Response(
                    JSON.stringify({
                        error: "Last name is required for signup.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            if(!/^[A-Za-z ]+$/.test(lastName)) {
                return new Response(
                    JSON.stringify({
                        error: "Last name must contain only letters and spaces.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const phone = body.phone?.trim();

            if (!phone) {
                return new Response(
                    JSON.stringify({
                        error: "Phone number is required for signup.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            if(!/^0\d+$/.test(phone)) {
                return new Response(
                    JSON.stringify({
                        error: "Phone number must start with 0 and contain only digits.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const email = body.email?.trim();

            if (!email) {
                return new Response(
                    JSON.stringify({
                        error: "Email is required for signup.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return new Response(
                    JSON.stringify({
                        error: "Please provide a valid email address.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const password = body.password;

            if (!password) {
                return new Response(
                    JSON.stringify({
                        error: "Password is required for signup.",
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const {data, error} = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
            });

            if (error) {
                return new Response(
                    JSON.stringify({
                        error: error.message,
                    }),
                    {
                        status: 400,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const user = data.user;

            if (!user) {
                return new Response(
                    JSON.stringify({
                        error: "User account could not be created.",
                    }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: user.id,
                first_name: firstName,
                last_name: lastName,
                phone: phone,
            });

            if (profileError) {
                return new Response(
                    JSON.stringify({
                        error: "User account created, but the profile could not be created.",
                    }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            return new Response(
                JSON.stringify({
                    message: "Signup successful. Please log in.",
                }),
                {
                    status: 201,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );
        }
    

            if(action === "login") {
                const email = body.email?.trim().toLowerCase();

                if (!email) {
                    return new Response(
                        JSON.stringify({
                            error: "Email is required for login.",
                        }),
                        {
                            status: 400,
                            headers: {
                                ...corsHeaders,
                                "Content-Type": "application/json",
                            },
                        },
                    );
                }
            }

            const {data: lockout, error: lockoutError} = await supabase
            .from("account_lockouts")
            .select("locked_until, lockout_type")
            .eq("email", email)
            .gt("lockout_unti", new Date().toISOString())
            .maybeSingle();

            if (lockoutError) {
                return new Response(
                    JSON.stringify({
                        error: "Unable to check lockout status.",
                    }),
                    {
                        status: 500,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }

            if (lockout) {
                const lockoutUntil = new Date(lockout.lockout_until);
                const now = new Date();

                const remainingMilliseconds =
                    lockoutUntil.getTime() - now.getTime();
                
                const remainingMinutes = Math.ceil(remainingMilliseconds / 60000,

                );

                return new Response(
                    JSON.stringify({
                        error: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
                    }),
                    {
                        status: 429,
                        headers: {
                            ...corsHeaders,
                            "Content-Type": "application/json",
                        },
                    },
                );
            }
            
            return new Response(
                JSON.stringify({
                    message: "No active lockout found.",
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                },
            );

        return new Response(
            JSON.stringify({
                error: "Invalid action. Use signup or login.",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                error: "Invalid JSON body.",
            }),
            {
                status: 400,
                headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                },
            },
        );
        
    }
});