// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const CORRECT_PASSWORD = "Bavakiran@321";
    let textOld = null, textNew = null;

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (sessionStorage.getItem('docAuth') === 'true') showTool();

    document.getElementById('loginBtn').addEventListener('click', () => {
        const pw = document.getElementById('authPassword').value;
        if (pw === CORRECT_PASSWORD) {
            sessionStorage.setItem('docAuth', 'true');
            showTool();
        } else {
            document.getElementById('authError').style.display = 'block';
            document.getElementById('authPassword').value = '';
        }
    });
    document.getElementById('authPassword').addEventListener('keypress', e => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });

    function showTool() {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('toolContainer').style.display = 'block';
    }

    // ── File Handlers ──────────────────────────────────────────────────────────
    document.getElementById('fileOld').addEventListener('change', async function () {
        textOld = await handleFile(this.files[0], 'previewOld', 'statusOld', 'textOld');
        checkReady();
    });
    document.getElementById('fileNew').addEventListener('change', async function () {
        textNew = await handleFile(this.files[0], 'previewNew', 'statusNew', 'textNew');
        checkReady();
    });

    function checkReady() {
        const btn = document.getElementById('compareBtn');
        const msg = document.getElementById('readyMsg');
        if (textOld && textNew) {
            btn.disabled = false;
            msg.textContent = 'Both documents ready — click Compare';
            msg.style.color = '#10b981';
        } else {
            btn.disabled = true;
            msg.textContent = 'Upload both documents first';
            msg.style.color = '';
        }
    }

    async function handleFile(file, previewId, statusId, textId) {
        if (!file) return null;
        const status = document.getElementById(statusId);
        const preview = document.getElementById(previewId);

        // Show preview
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            preview.innerHTML = `<img src="${url}" alt="preview" style="width:100%;border-radius:8px;margin-top:10px;">`;
            return await runOCR(url, status, textId);
        } else if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            return await handlePdf(url, preview, status, textId);
        } else {
            status.innerHTML = '<span style="color:#ef4444">Unsupported file type</span>';
            return null;
        }
    }

    // Walks every page. Real (typed) text layer is used straight off —
    // it's exact and instant. A page only gets rasterized + OCR'd if it has
    // no usable text layer (i.e. it's a scan/photo). Mixed PDFs (some typed
    // pages, some scanned pages) are handled per-page automatically.
    async function handlePdf(url, preview, status, textId) {
        try {
            status.innerHTML = '<span class="ocr-running">Reading PDF...</span>';
            const pdf = await pdfjsLib.getDocument(url).promise;
            let fullText = '';
            let firstPageCanvas = null;
            let ocrWorker = null;

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const content = await page.getTextContent();
                const pageText = content.items.map(i => i.str).join(' ').trim();

                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                if (pageNum === 1) firstPageCanvas = canvas;

                if (pageText.length > 20) {
                    // real text layer present — use it, no OCR needed
                    status.innerHTML = `<span class="ocr-running">Page ${pageNum}/${pdf.numPages} — text layer found</span>`;
                    fullText += pageText + '\n';
                } else {
                    // scanned/photo page — OCR it
                    status.innerHTML = `<span class="ocr-running"><i class="ph ph-spinner-gap ph-spin"></i> OCR page ${pageNum}/${pdf.numPages}...</span>`;
                    if (!ocrWorker) ocrWorker = await Tesseract.createWorker('eng');
                    const { data: { text } } = await ocrWorker.recognize(canvas);
                    fullText += text + '\n';
                }
            }
            if (ocrWorker) await ocrWorker.terminate();

            preview.innerHTML = '';
            if (firstPageCanvas) {
                firstPageCanvas.style.width = '100%';
                firstPageCanvas.style.borderRadius = '8px';
                firstPageCanvas.style.marginTop = '10px';
                preview.appendChild(firstPageCanvas);
            }

            status.innerHTML = '<span style="color:#10b981"><i class="ph ph-check-circle"></i> Done — ' + pdf.numPages + ' page(s) read</span>';
            document.getElementById(textId).textContent = fullText.trim();
            document.getElementById('extractedSection').style.display = 'block';
            return fullText.trim();
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444">PDF read failed: ' + err.message + '</span>';
            return null;
        }
    }

    async function runOCR(source, status, textId) {
        status.innerHTML = '<span class="ocr-running"><i class="ph ph-spinner-gap ph-spin"></i> Running OCR — processing locally...</span>';
        try {
            const worker = await Tesseract.createWorker('eng');
            const { data: { text } } = await worker.recognize(source);
            await worker.terminate();
            status.innerHTML = '<span style="color:#10b981"><i class="ph ph-check-circle"></i> OCR complete</span>';
            document.getElementById(textId).textContent = text;
            document.getElementById('extractedSection').style.display = 'block';
            return text;
        } catch (err) {
            status.innerHTML = '<span style="color:#ef4444">OCR failed: ' + err.message + '</span>';
            return null;
        }
    }

    // ── Compare ────────────────────────────────────────────────────────────────
    document.getElementById('compareBtn').addEventListener('click', () => {
        if (!textOld || !textNew) return;
        const fieldsOld = parseDocFields(textOld);
        const fieldsNew = parseDocFields(textNew);
        renderReport(fieldsOld, fieldsNew);
    });

    // Field definitions with multiple regex patterns to try
    const FIELD_PATTERNS = [
        {
            key: 'Seller Name (Executant)',
            patterns: [
                /executant[:\s]+([A-Z][A-Za-z\s]+?)(?:\s+aged|\s+w\/o|\s+s\/o|\s+d\/o|\n)/i,
                /seller[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /vendor[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /sold by[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /(?:(?:W\/o|S\/o|D\/o)\s+\S+\s+)([A-Z]{2,}\s+[A-Z]{2,}(?:\s+[A-Z]{2,})?)/,
            ]
        },
        {
            key: 'Buyer Name (Claimant)',
            patterns: [
                /claimant[:\s]+([A-Z][A-Za-z\s]+?)(?:\s+aged|\s+w\/o|\s+s\/o|\n)/i,
                /purchaser[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /buyer[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /sold to[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
                /vendee[:\s]+([A-Z][A-Za-z\s]{4,40})/i,
            ]
        },
        {
            key: 'Survey Number',
            patterns: [
                /survey\s*no[.\s:]+(\d+[\s/\\-]*\w*)/i,
                /s\.?f\.?\s*no[.\s:]+(\d+[\s/\\-]*\w*)/i,
                /s\.?\s*no[.\s:]+(\d+[\s/\\-]*\w*)/i,
                /plot\s*no[.\s:]+(\d+[\s/\\-]*\w*)/i,
            ]
        },
        {
            key: 'Extent / Measurement',
            patterns: [
                /(\d[\d.,]*\s*(?:sq\.?\s*ft|sqft|square\s*feet|cents?|acres?|guntas?|grounds?))/i,
                /extent[:\s]+([^\n,]+)/i,
                /area[:\s]+([\d.,]+\s*\w+)/i,
            ]
        },
        {
            key: 'Village / Taluk / District',
            patterns: [
                /village[:\s]+([A-Za-z\s]+?)(?:\s*taluk|\s*district|\n|,)/i,
                /taluk[:\s]+([A-Za-z\s]+?)(?:\s*district|\n|,)/i,
                /district[:\s]+([A-Za-z\s]+?)(?:\n|,)/i,
            ]
        },
        {
            key: 'Document Date / Year',
            patterns: [
                /date[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
                /dated?[:\s]+(\d{1,2}\s+\w+\s+\d{4})/i,
                /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
                /(\d{4})\s*(?:th\s+)?year/i,
            ]
        },
        {
            key: 'Consideration Amount',
            patterns: [
                /(?:rs|₹|rupees)[.\s]*(\d[\d,]*(?:\s*(?:lakhs?|lacs?|crores?))?)/i,
                /consideration[:\s]+(?:rs\.?\s*)?(\d[\d,]+)/i,
                /(\d[\d,]+)\s*(?:\/\-|rupees)/i,
            ]
        },
        {
            key: 'Property Address / Door No.',
            patterns: [
                /door\s*no[.\s:]+([^\n]+)/i,
                /plot\s*no[.\s:]+([^\n]+)/i,
                /flat\s*no[.\s:]+([^\n]+)/i,
                /house\s*no[.\s:]+([^\n]+)/i,
                /no[.\s]+(\d+[\w\-\/]+[^\n,]{0,60})/i,
            ]
        },
        {
            key: 'PAN Number',
            patterns: [
                /pan\s*[:#\s]+([A-Z]{5}\d{4}[A-Z])/i,
                /([A-Z]{5}\d{4}[A-Z])/,
            ]
        },
    ];

    function parseDocFields(text) {
        const result = {};
        FIELD_PATTERNS.forEach(({ key, patterns }) => {
            let found = null;
            for (const pat of patterns) {
                const m = text.match(pat);
                if (m && m[1] && m[1].trim().length > 1) {
                    found = m[1].trim().replace(/\s+/g, ' ');
                    break;
                }
            }
            result[key] = found || '';
        });
        return result;
    }

    function renderReport(fieldsOld, fieldsNew) {
        const tbody = document.getElementById('reportTableBody');
        tbody.innerHTML = '';
        let matches = 0, mismatches = 0, missing = 0;

        FIELD_PATTERNS.forEach(({ key }) => {
            const ov = fieldsOld[key] || '';
            const nv = fieldsNew[key] || '';
            let status, cls, bg = '';

            if (!ov && !nv) return; // skip both empty
            if (!ov || !nv) {
                status = 'Missing'; cls = 'status-missing'; bg = 'rgba(245,158,11,0.05)';
                missing++;
            } else if (ov.toLowerCase() === nv.toLowerCase()) {
                status = '✓ Match'; cls = 'status-match';
                matches++;
            } else {
                status = '✗ Mismatch'; cls = 'status-mismatch'; bg = 'rgba(239,68,68,0.05)';
                mismatches++;
            }

            const tr = document.createElement('tr');
            tr.style.backgroundColor = bg;
            tr.innerHTML = `
                <td><strong>${key}</strong></td>
                <td>${ov || '<em style="opacity:0.5">Not found</em>'}</td>
                <td>${nv || '<em style="opacity:0.5">Not found</em>'}</td>
                <td class="${cls}">${status}</td>
            `;
            tbody.appendChild(tr);
        });

        const total = matches + mismatches + missing;
        document.getElementById('reportSummary').innerHTML =
            `Fields checked: <strong>${total}</strong> &nbsp;|&nbsp;
             <span class="status-match">Matches: ${matches}</span> &nbsp;|&nbsp;
             <span class="status-mismatch">Mismatches: ${mismatches}</span> &nbsp;|&nbsp;
             <span class="status-missing">Missing: ${missing}</span>`;

        const rc = document.getElementById('resultsContainer');
        rc.style.display = 'block';
        rc.scrollIntoView({ behavior: 'smooth' });
    }
});