const SUPABASE_FUNCTION_URL ="https://bsywozoqkyjstsowbmel.supabase.co/functions/v1/applications-handler";

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

        const institutionSelect =
            document.getElementById("institution");
        const courseInput =
            document.getElementById("course");
        const academicYearSelect =
            document.getElementById("academicYear");
        const notesInput =
            document.getElementById("notes");
        const saveDraftBtn =
            document.getElementById("saveDraftBtn");
        const submitBtn =
            document.getElementById("submitBtn");
        const logoutBtn =
            document.getElementById("logoutBtn");
        const applicationForm =
            document.getElementById("applicationForm");
        const formMessage =
            document.getElementById("formMessage");
        const applicationsList =
            document.getElementById("applicationsList");
        const loadingMessage =
            document.getElementById("loadingMessage");
        const noApplications =
            document.getElementById("noApplications");

        const token = sessionStorage.getItem("qc_token");

        if (!token) {
            window.location.href = "index.html";
        }

        function populateInstitutions() {
            APPROVED_INSTITUTIONS.forEach((institution) => {
                const option = document.createElement("option");
                option.value = institution;
                option.textContent = institution;
                institutionSelect.appendChild(option);
            });
        }

        function showMessage(message, type) {
            formMessage.textContent = message;
            formMessage.className = `message ${type}`;
        }

        function clearForm() {
            applicationForm.reset();
        }

        async function addApplication(status) {
            const institution = institutionSelect.value;
            const course = courseInput.value.trim();
            const academicYear = academicYearSelect.value;
            const notes = notesInput.value.trim();

            if (!institution) {
                showMessage(
                    "Please select an institution.",
                    "error"
                );
                return;
            }

            if (!course) {
                showMessage(
                    "Please enter your course.",
                    "error"
                );
                return;
            }

            if (!academicYear) {
                showMessage(
                    "Please select an academic year.",
                    "error"
                );
                return;
            }

            try {
                const response = await fetch(
                    SUPABASE_FUNCTION_URL,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: "add",
                            institution: institution,
                            course: course,
                            academic_year: academicYear,
                            status: status,
                            notes: notes
                        })
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    showMessage(
                        result.error ||
                        "Unable to create application.",
                        "error"
                    );
                    return;
                }

                showMessage(
                    status === "draft"
                        ? "Application saved as draft."
                        : "Application submitted successfully.",
                    "success"
                );

                clearForm();
                await loadApplications();
            } catch (error) {
                console.error(error);

                showMessage(
                    "Unable to connect to the application server.",
                    "error"
                );
            }
        }

        async function loadApplications() {
            loadingMessage.style.display = "block";
            noApplications.style.display = "none";
            applicationsList.innerHTML = "";

            try {
                const response = await fetch(
                    SUPABASE_FUNCTION_URL,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: "load"
                        })
                    }
                );

                const result = await response.json();

                loadingMessage.style.display = "none";

                if (!response.ok) {
                    applicationsList.innerHTML =
                        `<p class="message error">
                            ${escapeHtml(
                                result.error ||
                                "Unable to load applications."
                            )}
                        </p>`;
                    return;
                }

                const applications = result.applications || [];

                if (applications.length === 0) {
                    noApplications.style.display = "block";
                    return;
                }

                applications.forEach((application) => {
                    const div = document.createElement("div");
                    div.className = "application";

                    const statusClass =
                        application.status === "submitted"
                            ? "submitted"
                            : "draft";

                    div.innerHTML = `
                        <h3>
                            ${escapeHtml(application.institution)}
                        </h3>
                        <p>
                            <strong>Course:</strong>
                            ${escapeHtml(application.course)}
                        </p>
                        <p>
                            <strong>Academic Year:</strong>
                            ${escapeHtml(application.academic_year)}
                        </p>
                        <p>
                            <strong>Status:</strong>
                            <span class="status ${statusClass}">
                                ${escapeHtml(application.status)}
                            </span>
                        </p>
                        ${
                            application.notes
                                ? `
                                    <p>
                                        <strong>Notes:</strong>
                                        ${escapeHtml(application.notes)}
                                    </p>
                                `
                                : ""
                        }
                    `;

                    applicationsList.appendChild(div);
                });
            } catch (error) {
                console.error(error);

                loadingMessage.style.display = "none";

                applicationsList.innerHTML =
                    `<p class="message error">
                        Unable to connect to the application server.
                    </p>`;
            }
        }

        function escapeHtml(value) {
            const div = document.createElement("div");
            div.textContent = String(value ?? "");
            return div.innerHTML;
        }

        saveDraftBtn.addEventListener("click", () => {
            addApplication("draft");
        });

        submitBtn.addEventListener("click", () => {
            addApplication("submitted");
        });

        logoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("qc_token");
            window.location.href = "index.html";
        });

        populateInstitutions();
        loadApplications();