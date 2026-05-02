async function uploadWRFaults(rows) {

    if (!rows || rows.length === 0) {
        log("No WR rows to upload.");
        return true;
    }

    try {

        await fetch(WR_WEBAPP_URL, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify({ rows })
        });

        log("✓ WR Upload Sent");
        return true;

    } catch (err) {

        console.error(err);
        log("✗ WR Upload Failed");
        return false;
    }
}