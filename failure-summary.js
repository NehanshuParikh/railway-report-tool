/* One summary entry per observation incident, preserving observation order. */
(function (root) {
    'use strict';
    const headers = ['Reason', 'Failure type', 'Station', 'Failure Description'];
    const text = value => String(value ?? '').trim();
    const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function readEvents(obs, endRow) {
        const events = [];
        for (let r = 3; r < endRow; r++) {
            const row = obs.getRow(r);
            const failure = text(row.getCell(10).value);
            if (!failure || failure === '-') continue;
            const parts = [...failure.matchAll(/\(([^)]*)\)/g)].map(m => m[1].trim());
            const station = parts[0] || '—';
            const detail = parts[1] || '';
            let type = failure.split('(')[0].trim();
            let label = type;
            if (/^MODE DEGRADATION/i.test(failure)) {
                type = detail.replace(/\bSR MODE\b/gi, 'SR').replace(/\bONSIGHT\b/gi, 'OS').replace(/\s*-\s*FS$/i, '') || 'Mode degradation';
                label = `Mode Degrade ${type}`;
            } else if (/^BOTH TAGS MISS/i.test(failure)) {
                type = 'Both tag miss';
                label = `Both Tags miss (TAG - ${detail.replace(/^After Tag-?/i, '') || '—'})`;
            } else if (/^Brake/i.test(failure)) {
                type = detail || 'Brake';
                label = `${type} applied`;
            } else if (/SPAD/i.test(failure)) {
                type = 'SPAD'; label = 'SPAD';
            } else if (/^Emergency Status/i.test(failure)) {
                type = detail || 'Emergency'; label = `Emergency ${detail}`.trim();
            } else if (/^SOS/i.test(failure)) {
                type = detail ? `SOS (${detail})` : 'SOS'; label = type;
            } else if (/^Foreign Tag/i.test(failure)) {
                type = detail ? `Foreign Tag (${detail})` : 'Foreign Tag'; label = type;
            }
            // Summary uses the incident start; full ranges stay in the observation sheet.
            const startValue = value => text(value).split(' - ')[0] || '—';
            const time = startValue(row.getCell(11).value);
            const location = startValue(row.getCell(12).value);
            events.push({type, station, label, time, location, reason: '', included: true});
        }
        return events;
    }

    const includedEvents = state => state.events.filter(event => event.included !== false);

    function cells(state) {
        const events = includedEvents(state);
        const numbered = fn => events.map((event, i) => `${i + 1}. ${fn(event)}`).join('\n');
        const intro = `In Train No ${state.trainNo || '—'} / Loco No ${state.locoNo || '—'},`;
        return [
            numbered(e => e.reason),
            numbered(e => e.type),
            numbered(e => e.station),
            intro + '\n\n' + (events.length ? numbered(e =>
                `${e.label} at ${e.station} at Time - ${e.time} at Abs Location - ${e.location}. Due to ${e.reason}${e.reason ? '.' : ''}`
            ) : (state.events.length ? 'No incidents selected.' : 'No incidents logged.'))
        ];
    }

    function clipboardData(values, includeHeaders = false) {
        const rows = includeHeaders ? [headers.slice(0, values.length), values] : [values];
        // Quoted multiline TSV keeps each narrative inside one Excel cell.
        const plain = rows.map(row => row.map(v => /[\t\r\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v).join('\t')).join('\r\n');
        const html = '<html><body><table>' + rows.map(row => '<tr>' + row.map(v =>
            '<td style="white-space:pre-wrap;vertical-align:top;mso-number-format:\\@;">' + escapeHTML(v).replace(/\n/g, '<br style="mso-data-placement:same-cell;">') + '</td>'
        ).join('') + '</tr>').join('') + '</table></body></html>';
        return {plain, html};
    }

    function writeWorksheet(wb, state) {
        const sheet = wb.getWorksheet('Failure Summary') || wb.addWorksheet('Failure Summary');
        sheet.getRow(1).values = headers;
        sheet.getRow(2).values = cells(state);
        sheet.columns.forEach((col, i) => { col.width = [32, 24, 24, 90][i]; });
        sheet.getRow(1).height = 30;
        sheet.getRow(2).height = Math.min(409, Math.max(80, includedEvents(state).length * 65));
        for (let r = 1; r <= 2; r++) {
            sheet.getRow(r).eachCell(cell => {
                cell.alignment = {wrapText:true, vertical:'middle', horizontal:'center'};
                cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:r === 1 ? 'FFFFDC67' : 'FFEAD1DC'}};
                cell.border = {top:{style:'thin'},left:{style:'thin'},bottom:{style:'thin'},right:{style:'thin'}};
                if (r === 1) cell.font = {bold:true};
            });
        }
        sheet.views = [{state:'frozen', ySplit:1}];
        return sheet;
    }

    let current;
    function prepare(wb, obs, endRow, trainNo, locoNo) {
        current = {wb, trainNo, locoNo, events:readEvents(obs, endRow)};
        writeWorksheet(wb, current);
        const button = document.getElementById('failureSummaryBtn');
        if (button) button.disabled = false;
        return current;
    }

    function open() {
        if (!current) return;
        document.getElementById('failureSummaryPopup')?.remove();
        const state = current;
        const overlay = document.createElement('div');
        overlay.id = 'failureSummaryPopup';
        overlay.className = 'failure-summary-overlay';
        overlay.innerHTML = '<section class="failure-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="failureSummaryTitle">' +
            '<h2 id="failureSummaryTitle">Failure Summary</h2><p>Check the incidents to include and enter their reasons. Drag across the cells below and press Ctrl+C (⌘C on Mac), or use Copy row. Paste into Excel to fill four cells.</p>' +
            '<div class="summary-selection-actions"><button type="button" data-action="all">Select all</button><button type="button" data-action="none">Clear all</button><span class="summary-selection-count" aria-live="polite"></span></div><div class="summary-reasons"></div><div class="summary-scroll"><table class="summary-grid"><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') +
            '</tr></thead><tbody><tr>' + headers.map((h,i) => `<td tabindex="0" data-column="${i}" aria-label="${h}"></td>`).join('') +
            '</tr></tbody></table></div><div class="summary-actions"><button type="button" data-action="copy">Copy row</button><button type="button" data-action="download">Download updated Excel</button><button type="button" data-action="close">Close</button></div><p class="summary-status" role="status"></p></section>';
        document.body.appendChild(overlay);
        const status = overlay.querySelector('.summary-status');
        const reasons = overlay.querySelector('.summary-reasons');
        state.events.forEach((event, i) => {
            const entry = document.createElement('div');
            entry.className = 'summary-incident';
            const selectionLabel = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox'; checkbox.checked = event.included !== false;
            checkbox.setAttribute('aria-label', `Include incident ${i + 1}`);
            const caption = document.createElement('span');
            caption.textContent = `${i + 1}. ${event.type} (${event.station})`;
            selectionLabel.append(checkbox, caption);
            const input = document.createElement('input');
            input.type = 'text'; input.value = event.reason; input.placeholder = 'Enter reason (optional)';
            input.setAttribute('aria-label', `Reason ${i + 1}`);
            checkbox.addEventListener('change', () => {event.included = checkbox.checked; render();});
            input.addEventListener('input', () => {event.reason = input.value.trim(); render();});
            entry.append(selectionLabel, input); reasons.appendChild(entry);
        });
        const gridCells = [...overlay.querySelectorAll('td')];
        let first = 0, last = 3, dragging = false;
        function select() {
            gridCells.forEach((cell,i) => cell.classList.toggle('selected', i >= Math.min(first,last) && i <= Math.max(first,last)));
        }
        function render() {
            overlay.querySelector('.summary-selection-count').textContent = `${includedEvents(state).length} of ${state.events.length} incidents selected`;
            [...reasons.querySelectorAll('input[type="checkbox"]')].forEach((checkbox, i) => {
                checkbox.checked = state.events[i].included !== false;
                checkbox.closest('.summary-incident').classList.toggle('excluded', !checkbox.checked);
            });
            status.textContent = '';
            cells(state).forEach((value,i) => {gridCells[i].textContent = value;});
            writeWorksheet(state.wb, state);
        }
        for (const action of ['all', 'none']) {
            overlay.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
                state.events.forEach(event => { event.included = action === 'all'; });
                render();
            });
        }
        function selectedData() {return clipboardData(cells(state).slice(Math.min(first,last), Math.max(first,last)+1));}
        gridCells.forEach((cell,i) => {
            cell.addEventListener('pointerdown', event => {if(event.button !== 0)return; first = last = i; dragging = true; cell.focus(); select(); event.preventDefault();});
            cell.addEventListener('pointerenter', () => {if(dragging){last=i;select();}});
            cell.addEventListener('pointerup', () => {dragging=false;});
            cell.addEventListener('keydown', event => {
                if(event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    const next = Math.max(0,Math.min(3,i+(event.key === 'ArrowRight'?1:-1)));
                    if(!event.shiftKey) first=next;
                    last=next; select(); gridCells[next].focus(); event.preventDefault();
                }
            });
        });
        overlay.addEventListener('pointerup',()=>{dragging=false;});
        overlay.addEventListener('copy', event => {
            if (!gridCells.includes(document.activeElement)) return;
            const data = selectedData();
            event.clipboardData.setData('text/html', data.html);
            event.clipboardData.setData('text/plain', data.plain);
            event.preventDefault(); status.textContent = 'Selected cells copied. Paste into Excel.';
        });
        overlay.querySelector('[data-action="copy"]').addEventListener('click', async () => {
            first=0;last=3;select();
            const data = selectedData();
            try {
                if (navigator.clipboard?.write && root.ClipboardItem) {
                    await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([data.html],{type:'text/html'}),'text/plain':new Blob([data.plain],{type:'text/plain'})})]);
                    status.textContent = 'Four cells copied. Paste into Excel.';
                } else {
                    gridCells[0].focus();
                    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
                }
            } catch (_) {
                gridCells[0].focus(); status.textContent = 'Press Ctrl+C (⌘C on Mac) to copy the selected row.';
            }
        });
        overlay.querySelector('[data-action="download"]').addEventListener('click', async event => {
            const button=event.currentTarget;button.disabled=true;
            try {
                writeWorksheet(state.wb,state);
                const bytes=await state.wb.xlsx.writeBuffer();
                const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
                const link=document.createElement('a');link.href=url;link.download=state.filename || 'Railway_Report.xlsx';link.click();
                setTimeout(()=>URL.revokeObjectURL(url),1000);
                status.textContent='Updated workbook downloaded with your reasons.';
            } catch (error) {status.textContent='Download failed: '+error.message;}
            finally {button.disabled=false;}
        });
        function close() {overlay.remove();document.getElementById('failureSummaryBtn')?.focus();}
        overlay.querySelector('[data-action="close"]').addEventListener('click',close);
        overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();close();}});
        render();select();gridCells[0].focus();
    }
    root.FailureSummary = {readEvents,cells,clipboardData,writeWorksheet,prepare,open};
    if (typeof module !== 'undefined') module.exports = root.FailureSummary;
})(typeof window !== 'undefined' ? window : globalThis);
