document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');
    const toolContainer = document.getElementById('toolContainer');
    const loginBtn = document.getElementById('loginBtn');
    const authPassword = document.getElementById('authPassword');
    const authError = document.getElementById('authError');
    const compareBtn = document.getElementById('compareBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const reportTableBody = document.getElementById('reportTableBody');
    const reportSummary = document.getElementById('reportSummary');

    const CORRECT_PASSWORD = "Bavakiran@321";

    if (sessionStorage.getItem('docAuth') === 'true') {
        showTool();
    }

    loginBtn.addEventListener('click', () => {
        if (authPassword.value === CORRECT_PASSWORD) {
            sessionStorage.setItem('docAuth', 'true');
            showTool();
        } else {
            authError.style.display = 'block';
            authPassword.value = '';
        }
    });

    authPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') loginBtn.click();
    });

    function showTool() {
        authContainer.style.display = 'none';
        toolContainer.style.display = 'block';
    }

    compareBtn.addEventListener('click', () => {
        const fields = document.querySelectorAll('.field-row');
        let matches = 0, mismatches = 0, missing = 0;

        reportTableBody.innerHTML = '';

        fields.forEach(row => {
            const label = row.querySelector('.field-label').value.trim();
            const oldVal = row.querySelector('.field-old').value.trim();
            const newVal = row.querySelector('.field-new').value.trim();

            if (!label) return;

            let status, cls, bgColor = '';
            if (!oldVal || !newVal) {
                status = 'Missing'; cls = 'status-missing';
                bgColor = 'rgba(245, 158, 11, 0.05)';
                missing++;
            } else if (oldVal.toLowerCase() === newVal.toLowerCase()) {
                status = 'Match'; cls = 'status-match';
                matches++;
            } else {
                status = 'Mismatch'; cls = 'status-mismatch';
                bgColor = 'rgba(239, 68, 68, 0.05)';
                mismatches++;
            }

            const tr = document.createElement('tr');
            tr.style.backgroundColor = bgColor;
            tr.innerHTML = `
                <td><strong>${label}</strong></td>
                <td>${oldVal || '<em>—</em>'}</td>
                <td>${newVal || '<em>—</em>'}</td>
                <td class="${cls}">${status}</td>
            `;
            reportTableBody.appendChild(tr);
        });

        const total = matches + mismatches + missing;
        if (total === 0) {
            alert('Please fill in at least one field row.');
            return;
        }

        reportSummary.textContent = `Fields checked: ${total} | Matches: ${matches} | Mismatches: ${mismatches} | Missing: ${missing}`;
        resultsContainer.style.display = 'block';
    });

    // Add row button
    document.getElementById('addRowBtn').addEventListener('click', addFieldRow);

    function addFieldRow() {
        const tbody = document.getElementById('fieldsBody');
        const tr = document.createElement('tr');
        tr.className = 'field-row';
        tr.innerHTML = `
            <td><input type="text" class="field-label form-input" placeholder="e.g. Seller Name"></td>
            <td><input type="text" class="field-old form-input" placeholder="Value from original doc"></td>
            <td><input type="text" class="field-new form-input" placeholder="Value from new draft"></td>
            <td><button type="button" class="btn-remove" onclick="this.closest('tr').remove()">✕</button></td>
        `;
        tbody.appendChild(tr);
    }

    // Pre-populate default fields
    const defaultFields = [
        'Seller Name', 'Buyer Name', "Father's/Husband's Name",
        'Survey Number', 'Extent / Measurement', 'Village / Taluk / District',
        'Property Address', 'Document Date / Year', 'Consideration Amount'
    ];
    defaultFields.forEach(() => addFieldRow());

    // Set placeholder labels
    const rows = document.querySelectorAll('.field-row');
    defaultFields.forEach((label, i) => {
        if (rows[i]) rows[i].querySelector('.field-label').value = label;
    });
});
