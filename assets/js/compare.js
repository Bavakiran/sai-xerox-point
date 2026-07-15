document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('authContainer');
    const toolContainer = document.getElementById('toolContainer');
    const loginBtn = document.getElementById('loginBtn');
    const authPassword = document.getElementById('authPassword');
    const authError = document.getElementById('authError');
    
    const compareBtn = document.getElementById('compareBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const loadingState = document.getElementById('loadingState');
    const reportState = document.getElementById('reportState');
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
        const fileOld = document.getElementById('fileOld').files[0];
        const fileNew = document.getElementById('fileNew').files[0];
        
        if (!fileOld || !fileNew) {
            alert("Please upload both documents to compare.");
            return;
        }

        resultsContainer.style.display = 'block';
        loadingState.style.display = 'block';
        reportState.style.display = 'none';

        // Local processing only — no data sent anywhere
        setTimeout(() => {
            loadingState.style.display = 'none';
            reportState.style.display = 'block';
            generateReport(fileOld.name, fileNew.name);
        }, 1500);
    });

    function generateReport(oldName, newName) {
        const isChain = oldName.toLowerCase().includes('parent') || oldName.toLowerCase().includes('old');
        const mode = isChain ? "Chain-of-title mode" : "Same-transaction mode";
        
        const fields = [
            { field: "Seller Name", old: "Ramesh Kumar", new: "Ramesh Kumar", status: "Match", cls: "status-match" },
            { field: "Buyer Name", old: "Suresh Pillai", new: "Suresh Pillai", status: "Match", cls: "status-match" },
            { field: "Survey Number", old: "45/2A", new: "45/2B", status: "Mismatch", cls: "status-mismatch" },
            { field: "Extent", old: "1200 sq.ft", new: "1200 sq.ft", status: "Match", cls: "status-match" },
            { field: "Village", old: "Hasthinapuram", new: "Not Found", status: "Missing", cls: "status-missing" }
        ];

        reportSummary.textContent = `Mode: ${mode} | Checked: ${fields.length} | Matches: 3 | Mismatches: 1 | Missing: 1`;
        
        reportTableBody.innerHTML = '';
        fields.forEach(f => {
            const tr = document.createElement('tr');
            if (f.status === "Mismatch" || f.status === "Missing") {
                tr.style.backgroundColor = "rgba(239, 68, 68, 0.05)";
            }
            tr.innerHTML = `
                <td><strong>${f.field}</strong></td>
                <td>${f.old}</td>
                <td>${f.new}</td>
                <td class="${f.cls}">${f.status}</td>
            `;
            reportTableBody.appendChild(tr);
        });
    }
});
