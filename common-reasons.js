(function (root) {
    'use strict';
    const storageKey = 'railway-report.common-reasons.v1';
    const defaults = ['BJD Offline', 'BRC Offline', 'Loco radio issue', 'Tag was removed at site', 'LC-258 dropped'];
    let items;
    let pendingReason = '';
    const clean = value => String(value ?? '').trim();

    function load(storage) {
        try {
            const saved = storage?.getItem(storageKey);
            if (saved !== null && saved !== undefined) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.every(value => typeof value === 'string')) {
                    return [...new Set(parsed.map(clean).filter(Boolean))];
                }
            }
        } catch (_) { /* Keep the library usable when browser storage is unavailable. */ }
        return [...defaults];
    }
    function storage() {try {return root.localStorage;} catch (_) {return null;}}
    function persist() {
        try {
            const target = storage();
            if (!target) return false;
            target.setItem(storageKey, JSON.stringify(items));
            return true;
        } catch (_) {return false;}
    }
    function attach(input, apply) {
        const setReason = reason => {
            const value = clean(reason);
            if (!value) return;
            input.value = value; apply(value); input.focus();
        };
        input.addEventListener('dragover', event => {
            if ([...event.dataTransfer.types].includes('text/plain')) {
                event.preventDefault(); event.dataTransfer.dropEffect = 'copy';
                input.classList.add('reason-drop-target');
            }
        });
        input.addEventListener('dragleave', () => input.classList.remove('reason-drop-target'));
        input.addEventListener('drop', event => {
            event.preventDefault(); input.classList.remove('reason-drop-target');
            setReason(event.dataTransfer.getData('text/plain'));
        });
        input.addEventListener('click', () => {
            if (pendingReason) {const reason = pendingReason;pendingReason = '';setReason(reason);}
        });
    }
    function mount(container) {
        if (!items) items = load(storage());
        pendingReason = '';
        container.innerHTML = '<details class="common-reasons" open><summary>Common reasons</summary><p>Drag a reason into any incident reason box. Or click Use, then click the target box. Your list is saved in this browser.</p><form class="common-reason-add"><input type="text" aria-label="New common reason" placeholder="Add a common reason" required><button type="submit">Add reason</button></form><div class="common-reason-list"></div><p class="common-reason-status" role="status"></p></details>';
        const list = container.querySelector('.common-reason-list');
        const status = container.querySelector('.common-reason-status');
        const added = container.querySelector('[aria-label="New common reason"]');
        function save() {status.textContent = persist() ? 'Common reasons saved.' : 'Browser storage is unavailable. Changes are kept for this session.';}
        function duplicate(reason, except = -1) {return items.some((item, i) => i !== except && item.toLowerCase() === reason.toLowerCase());}
        function render() {
            list.replaceChildren();
            if (!items.length) {const empty=document.createElement('p');empty.textContent='No common reasons yet. Add one above.';list.appendChild(empty);}
            items.forEach((reason, i) => {
                const row = document.createElement('div');row.className='common-reason-item';
                const chip = document.createElement('span');chip.className='common-reason-chip';chip.textContent=reason;chip.draggable=true;chip.title='Drag into an incident reason box';
                chip.addEventListener('dragstart',event=>{event.dataTransfer.setData('text/plain',reason);event.dataTransfer.effectAllowed='copy';});
                const use = document.createElement('button');use.type='button';use.textContent='Use';use.setAttribute('aria-label',`Use common reason ${i+1}`);
                use.addEventListener('click',()=>{pendingReason=reason;status.textContent='Click an incident reason box to apply: '+reason;});
                const edit = document.createElement('button');edit.type='button';edit.textContent='Edit';edit.setAttribute('aria-label',`Edit common reason ${i+1}`);
                edit.addEventListener('click',()=>{
                    const input=document.createElement('input');input.type='text';input.value=items[i];input.setAttribute('aria-label',`Edit reason text ${i+1}`);
                    const saveButton=document.createElement('button');saveButton.type='button';saveButton.textContent='Save';
                    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.addEventListener('click',render);
                    const commit=()=>{const value=clean(input.value);if(!value){status.textContent='Enter a reason.';return;}if(duplicate(value,i)){status.textContent='That reason is already in your list.';return;}items[i]=value;pendingReason='';save();render();};
                    saveButton.addEventListener('click',commit);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();}});
                    row.replaceChildren(input,saveButton,cancel);input.focus();
                });
                const remove = document.createElement('button');remove.type='button';remove.textContent='Delete';remove.setAttribute('aria-label',`Delete common reason ${i+1}`);
                remove.addEventListener('click',()=>{items.splice(i,1);pendingReason='';save();render();});
                row.append(chip,use,edit,remove);list.appendChild(row);
            });
        }
        container.querySelector('form').addEventListener('submit',event=>{
            event.preventDefault();const reason=clean(added.value);
            if(!reason){status.textContent='Enter a reason.';return;}
            if(duplicate(reason)){status.textContent='That reason is already in your list.';return;}
            items.push(reason);added.value='';save();render();
        });
        render();
    }
    root.CommonReasons = {load, attach, mount};
    if (typeof module !== 'undefined') module.exports = root.CommonReasons;
})(typeof window !== 'undefined' ? window : globalThis);
