/* No analytics libraries or Google tags are loaded by this file. */
(() => {
  "use strict";
  const form = document.querySelector("#lead-form");
  const attributionKeys = [
    "gclid",
    "gbraid",
    "wbraid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const GCLID_STORAGE_KEY = "gclid";
  const ATTRIBUTION_STORAGE_KEY = "platinum-attribution";

  // 1. Retrieve any previously preserved GCLID from storage (localStorage or sessionStorage)
  let preservedGclid = "";
  try {
    preservedGclid =
      localStorage.getItem(GCLID_STORAGE_KEY) ||
      sessionStorage.getItem(GCLID_STORAGE_KEY) ||
      "";
  } catch (_) {}

  // 2. Load existing campaign attribution object
  let attribution = {};
  try {
    attribution = JSON.parse(
      sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}",
    );
  } catch (_) {}

  // If GCLID was stored in attribution object but not standalone key
  if (!preservedGclid && attribution.gclid) {
    preservedGclid = String(attribution.gclid).slice(0, 500);
  }

  // 3. Capture fresh values from URL query parameters
  const params = new URLSearchParams(location.search);
  const newGclid = params.get("gclid");

  // If a new GCLID is present in URL, update stored values; never overwrite with empty
  if (newGclid && newGclid.trim()) {
    preservedGclid = newGclid.trim().slice(0, 500);
    try {
      localStorage.setItem(GCLID_STORAGE_KEY, preservedGclid);
    } catch (_) {}
    try {
      sessionStorage.setItem(GCLID_STORAGE_KEY, preservedGclid);
    } catch (_) {}
  }

  // Update campaign attribution from URL parameters
  if (attributionKeys.some((key) => params.has(key))) {
    for (const key of attributionKeys) {
      if (params.get(key)) {
        attribution[key] = params.get(key).slice(0, 500);
      }
    }
  }

  // Ensure preserved GCLID is maintained in attribution object
  if (preservedGclid) {
    attribution.gclid = preservedGclid;
  }

  try {
    sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
  } catch (_) {}

  document.querySelectorAll("[data-cta]").forEach((link) => {
    link.addEventListener("click", () => {
      // Bilal can attach his tracking here. A tap is not a completed phone call.
      window.dispatchEvent(
        new CustomEvent("platinum:cta-click", {
          detail: {
            type: link.dataset.cta,
            placement: link.dataset.placement || "callback",
          },
        }),
      );
    });
  });

  // Populate all forms across the page with preserved GCLID and attribution
  function populateFormAttribution(targetForm) {
    if (!targetForm) return;

    // Ensure hidden gclid input exists and is populated
    let gclidInput = targetForm.querySelector('input[name="gclid"]');
    if (!gclidInput) {
      gclidInput = document.createElement("input");
      gclidInput.type = "hidden";
      gclidInput.name = "gclid";
      targetForm.prepend(gclidInput);
    }
    if (preservedGclid) {
      gclidInput.value = preservedGclid;
    } else {
      gclidInput.value = "";
    }

    // Populate other attribution keys (utm_source, gbraid, etc.)
    for (const [name, value] of Object.entries(attribution)) {
      if (name === "gclid") continue;
      if (
        !attributionKeys.includes(name) ||
        typeof value !== "string" ||
        !value
      )
        continue;
      let input = targetForm.querySelector(`input[name="${name}"]`);
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        targetForm.append(input);
      }
      input.value = value.slice(0, 500);
    }
  }

  document.querySelectorAll("form").forEach(populateFormAttribution);
  if (!form) return;

  const BACKEND_API_ENDPOINT =
    "https://platinum-backend.vercel.app/api/contact";

  // Resolves the backend API endpoint for form submissions.
  // Connects directly to the deployed backend: https://platinum-backend.vercel.app/api/contact
  function getApiEndpoint() {
    if (typeof window !== "undefined") {
      if (window.PLATINUM_API_ENDPOINT) return window.PLATINUM_API_ENDPOINT;
      if (window.BACKEND_URL) {
        return `${window.BACKEND_URL.replace(/\/+$/, "")}/api/contact`;
      }
    }
    return BACKEND_API_ENDPOINT;
  }

  function generateSubmissionId() {
    try {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return crypto.randomUUID();
      }
    } catch (_) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getFieldElement(fieldName) {
    if (!fieldName) return null;
    const key = String(fieldName).toLowerCase().replace(/[-_]/g, "");
    if (key === "name" || key === "fullname" || key === "yourname") {
      return form.elements.name;
    }
    if (key === "phone" || key === "phonenumber" || key === "telephone") {
      return form.elements.phone;
    }
    if (key === "zip" || key === "zipcode" || key === "propertyzipcode") {
      return form.elements.zip;
    }
    if (
      key === "damage" ||
      key === "issue" ||
      key === "waterissue" ||
      key === "damagetype"
    ) {
      return form.elements.damage;
    }
    if (
      key === "message" ||
      key === "details" ||
      key === "notes" ||
      key === "additionaldetails"
    ) {
      return form.elements.message;
    }
    return form.elements[fieldName] || null;
  }

  function clearFieldError(input) {
    if (!input) return;
    input.removeAttribute("aria-invalid");
    const errorId = `field-error-${input.name || input.id}`;
    const existing = document.getElementById(errorId);
    if (existing) existing.remove();
    const describedBy = (input.getAttribute("aria-describedby") || "")
      .replace(new RegExp(`\\b${errorId}\\b`, "g"), "")
      .trim();
    if (describedBy) {
      input.setAttribute("aria-describedby", describedBy);
    } else {
      input.removeAttribute("aria-describedby");
    }
  }

  function clearAllFieldErrors() {
    form.querySelectorAll(".field-error").forEach((el) => el.remove());
    form.querySelectorAll("[aria-invalid='true']").forEach((el) => {
      el.removeAttribute("aria-invalid");
      const describedBy = (el.getAttribute("aria-describedby") || "")
        .replace(/\bfield-error-[^\s]+\b/g, "")
        .trim();
      if (describedBy) {
        el.setAttribute("aria-describedby", describedBy);
      } else {
        el.removeAttribute("aria-describedby");
      }
    });
  }

  function setFieldError(fieldName, message) {
    const field = getFieldElement(fieldName);
    if (!field) return;

    field.setAttribute("aria-invalid", "true");
    const errorId = `field-error-${field.name || field.id}`;
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.id = errorId;
      errorEl.className = "field-error";
      errorEl.setAttribute("role", "alert");
      field.insertAdjacentElement("afterend", errorEl);
    }
    errorEl.textContent = message;

    const currentDescribedBy = field.getAttribute("aria-describedby") || "";
    if (!currentDescribedBy.includes(errorId)) {
      field.setAttribute(
        "aria-describedby",
        `${currentDescribedBy} ${errorId}`.trim(),
      );
    }

    if (field.name === "message") {
      const details = field.closest("details");
      if (details) details.open = true;
    }
  }

  // Clear field errors as user interacts
  ["name", "phone", "zip", "damage", "message"].forEach((fieldName) => {
    const el = form.elements[fieldName];
    if (!el) return;
    const evt = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(evt, () => {
      clearFieldError(el);
      if (
        !form.querySelector(".field-error") &&
        status.dataset.type === "validation"
      ) {
        status.textContent = "";
        delete status.dataset.type;
      }
    });
  });

  const phone = form.elements.phone;
  phone.addEventListener("input", () => {
    phone.setCustomValidity("");
    clearFieldError(phone);
  });

  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector("#form-status");
  const originalButton = button.innerHTML;
  let pending = false;
  let submissionId = generateSubmissionId();

  function buildPayload(currentSubmissionId) {
    const nameVal = (form.elements.name?.value || "").trim();
    const phoneVal = (form.elements.phone?.value || "").trim();
    const zipVal = (form.elements.zip?.value || "").trim();
    const damageVal = (form.elements.damage?.value || "").trim();
    const messageVal = (form.elements.message?.value || "").trim();
    const serviceVal = (
      form.elements.service?.value || "Water damage restoration"
    ).trim();

    const payload = {
      service: serviceVal,
      name: nameVal,
      phone: phoneVal,
      zip: zipVal,
      damage: damageVal,
      message: messageVal,
      page:
        typeof window !== "undefined" &&
        (window.location.protocol === "http:" ||
          window.location.protocol === "https:")
          ? window.location.href
          : "https://platinumsg.com/",
      submission_id: currentSubmissionId,
      consent: "Contact me about this water damage request.",
    };

    if (preservedGclid) {
      payload.gclid = preservedGclid.trim().slice(0, 255);
    }
    for (const key of attributionKeys) {
      if (key === "gclid") continue;
      if (
        attribution[key] &&
        typeof attribution[key] === "string" &&
        attribution[key].trim()
      ) {
        payload[key] = attribution[key].trim().slice(0, 255);
      }
    }

    return payload;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;

    // Check honeypot
    const honeypot = form.elements.website;
    if (honeypot && honeypot.value.trim()) {
      return;
    }

    clearAllFieldErrors();
    status.textContent = "";
    delete status.dataset.type;

    // Client-side quick validation for phone
    const digits = (phone.value || "").replace(/\D/g, "");
    if (!(digits.length === 10 || (digits.length === 11 && digits[0] === "1"))) {
      phone.setCustomValidity("Enter a 10-digit US phone number.");
      setFieldError(
        "phone",
        "Please enter a valid 10-digit US phone number (e.g. (817) 555-0123).",
      );
      phone.reportValidity();
      phone.focus();
      return;
    }
    phone.setCustomValidity("");

    if (!form.reportValidity()) return;

    // Prevent duplicate submissions & show clear loading state
    pending = true;
    button.disabled = true;
    button.textContent = "Submitting…";
    form.setAttribute("aria-busy", "true");

    const payload = buildPayload(submissionId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    const targetUrl = getApiEndpoint();

    async function sendRequest(url) {
      return await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    let response = null;
    let networkError = null;

    try {
      try {
        response = await sendRequest(targetUrl);
      } catch (err) {
        networkError = err;
      }

      if (networkError || !response) {
        throw networkError || new Error("Network request failed");
      }

      let result = null;
      try {
        result = await response.json();
      } catch (_) {
        result = null;
      }

      // Handle Successful Submissions (HTTP 200 OK)
      if (response.ok && (!result || result.success !== false)) {
        button.disabled = true;
        button.textContent = "Redirecting…";

        const receipt = {
          id: (result && result.submission_id) || submissionId,
          at: Date.now(),
        };
        try {
          sessionStorage.setItem("platinum-receipt", JSON.stringify(receipt));
        } catch (_) {}

        window.dispatchEvent(
          new CustomEvent("platinum:lead-submitted", { detail: receipt }),
        );

        form.reset();
        submissionId = generateSubmissionId();
        window.location.assign("/thanks");
        return;
      }

      // Submission failed - re-enable button and reset loading state
      pending = false;
      button.disabled = false;
      button.innerHTML = originalButton;
      form.removeAttribute("aria-busy");

      if (response.status === 400 && result && result.errors) {
        // Validation Error (400 Bad Request)
        status.dataset.type = "validation";
        status.textContent =
          result.error ||
          "Form validation failed. Please check the highlighted fields below.";

        let firstInvalidField = null;
        for (const [fieldKey, fieldMsg] of Object.entries(result.errors)) {
          setFieldError(fieldKey, fieldMsg);
          if (!firstInvalidField) {
            firstInvalidField = getFieldElement(fieldKey);
          }
        }
        if (firstInvalidField) {
          firstInvalidField.focus();
        } else {
          status.focus();
        }
      } else if (response.status === 403) {
        // Origin Rejected (403 Forbidden)
        status.replaceChildren();
        status.append(
          (result && result.error) ||
            "Origin not allowed. Cross-origin request rejected. ",
          "Please call ",
        );
        const call = document.createElement("a");
        call.href = "tel:+18179294119";
        call.textContent = "817-929-4119";
        status.append(call, " for immediate assistance.");
        status.focus();
      } else if (response.status >= 500) {
        // Server Error (500 Internal Server Error)
        status.replaceChildren();
        status.append(
          (result && result.error) ||
            "Unable to deliver callback request at this time. Please try again later. ",
          "You can also call ",
        );
        const call = document.createElement("a");
        call.href = "tel:+18179294119";
        call.textContent = "817-929-4119";
        status.append(call, " directly to speak with a specialist.");
        status.focus();
      } else {
        // Other unexpected response
        status.replaceChildren();
        status.append(
          (result && result.error) ||
            "We were unable to process your request. Please call ",
        );
        const call = document.createElement("a");
        call.href = "tel:+18179294119";
        call.textContent = "817-929-4119";
        status.append(
          call,
          " for immediate help, or try again. Your details are still in the form.",
        );
        status.focus();
      }
    } catch (_) {
      // Network failure, timeout, or unexpected error
      pending = false;
      button.disabled = false;
      button.innerHTML = originalButton;
      form.removeAttribute("aria-busy");

      status.replaceChildren();
      status.append("We couldn’t confirm your request. Please call ");
      const call = document.createElement("a");
      call.href = "tel:+18179294119";
      call.textContent = "817-929-4119";
      status.append(
        call,
        " for help, or try again. Your details are still in the form.",
      );
      status.focus();
    } finally {
      clearTimeout(timer);
    }
  });
})();
