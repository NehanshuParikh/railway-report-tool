async function uploadRows(url, rows, reportType) {

    try {

        log("\nUploading " + reportType + "...");
        log("Rows: " + rows.length);

        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify({
                rows: rows,
                reportType: reportType
            })
        });

        log("✓ Upload Sent Successfully \n");
        return true;

    } catch (err) {

        console.error(err);
        log("❌ Upload Failed");
        return false;
    }
}