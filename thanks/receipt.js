(() => {
  // Capture and preserve GCLID if landing on /thanks directly
  try {
    const params = new URLSearchParams(location.search);
    const gclid = params.get("gclid");
    if (gclid && gclid.trim()) {
      const cleanGclid = gclid.trim().slice(0, 500);
      localStorage.setItem("gclid", cleanGclid);
      sessionStorage.setItem("gclid", cleanGclid);
      const attr = JSON.parse(
        sessionStorage.getItem("platinum-attribution") || "{}",
      );
      attr.gclid = cleanGclid;
      sessionStorage.setItem("platinum-attribution", JSON.stringify(attr));
    }
  } catch (_) {}

  try {
    const receipt = JSON.parse(
      sessionStorage.getItem("platinum-receipt") || "null",
    );
    const age = Date.now() - receipt?.at;
    if (
      !receipt?.id ||
      !Number.isFinite(age) ||
      age < 0 ||
      age > 30 * 60 * 1000
    )
      return;
    document.title = "Thanks — We Got Your Request | Platinum Service Group";
  } catch (_) {
    /* Direct visits keep default title and reference layout. */
  }
})();
