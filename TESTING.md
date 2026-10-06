# Failure summary

The existing observation and main sheets remain in the workbook, with an additional Failure Summary sheet.

## Try it

1. Start a static server from this directory: `python3 -m http.server 8000`.
2. Open the locally served app in your browser. Internet access to cdn.jsdelivr.net is required for the spreadsheet libraries.
3. Upload your original loco log workbook, enter the train number, and click Generate Final Excel.
4. The Failure Summary popup opens automatically. Its incident numbering follows the observation table; reasons start blank.
5. All incidents start checked. Uncheck incidents you want to exclude, or use Select all / Clear all. The four summary cells immediately update with consecutive numbering. Checkbox choices affect copied content and the updated Failure Summary sheet; original observation entries remain unchanged. Unchecked incidents keep their reasons if selected again.
6. Enter reasons in the numbered inputs. They appear in both the Reason cell and the corresponding description after “Due to”.
7. Drag across Reason, Failure type, Station, and Failure Description, then Ctrl+C / Cmd+C. Alternatively click Copy row.
8. Select one cell in Excel and paste. Check that four adjacent cells are filled and line breaks stay within each cell. Enable Wrap Text in Excel if needed.
9. Click Download updated Excel after editing reasons. This downloads the complete workbook with the updated Failure Summary sheet. The original automatic download contains blank reasons.
10. Close the summary to reach the existing Google Sheets report selector. Cancel that selector to avoid sending test data. The Failure Summary / Copy to Excel button reopens your summary with your edits.

A new generation replaces the previous summary and its reasons. Closing/reopening the popup retains reasons and checkbox choices for that generation; refreshing the page clears them.

All observation incidents are initially selected, even those the existing app excludes from Google Sheets uploads. The summary does not diagnose causes or add new incident detectors. Each summary incident is one concise sentence using its starting time and location. Full ranges and mode transitions remain in the original observation sheet. SR MODE and ONSIGHT are shortened to SR and OS in the summary. SPAD is labelled when an observation entry explicitly contains SPAD.

## Automated checks

`node --test tests/failure-summary.test.cjs`

With Playwright and Chromium installed, and the static server running:

`node tests/browser-smoke.cjs`

Set CHROMIUM_PATH or RAILWAY_BASE_URL if needed. In this cloud environment, use `RAILWAY_CDN_CACHE=/workspace/railway-onboarding node tests/browser-smoke.cjs` to use the TLS-verified cached CDN libraries. The browser smoke test blocks Google Apps Script submissions. It verifies incident extraction through the actual app, editable reasons, drag selection, clipboard payloads and Copy row, updated XLSX content, reopening, and a second run with no incidents.

Desktop Excel paste behavior remains a manual acceptance check. The HTML clipboard specifies that line breaks stay inside their cells, and the plain-text fallback uses quoted multiline TSV.

## Direction views and common reasons

The Direction dropdown filters the visible incidents, copied row, and Failure Summary worksheet. N is shown as DN and R as UP, matching the existing app mapping; other values remain separately labelled. All shows every incident. A log containing both directions is detected separately at direction boundaries. Changing direction preserves each incident's reasons and checkbox choice. Select all / Clear all apply only to the current view. You can set a different train number for each direction in the popup.

Common reasons can be added, edited, and deleted. Drag a reason chip into an incident reason box to apply it; alternatively click Use and then the target box. Your library is stored in this browser's local storage, not GitHub or Google Sheets. Deleting/editing a library item does not change reasons already applied to incidents. If storage is unavailable, library edits last for this page session.

Run `node --test tests/*.test.cjs` and `RAILWAY_CDN_CACHE=/workspace/railway-onboarding node tests/direction-reasons-browser.cjs` for the new checks.
