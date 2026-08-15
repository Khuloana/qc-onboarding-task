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
    serviceRoleKey,
);

function jsonResponse(
    data: Record<string, unknown>,
    status = 200,
) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
            },
        },
    );
}

const APPROVED_INSTITUTIONS = [
// Traditional Universities
'University of Cape Town (UCT)',
'University of the Witwatersrand (Wits)',
'University of Pretoria (UP)',
'Stellenbosch University (SU)',
'University of Johannesburg (UJ)',
'University of KwaZulu-Natal (UKZN)',
'University of the Free State (UFS)',
'Nelson Mandela University (NMU)',
'Rhodes University (RU)',
'University of the Western Cape (UWC)',
'University of Limpopo (UL)',
'University of Zululand (UniZulu)',
'Walter Sisulu University (WSU)',
'University of Fort Hare (UFH)',
'University of Venda (Univen)',
'North-West University (NWU)',
'University of South Africa (UNISA)',
'University of Mpumalanga (UMP)',
'Sol Plaatje University (SPU)',
// Universities of Technology
'Tshwane University of Technology (TUT)',
'Cape Peninsula University of Technology (CPUT)',
'Durban University of Technology (DUT)',
'Vaal University of Technology (VUT)',
'Central University of Technology (CUT)',
'Mangosuthu University of Technology (MUT)',
// TVET & Other
'Ekurhuleni East TVET College',
'Tshwane North TVET College',
'Sedibeng TVET College',
'Motheo TVET College',
'Boland TVET College',
'False Bay TVET College',
'Coastal KZN TVET College',
'Umgungundlovu TVET College',
];

async function authenticateUser(req: Request) {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
        return {
            user: null,
            error: "Authorization header is required.",
        };
    }

    if (!authorization.startsWith("Bearer ")) {
        return {
            user: null,
            error: "Invalid Authorization header.",
        };
    }

    const token = authorization.substring(7).trim();

    if (!token) {
        return {
            user: null,
            error: "Authentication token is required.",
        };
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return {
            user: null,
            error: "Invalid or expired authentication token.",
        };
    }

    return {
        user: data.user,
        error: null,
    };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    try {
        if (req.method !== "POST") {
            return jsonResponse(
                {
                    error: "Method not allowed.",
                },
                405,
            );
        }

        const {
            user,
            error: authError,
        } = await authenticateUser(req);

        if (authError || !user) {
            return jsonResponse(
                {
                    error: authError ?? "Authentication failed.",
                },
                401,
            );
        }

        const contentLength = req.headers.get("content-length");

        if (contentLength && Number(contentLength) > 8192) {
            return jsonResponse(
                {
                    error:
                        "Request body is too large. Maximum allowed size is 8KB.",
                },
                413,
            );
        }

        const body = await req.json();
        const action = body.action;

        if (action === "add") {
            const institution = body.institution?.trim();
            const course = body.course?.trim();
            const academicYear = body.academic_year;
            const status = body.status;
            const notes = body.notes?.trim() || null;

            if (!institution) {
                return jsonResponse(
                    {
                        error: "Institution is required.",
                    },
                    400,
                );
            }

            if (!APPROVED_INSTITUTIONS.includes(institution)) {
                return jsonResponse(
                    {
                        error: "Please select an approved institution.",
                    },
                    400,
                );
            }

            if (!course) {
                return jsonResponse(
                    {
                        error: "Course is required.",
                    },
                    400,
                );
            }

            if (!academicYear) {
                return jsonResponse(
                    {
                        error: "Academic year is required.",
                    },
                    400,
                );
            }

            const allowedYears = ["2026", "2027", "2028"];

            if (!allowedYears.includes(String(academicYear))) {
                return jsonResponse(
                    {
                        error:
                            "Academic year must be 2026, 2027, or 2028.",
                    },
                    400,
                );
            }

            if (
                status !== "draft" &&
                status !== "submitted"
            ) {
                return jsonResponse(
                    {
                        error:
                            "Status must be draft or submitted.",
                    },
                    400,
                );
            }

            const {
                data,
                error,
            } = await supabase
                .from("applications")
                .insert({
                    user_id: user.id,
                    institution: institution,
                    course: course,
                    academic_year: String(academicYear),
                    status: status,
                    notes: notes,
                })
                .select()
                .single();

            if (error) {
                console.error(
                    "Application insert error:",
                    error,
                );

                return jsonResponse(
                    {
                        error: "Unable to create application.",
                    },
                    500,
                );
            }

            return jsonResponse(
                {
                    message:
                        "Application created successfully.",
                    application: data,
                },
                201,
            );
        }

        if (action === "load") {
            const {
                data,
                error,
            } = await supabase
                .from("applications")
                .select(
                    "id, institution, course, academic_year, status, notes",
                )
                .eq("user_id", user.id)
                .order("id", {
                    ascending: false,
                });

            if (error) {
                console.error("Application load error:", error);

                return jsonResponse(
                    {
                        error: "Unable to load applications.",
                        details: error.message,
                        code: error.code,
                        hint: error.hint,
                        details_raw: error.details,
                    },
                    500,
                );
            }

            return jsonResponse(
                {
                    applications: data ?? [],
                },
                200,
            );
        }

        return jsonResponse(
            {
                error:
                    "Invalid action. Use add or load.",
            },
            400,
        );
    } catch (error) {
        console.error(
            "Applications handler error:",
            error,
        );

        if (error instanceof SyntaxError) {
            return jsonResponse(
                {
                    error: "Invalid JSON body.",
                },
                400,
            );
        }

        return jsonResponse(
            {
                error:
                    "An error occurred processing your request.",
            },
            500,
        );
    }
});