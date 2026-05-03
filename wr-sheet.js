async function uploadWRFaults(rows) {

    if (!rows || rows.length === 0) {
        log("⚠ WR LOCO FAULTS: Skipped (No Entries)");
        return true;   // VERY IMPORTANT
    }

    try {
        await fetch(WR_WEBAPP_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ rows })
        });

        log("✓ WR LOCO FAULTS Uploaded");
        return true;

    } catch (err) {
        log("❌ WR LOCO FAULTS Upload Failed");
        return false;
    }
}