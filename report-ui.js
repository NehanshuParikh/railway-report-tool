function openReportSelector(sheetRows, modeDegRows) {

    window._sheetRows = sheetRows;
    window._modeDegRows = modeDegRows || [];

    const old = document.getElementById("reportPopup");
    if (old) old.remove();

    const div = document.createElement("div");
    div.id = "reportPopup";

    div.style.position = "fixed";
    div.style.top = "0";
    div.style.left = "0";
    div.style.right = "0";
    div.style.bottom = "0";
    div.style.background = "rgba(0,0,0,0.65)";
    div.style.zIndex = "999999";
    div.style.display = "flex";
    div.style.justifyContent = "center";
    div.style.alignItems = "center";

    div.innerHTML = `
        <div style="
            background:white;
            width:450px;
            padding:28px;
            border-radius:12px;
            color:black;
            font-family:Arial;
            box-shadow:0 0 20px rgba(0,0,0,0.25);
        ">
            <h2 style="margin-top:0;margin-bottom:20px;color:#333;">Select Reports to Update</h2>
 
            <div style="margin-bottom:24px;border:1px solid #ddd;padding:16px;border-radius:8px;background:#f9f9f9;">
                
                <label style="display:block;margin-bottom:16px;cursor:pointer;">
                    <input type="checkbox" value="trainIssue" checked>
                    <span style="margin-left:10px;font-weight:bold;color:#333;">TRAIN ISSUE SUMMARY</span>
                </label>
 
                <label style="display:block;cursor:pointer;">
                    <input type="checkbox" value="modeDegradation" checked>
                    <span style="margin-left:10px;font-weight:bold;color:#333;">MODE DEGRADATION (OVERVIEW)</span>
                </label>
            </div>
 
            <div style="display:flex;gap:12px;margin-bottom:12px;">
                <button id="updateBtn" onclick="submitReports()"
                    style="
                        flex:1;
                        padding:12px;
                        background:#16a34a;
                        color:white;
                        border:none;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:bold;
                        font-size:14px;
                    ">
                    ✓ Update
                </button>
 
                <button onclick="closePopup()"
                    style="
                        flex:1;
                        padding:12px;
                        background:#dc2626;
                        color:white;
                        border:none;
                        border-radius:8px;
                        cursor:pointer;
                        font-weight:bold;
                        font-size:14px;
                    ">
                    ✕ Cancel
                </button>
            </div>
 
            <div style="font-size:12px;color:#999;text-align:center;">
                Checked reports will be uploaded to Google Sheets
            </div>
        </div>
    `;

    document.body.appendChild(div);
}


function closePopup() {
    const p = document.getElementById("reportPopup");
    if (p) p.remove();
}


async function submitReports() {

    const btn = document.getElementById("updateBtn");

    btn.disabled = true;
    btn.innerHTML = `<span class="loader"></span> Updating... Please Wait`;

    const checks = document.querySelectorAll("#reportPopup input:checked");

    if (checks.length === 0) {
        alert("Please select at least one report to update");
        return;
    }

    let updatedReports = [];
    let failedReports = [];

    for (let c of checks) {

        const reportKey = c.value;
        const report = REPORTS[reportKey];

        if (!report) {
            console.error("Report not found: " + reportKey);
            continue;
        }

        log("Uploading " + report.name + "...");

        // Route correct data
        let rowsToUpload = [];

        if (reportKey === "trainIssue") {
            rowsToUpload = window._sheetRows;
        } else if (reportKey === "modeDegradation") {
            rowsToUpload = window._modeDegRows;
        }

        if (!rowsToUpload || rowsToUpload.length === 0) {

            // Special case for Mode Degradation
            if (reportKey === "modeDegradation") {
                log("✓ " + report.name + ": No events found, skipped");
                continue;   // skip silently
            }

            // For other reports
            log("⚠ " + report.name + ": No data found");
            failedReports.push(report.name);
            continue;
        }

        const ok = await uploadRows(
            report.url,
            rowsToUpload,
            reportKey
        );

        if (ok) {
            updatedReports.push(report.name);
        } else {
            failedReports.push(report.name);
        }
    }

    closePopup();

    // Build result message
    let message = "LM Generated Successfully.\n\n";

    if (updatedReports.length > 0) {
        message += "✓ Updated:\n";
        updatedReports.forEach(r => {
            message += "  • " + r + "\n";
        });
    }

    if (failedReports.length > 0) {
        message += "\n❌ Failed:\n";
        failedReports.forEach(r => {
            message += "  • " + r + "\n";
        });
    }

    if (updatedReports.length > 0) {
        alert(message);
        log("✓ Google Sheets Updated Successfully");
    } else {
        alert("❌ Upload Failed\n\n" + message);
        log("❌ Upload Failed");
    }

    btn.disabled = false;
    btn.innerHTML = "✓ Update";
}
