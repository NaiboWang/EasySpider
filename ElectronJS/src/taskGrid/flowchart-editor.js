/* Presentation helpers. Workflow creation, editing, trial runs and persistence
   continue to use FlowChart.js and logic.js. Keep .options labels and order intact. */
(() => {
    const zh = location.pathname.includes('_CN');
    const words = (cn, en) => zh ? cn : en;
    // Selection belongs to the interface and is never added to task fields.
    const fieldKeys = new WeakMap();
    let fieldKeyCounter = 0;
    let fieldReselection = null;
    app.$set(app.params, 'selectedFieldIds', []);
    app.$set(app.params, 'reselection', {active: false, message: ''});
    app.cancelFieldReselection = () => {
        fieldReselection = null;
        app.params.reselection.active = false;
        app.params.reselection.message = '';
    };
    app.selectField = index => {
        app.cancelFieldReselection();
        app.paraIndex = index;
    };
    app.reselectField = index => {
        const field = app.params.parameters[index];
        if (!field || app.nodeType !== 3) return;
        fieldReselection = {node: app.nowNode, field};
        app.params.reselection.active = true;
        app.params.reselection.message = words('在设计浏览器中选择一个元素，再点击采集操作；结果将替换此字段的定位和示例。', 'Select one element in the design browser and choose an extraction action to replace this field’s locator and example.');
        app.modifyParam(index);
    };
    const originalHandleAddElement = handleAddElement;
    handleAddElement = function(message) {
        if (fieldReselection && ['singleCollect', 'multiCollectNoPattern', 'multiCollectWithPattern'].includes(message.type)) {
            const {node, field} = fieldReselection;
            const index = node.parameters.params.indexOf(field);
            if (node !== app.nowNode || node.id === -1 || index < 0) {
                app.cancelFieldReselection();
                return;
            }
            const incoming = message.parameters?.[0];
            if (message.type === 'multiCollectWithPattern' || message.parameters?.length !== 1 || !incoming || typeof incoming.relativeXPath !== 'string' || (incoming.relative && !node.isInLoop)) {
                app.params.reselection.message = words('更换字段元素时请选择单个元素，不要新建循环或一次采集多个字段。可取消后正常新增。', 'Choose a single element without creating a loop or collecting multiple fields. Cancel to add new fields normally.');
                return;
            }
            for (const key of ['relativeXPath', 'allXPaths', 'exampleValues', 'relative', 'iframe']) {
                const fallback = key === 'allXPaths' || key === 'exampleValues' ? [] : false;
                app.$set(field, key, DeepClone(incoming[key] === undefined ? fallback : incoming[key]));
            }
            app.paraIndex = index;
            fieldReselection = null;
            app.params.reselection.active = false;
            app.params.reselection.message = words('元素已更新，字段名称和采集设置已保留。', 'Element updated. Field name and extraction settings were preserved.');
            return;
        }
        if (fieldReselection && !['GetCookies'].includes(message.type)) app.cancelFieldReselection();
        return originalHandleAddElement(message);
    };
    app.fieldKey = field => {
        if (!fieldKeys.has(field)) fieldKeys.set(field, String(++fieldKeyCounter));
        return fieldKeys.get(field);
    };
    app.selectedFieldCount = () => app.params.parameters.filter(field => app.params.selectedFieldIds.includes(app.fieldKey(field))).length;
    app.allFieldsSelected = () => app.params.parameters.length > 0 && app.selectedFieldCount() === app.params.parameters.length;
    app.selectAllFields = checked => { app.params.selectedFieldIds = checked ? app.params.parameters.map(app.fieldKey) : []; };
    app.deleteSelectedFields = () => {
        const indices = app.params.parameters.map((field, index) => app.params.selectedFieldIds.includes(app.fieldKey(field)) ? index : -1).filter(index => index >= 0);
        indices.reverse().forEach(index => app.deleteParam(index));
        app.params.selectedFieldIds = [];
    };
    app.$watch('index.nowNodeIndex', () => { app.params.selectedFieldIds = []; app.cancelFieldReselection(); });
    app.$watch('paraIndex', index => {
        if (fieldReselection && app.params.parameters[index] !== fieldReselection.field) app.cancelFieldReselection();
    });
    app.$watch('params.parameters', fields => {
        const currentKeys = fields.map(app.fieldKey);
        app.params.selectedFieldIds = app.params.selectedFieldIds.filter(key => currentKeys.includes(key));
        if (fieldReselection && !fields.includes(fieldReselection.field)) app.cancelFieldReselection();
    });
    function usedFieldNumbers() {
        const used = new Set();
        nodeList.filter(node => node.id !== -1 && node.option === 3).forEach(node => {
            (node.parameters.params || []).forEach(field => {
                const match = String(field.name || '').match(/^(?:自定义参数_|Custom_Field_|参数|para)([1-9]\d*)(?:_|$)/);
                if (match && Number.isSafeInteger(Number(match[1]))) used.add(Number(match[1]));
            });
        });
        return used;
    }
    const originalNotifyParameterNum = notifyParameterNum;
    function syncFieldNumber(force = false) {
        const next = Math.max(0, ...usedFieldNumbers()) + 1;
        const changed = parameterNum !== next;
        parameterNum = next;
        if ((force || changed) && (ws.readyState === undefined || ws.readyState === 1)) originalNotifyParameterNum(0);
    }
    // Keep the extension's batch naming counter beyond existing numbered fields.
    notifyParameterNum = () => syncFieldNumber(true);
    ws.addEventListener?.('open', () => syncFieldNumber(true));
    const originalAddParam = app.addParam;
    app.addParam = function() {
        app.cancelFieldReselection();
        const used = usedFieldNumbers();
        parameterNum = 1;
        while (used.has(parameterNum)) parameterNum++;
        return originalAddParam();
    };
    // Width preferences belong to the editor UI, never to the saved workflow.
    const layout = document.querySelector('.editor-layout');
    const desktop = matchMedia('(min-width: 1001px)');
    const storageKey = 'easyspider.editor.panel-widths.v1';
    const limits = {left: {min: 180, max: 420}, right: {min: 280, max: 640}};
    const minCanvas = 360;
    let preferences = {}, drag = null;
    try {
        const stored = JSON.parse(localStorage.getItem(storageKey));
        for (const side of ['left', 'right']) {
            if (typeof stored?.[side] === 'number' && Number.isFinite(stored[side])) preferences[side] = stored[side];
        }
    } catch (_) { /* Storage can be unavailable; resizing still works. */ }
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const saveWidths = () => {
        try {localStorage.setItem(storageKey, JSON.stringify(preferences));} catch (_) {}
    };
    const handles = {};
    const actualWidths = () => ({left: document.querySelector('.editor-tools').getBoundingClientRect().width,
        right: document.querySelector('.editor-inspector').getBoundingClientRect().width});
    function applyWidths() {
        for (const handle of Object.values(handles)) {
            handle.tabIndex = desktop.matches ? 0 : -1;
            handle.setAttribute('aria-hidden', String(!desktop.matches));
        }
        if (!desktop.matches) return;
        const compact = matchMedia('(max-width: 1280px)').matches;
        const budget = layout.clientWidth - minCanvas;
        let left = clamp(preferences.left ?? (compact ? 198 : 224), limits.left.min, limits.left.max);
        let right = clamp(preferences.right ?? (compact ? 330 : 370), limits.right.min, limits.right.max);
        if (left + right > budget) {
            right = Math.max(limits.right.min, budget - left);
            left = Math.min(left, budget - right);
        }
        layout.style.setProperty('--tool-panel-width', left + 'px');
        layout.style.setProperty('--inspector-panel-width', right + 'px');
        for (const [side, width] of Object.entries({left, right})) {
            const other = side === 'left' ? right : left;
            handles[side].setAttribute('aria-valuemin', String(limits[side].min));
            handles[side].setAttribute('aria-valuemax', String(Math.floor(Math.min(limits[side].max, budget - other))));
            handles[side].setAttribute('aria-valuenow', String(Math.round(width)));
        }
    }
    function changeWidth(side, value) {
        const widths = actualWidths(), other = side === 'left' ? 'right' : 'left';
        const max = Math.min(limits[side].max, layout.clientWidth - minCanvas - widths[other]);
        preferences[side] = Math.round(clamp(value, limits[side].min, max));
        preferences[other] = widths[other];
        applyWidths();
    }
    function endDrag(cancel = false) {
        if (!drag) return;
        const {handle, pointerId, before} = drag;
        drag = null;
        if (cancel) preferences = before;
        handle.classList.remove('is-dragging');
        document.body.classList.remove('is-resizing-panels');
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
        applyWidths();
        if (!cancel) saveWidths();
    }
    for (const side of ['left', 'right']) {
        const handle = document.createElement('div');
        handle.className = 'panel-resizer panel-resizer--' + side;
        handle.setAttribute('role', 'separator');
        handle.setAttribute('aria-orientation', 'vertical');
        handle.setAttribute('aria-label', side === 'left' ? words('调整操作工具栏宽度', 'Resize action tools') : words('调整步骤参数栏宽度', 'Resize step settings'));
        handle.title = words('左右拖动调整宽度；双击恢复默认。方向键微调，Esc 取消拖动。', 'Drag to resize; double-click to reset. Use arrow keys to adjust, Esc to cancel a drag.');
        layout.append(handle);
        handles[side] = handle;
        handle.addEventListener('pointerdown', event => {
            if (!desktop.matches || event.button !== 0 || drag) return;
            event.preventDefault();event.stopPropagation();handle.focus();
            drag = {side, handle, pointerId: event.pointerId, startX: event.clientX, width: actualWidths()[side], before: {...preferences}};
            handle.setPointerCapture(event.pointerId);
            handle.classList.add('is-dragging');
            document.body.classList.add('is-resizing-panels');
        });
        handle.addEventListener('pointermove', event => {
            if (!drag || drag.pointerId !== event.pointerId || drag.handle !== handle) return;
            changeWidth(side, drag.width + (event.clientX - drag.startX) * (side === 'left' ? 1 : -1));
        });
        handle.addEventListener('pointerup', event => {if (drag?.pointerId === event.pointerId) endDrag();});
        handle.addEventListener('pointercancel', () => endDrag(true));
        handle.addEventListener('lostpointercapture', () => endDrag(true));
        handle.addEventListener('dblclick', event => {
            event.preventDefault();
            if (!desktop.matches) return;
            delete preferences[side];applyWidths();saveWidths();
        });
        handle.addEventListener('keydown', event => {
            if (event.key === 'Escape' && drag) {event.preventDefault();endDrag(true);return;}
            if (!desktop.matches || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            if (drag) return; // A drag is committed only on pointerup, or cancelled by Esc.
            const step = event.shiftKey ? 40 : 10, width = actualWidths()[side];
            const delta = (event.key === 'ArrowRight' ? 1 : -1) * (side === 'left' ? 1 : -1) * step;
            const value = event.key === 'Home' ? limits[side].min : event.key === 'End' ? Number(handle.getAttribute('aria-valuemax')) : width + delta;
            changeWidth(side, value);saveWidths();
        });
    }
    window.addEventListener('resize', () => {endDrag(true);applyWidths();});
    window.addEventListener('blur', () => endDrag(true));
    applyWidths();
    const paths = {
        1: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
        2: '<path d="m5 3 14 10-7 1-3 7-4-18Z"/>',
        3: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
        4: '<path d="M4 5h16M12 5v15M8 20h8"/>',
        5: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18"/>',
        6: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m8 10 4 4 4-4"/>',
        7: '<path d="M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3m-9-9-3 3 3 3m12-6 3 3-3 3"/>',
        8: '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 1M4 17l1 1a8 8 0 0 0 14-1"/>',
        9: '<path d="m12 2 10 10-10 10L2 12 10 2Z"/>',
        10: '<circle cx="5" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><path d="m8 8 12 13M8 16 20 3"/>',
        11: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
        12: '<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
        13: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
        0: '<path d="m8 3-5 5 5 5M3 8h10a8 8 0 0 1 0 16"/>'
    };
    const svg = (op, className = '') => `<svg xmlns="http://www.w3.org/2000/svg" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[op] || paths[3]}</svg>`;
    const tools = [...document.querySelectorAll('.options')];
    tools.forEach(button => {
        button.style.setProperty('--tool-icon', `url("data:image/svg+xml,${encodeURIComponent(svg(Number(button.getAttribute('data'))))}")`);
        button.addEventListener('mousedown', () => {
            tools.forEach(other => other.classList.toggle('is-active', other === button && Number(button.getAttribute('data')) !== 0));
            document.querySelector('#active-tool').textContent = Number(button.getAttribute('data')) === 0 ? '' : button.textContent.trim();
        });
    });
    // The original handlers use mousedown. Bridge keyboard activation to them.
    [...tools, ...document.querySelectorAll('#saveButton, #saveAsButton')].forEach(button => {
        button.addEventListener('click', event => {
            if (event.isTrusted && event.detail === 0) button.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
        });
    });
    // Tabs affect visibility only. Every original setting stays mounted for saveService.
    const settingsModal = document.querySelector('#myModal');
    const settingsTabs = [...settingsModal.querySelectorAll('[data-settings-tab]')];
    const settingsContent = settingsModal.querySelector('.task-settings-content');
    const compactSettings = window.matchMedia('(max-width: 600px)');
    function selectSettingsTab(tab, focus = false) {
        settingsTabs.forEach(item => {
            const selected = item === tab;
            item.classList.toggle('is-active', selected);
            item.setAttribute('aria-selected', String(selected));
            item.tabIndex = selected ? 0 : -1;
            document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
        });
        settingsContent.scrollTop = 0;
        if (focus) tab.focus({preventScroll: true});
    }
    settingsTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectSettingsTab(tab));
        tab.addEventListener('keydown', event => {
            const previous = compactSettings.matches ? 'ArrowLeft' : 'ArrowUp';
            const next = compactSettings.matches ? 'ArrowRight' : 'ArrowDown';
            if (![previous, next, 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const target = event.key === 'Home' ? 0 : event.key === 'End' ? settingsTabs.length - 1
                : (index + (event.key === next ? 1 : -1) + settingsTabs.length) % settingsTabs.length;
            selectSettingsTab(settingsTabs[target], true);
        });
    });
    function settingsOrientation() {
        settingsModal.querySelector('[role="tablist"]').setAttribute('aria-orientation', compactSettings.matches ? 'horizontal' : 'vertical');
    }
    compactSettings.addEventListener('change', settingsOrientation);
    settingsOrientation();
    function updateOutputHints() {
        const format = document.querySelector('#outputFormat').value;
        const mysql = format === 'mysql';
        settingsModal.querySelector('label[for="saveName"]').textContent = mysql ? words('数据库表名', 'Database table name') : words('导出文件名', 'Export file name');
        const hints = {
            saveName: mysql ? words('以字母或汉字开头，后续可用字母、汉字、数字、下划线；最多 64 个字符。', 'Start with a letter or Chinese character; continue with letters, Chinese characters, numbers or underscores. Maximum 64 characters.')
                : words('current_time 会替换为执行时间；可用相对路径设置文件位置。', 'current_time is replaced with execution time; use a relative path to set the file location.'),
            outputFormat: format === 'xlsx' ? words('长文章或较长的单元格内容，建议选择 CSV。', 'Choose CSV for long articles or long cell contents.')
                : mysql ? words('保存到 MySQL 数据库；连接配置见使用说明中的教程。', 'Save to MySQL; see the tutorial in Usage notes for connection setup.') : '',
            dataWriteMode: ({1: words('目标已存在时，继续追加数据。', 'Append data when the destination already exists.'),
                2: words('目标已存在时，覆盖已有数据。', 'Overwrite existing data when the destination already exists.'),
                3: mysql ? words('MySQL 不重命名表，此模式按追加写入处理。', 'MySQL does not rename tables; this mode appends data.')
                    : words('目标文件已存在时，为新文件增加编号后写入。', 'Add a number to the new file name when the destination file already exists.')})[document.querySelector('#dataWriteMode').value],
            removeDuplicate: document.querySelector('#removeDuplicate').value === '1'
                ? words('任务结束后去重；中途退出不去重。跨次执行需固定文件名和执行 ID。', 'Deduplicate at completion, not on early exit. Across runs, use a fixed file name and execution ID.') : ''
        };
        Object.entries(hints).forEach(([key, text]) => {
            const hint = settingsModal.querySelector(`[data-setting-hint="${key}"]`);
            hint.textContent = text || '';
            hint.hidden = !text;
        });
    }
    settingsModal.addEventListener('change', updateOutputHints);
    // Loading an existing task sets values through jQuery without firing change.
    $('#myModal').on('shown.bs.modal', () => {
        selectSettingsTab(settingsTabs[0]);
        updateOutputHints();
    });
    updateOutputHints();
    // New steps receive some parameters after Vue observes the node. Refresh the
    // conditional controls after the original v-model handler updates those keys.
    document.querySelector('#app').addEventListener('change', event => {
        if (event.target.matches('[data-param="scrollType"], [data-param="optionMode"]')) app.$forceUpdate();
    });
    const search = document.querySelector('#tool-search');
    search.addEventListener('input', () => {
        const query = search.value.trim().toLocaleLowerCase();
        let matches = 0;
        document.querySelectorAll('.tool-group').forEach(group => {
            let count = 0;
            group.querySelectorAll('.options').forEach(button => {
                const match = button.textContent.toLocaleLowerCase().includes(query);
                button.hidden = !match;
                if (match) count++;
            });
            group.hidden = count === 0;
            if (query && count) group.open = true;
            matches += count;
        });
        document.querySelector('#tool-empty').hidden = matches > 0;
    });

    const graph = document.querySelector('#flowchart_graph');
    const center = document.querySelector('#center-flow');
    center.addEventListener('click', () => {
        const target = graph.querySelector('.is-selected') || graph.querySelector('.flow-start');
        if (!target) return;
        const canvasBox = graph.getBoundingClientRect(), targetBox = target.getBoundingClientRect();
        graph.scrollTo({left: graph.scrollLeft + targetBox.left - canvasBox.left - (graph.clientWidth - targetBox.width) / 2,
            top: graph.scrollTop + targetBox.top - canvasBox.top - (graph.clientHeight - targetBox.height) / 2});
    });

    function captionFor(node) {
        const params = node.parameters || {};
        if (node.option === 1) return String(params.links || params.url || '').split('\n')[0];
        if (node.option === 3) return (params.params || params.paras || []).map(field => field.name).join(words('、', ', '));
        if (node.option === 4) return String(params.value || '');
        if (node.option === 2 || node.option === 7 || node.option === 6) return String(params.xpath || '');
        if (node.option === 5) return words('自定义脚本与操作', 'Custom scripts and actions');
        return '';
    }
    function decorate() {
        syncFieldNumber();
        const taskName = document.querySelector('#serviceName').value || words('新任务', 'New task');
        const heading = document.querySelector('#editor-task-name');
        if (heading.textContent !== taskName) heading.textContent = taskName;
        heading.title = taskName;
        const start = graph.querySelector('.canvas-root > div:first-child');
        if (start) {
            start.classList.add('flow-terminus', 'flow-start');
            start.dataset.label = words('开始', 'Start');
            if (!start.querySelector('svg')) start.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 13 8-13 8Z" fill="currentColor"/></svg>';
        }
        tools.forEach(button => button.classList.toggle('is-active', option !== 0 && Number(button.getAttribute('data')) === option));
        const selectedTool = tools.find(button => option !== 0 && Number(button.getAttribute('data')) === option);
        const toolLabel = selectedTool ? selectedTool.textContent.trim() : '';
        if (document.querySelector('#active-tool').textContent !== toolLabel) document.querySelector('#active-tool').textContent = toolLabel;
        graph.querySelectorAll('.clk[data]:not(.canvas-root)').forEach(element => {
            const node = nodeList[actionSequence[Number(element.getAttribute('data'))]];
            if (!node) return;
            const selected = node.index === vueData.nowNodeIndex && app.nodeType !== 0;
            element.classList.toggle('is-selected', selected);
            element.tabIndex = 0;
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', words('步骤 ', 'Step ') + node.id + ': ' + node.title);
            element.setAttribute('aria-pressed', String(selected));
            if (!element.classList.contains('node')) return;
            if (!element.querySelector('.node-icon')) element.insertAdjacentHTML('afterbegin', svg(node.option, 'node-icon'));
            const content = element.querySelector('div');
            let caption = content.querySelector('.node-caption');
            if (!caption) {caption = document.createElement('span');caption.className = 'node-caption';content.append(caption);}
            const text = captionFor(node);
            if (caption.textContent !== text) caption.textContent = text;
            caption.hidden = !text;
            caption.title = text;
            let number = element.querySelector('.node-step');
            if (!number) {number = document.createElement('span');number.className = 'node-step';number.setAttribute('aria-hidden', 'true');element.append(number);}
            if (number.textContent !== String(node.id)) number.textContent = node.id;
        });
        graph.querySelectorAll('.arrow').forEach(arrow => {
            const anchor = app.nowArrow;
            arrow.classList.toggle('is-anchor', String(anchor.position) === arrow.getAttribute('position') && String(anchor.pId) === arrow.getAttribute('pid'));
            arrow.tabIndex = 0;
            arrow.setAttribute('role', 'button');
            arrow.setAttribute('aria-label', words('在此插入操作；双击调整锚点', 'Insert action here; double-click to set anchor'));
        });
        const count = document.querySelector('#flow-step-count');
        const text = words('共 ', '') + Math.max(0, actionSequence.length - 1) + words(' 个步骤', ' steps');
        if (count.textContent !== text) count.textContent = text;
    }
    let scheduled = false;
    const schedule = () => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {scheduled = false;decorate();});
    };
    new MutationObserver(schedule).observe(graph, {subtree: true, childList: true, attributes: true, attributeFilter: ['style']});
    app.$watch('index.nowNodeIndex', schedule);
    app.$watch('nowArrow', schedule, {deep: true});
    document.querySelector('#serviceName').addEventListener('input', schedule);
    document.querySelector('#myModal').addEventListener('change', schedule);
    graph.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (!event.target.matches('.clk:not(.canvas-root), .arrow')) return;
        event.preventDefault();event.target.click();
    });
    // Keep the current field selected when the existing methods reorder or remove rows.
    ['upParam', 'downParam', 'deleteParam'].forEach(method => {
        const original = app[method];
        app[method] = function(index) {
            const selected = app.params.parameters[app.paraIndex];
            const moved = app.params.parameters[index];
            const focused = document.activeElement;
            const keepFocus = focused && focused.matches('.field-action');
            const actionClass = method === 'upParam' ? '.field-action--up' : '.field-action--down';
            const result = original(index);
            if (method === 'deleteParam') syncFieldNumber();
            if (app.nodeType === 3 && app.params.parameters.length) {
                const position = app.params.parameters.indexOf(selected);
                app.paraIndex = position >= 0 ? position : Math.min(index, app.params.parameters.length - 1);
            }
            if (keepFocus) app.$nextTick(() => {
                if (app.nodeType !== 3) return;
                const position = method === 'deleteParam' ? Math.min(index, app.params.parameters.length - 1) : app.params.parameters.indexOf(moved);
                const row = document.querySelectorAll('.toolkittb4 tbody tr')[position];
                if (!row) return;
                const action = method === 'deleteParam' ? null : row.querySelector(actionClass);
                const target = action && !action.disabled ? action : row.querySelector('.field-select');
                if (target) target.focus({preventScroll: true});
            });
            return result;
        };
    });
    schedule();
})();
