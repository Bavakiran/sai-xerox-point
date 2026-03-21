document.addEventListener('DOMContentLoaded', () => {
    const billItemsContainer = document.getElementById('billItems');
    const addItemBtn = document.getElementById('addItemBtn');
    const subTotalEl = document.getElementById('subTotal');
    const taxRateEl = document.getElementById('taxRate');
    const grandTotalEl = document.getElementById('grandTotal');
    const pTaxAmountEl = document.getElementById('pTaxAmount');
    const printTaxRow = document.getElementById('printTaxRow');
    const printBtn = document.getElementById('printBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');

    // Auto set date
    document.getElementById('billDate').valueAsDate = new Date();
    document.getElementById('billNo').value = 'INV-' + Math.floor(100000 + Math.random() * 900000);

    function calculateTotals() {
        let subtotal = 0;
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const total = qty * price;
            
            // Format to 2 decimal places for display, but keep original for calculation
            row.querySelector('.total-val').textContent = total.toFixed(2);
            subtotal += total;
        });

        const taxRate = parseFloat(taxRateEl.value) || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const grandTotal = subtotal + taxAmount;

        subTotalEl.textContent = subtotal.toFixed(2);
        grandTotalEl.textContent = grandTotal.toFixed(2);
        
        pTaxAmountEl.textContent = taxAmount.toFixed(2);
        if (taxAmount > 0) {
            printTaxRow.style.display = 'flex';
        } else {
            printTaxRow.style.display = 'none';
        }
    }

    function createRow() {
        const tr = document.createElement('tr');
        tr.className = 'item-row';
        tr.innerHTML = `
            <td><input type="text" class="item-input desc-input" placeholder="Enter Item Description"></td>
            <td><input type="number" class="item-input qty-input" value="1" min="1"></td>
            <td><input type="number" class="item-input price-input text-right" value="0.00" min="0" step="0.01"></td>
            <td class="text-right">₹<span class="total-val">0.00</span></td>
            <td class="hide-print text-center"><button class="btn-icon delete-btn"><i class="ph ph-trash"></i></button></td>
        `;

        tr.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateTotals);
        });

        tr.querySelector('.delete-btn').addEventListener('click', () => {
            tr.remove();
            calculateTotals();
        });

        billItemsContainer.appendChild(tr);
    }

    // Initialize with 3 empty rows
    createRow();
    createRow();
    createRow();

    addItemBtn.addEventListener('click', createRow);
    taxRateEl.addEventListener('input', calculateTotals);

    function prepareForPrint() {
        // Set values for print elements
        document.getElementById('pBillNo').textContent = document.getElementById('billNo').value || 'AUTO';
        
        const bDate = document.getElementById('billDate').value;
        document.getElementById('pBillDate').textContent = bDate ? new Date(bDate).toLocaleDateString('en-IN') : '';
        
        const cName = document.getElementById('customerName').value || 'Customer';
        const cPhone = document.getElementById('customerPhone').value;
        document.getElementById('pCustomerInfo').textContent = cName + (cPhone ? ` | ${cPhone}` : '');

        // Hide empty rows
        const rows = document.querySelectorAll('.item-row');
        rows.forEach(row => {
            const desc = row.querySelector('.desc-input').value.trim();
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            if (!desc && price === 0) {
                row.classList.add('hide-print');
            } else {
                row.classList.remove('hide-print');
            }
        });
    }

    printBtn.addEventListener('click', () => {
        prepareForPrint();
        window.print();
    });

    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            prepareForPrint();
            
            const element = document.querySelector('.bill-container');
            const billNo = document.getElementById('billNo').value || 'invoice';
            
            // Temporary styles for PDF export
            element.classList.add('pdf-export-mode');
            const oldWidth = element.style.width;
            const oldPadding = element.style.padding;
            
            // Force light theme for PDF
            element.style.background = '#ffffff';
            element.style.color = '#000000';
            
            // Generate PDF
            const opt = {
                margin:       10,
                filename:     `${billNo}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Needs to find a way to convert our inputs to spans for PDF because inputs don't render well in some html2canvas versions.
            // A quick fix is replacing inputs with their values temporarily
            const inputs = element.querySelectorAll('.item-input');
            const backups = [];
            
            inputs.forEach(input => {
                const val = input.value;
                const span = document.createElement('span');
                span.textContent = val;
                span.className = 'temp-pdf-span';
                span.style.display = 'inline-block';
                span.style.padding = '8px 12px';
                if(input.classList.contains('text-right')) span.style.textAlign = 'right';
                
                backups.push({
                    parent: input.parentNode,
                    input: input,
                    val: val
                });
                
                input.style.display = 'none';
                input.parentNode.appendChild(span);
            });

            html2pdf().set(opt).from(element).save().then(() => {
                // Restore inputs
                backups.forEach(b => {
                    const tempSpan = b.parent.querySelector('.temp-pdf-span');
                    if(tempSpan) b.parent.removeChild(tempSpan);
                    b.input.style.display = 'inline-block';
                });
                
                element.style.background = '';
                element.style.color = '';
                element.classList.remove('pdf-export-mode');
            });
        });
    }

    resetBtn.addEventListener('click', () => {
        if(confirm('Are you sure you want to reset the entire bill?')) {
            billItemsContainer.innerHTML = '';
            document.getElementById('customerName').value = '';
            document.getElementById('customerPhone').value = '';
            document.getElementById('taxRate').value = '0';
            document.getElementById('billNo').value = 'INV-' + Math.floor(100000 + Math.random() * 900000);
            
            createRow();
            createRow();
            createRow();
            calculateTotals();
        }
    });
});
