document.addEventListener('DOMContentLoaded', () => {
    const scanId = document.getElementById('scan-id').textContent;
    loadReportData(scanId);
    setupFilters();
});

async function loadReportData(scanId) {
    try {
        const findings = await fetch(`/api/findings?scan_id=${scanId}`).then(res => res.json());
        renderSummary(findings);
        populateResourceFilter(findings);
        renderTable(findings);
    } catch (error) {
        console.error('Erro ao carregar relatório:', error);
    }
}

function renderSummary(findings) {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    findings.forEach(f => counts[f.risk] = (counts[f.risk] || 0) + 1);

    document.getElementById('report-summary').innerHTML = `
        <div class="col-md-3">
            <div class="card text-white bg-danger shadow-sm">
                <div class="card-body">
                    <h6>CRITICAL</h6>
                    <h2>${counts.CRITICAL}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-warning shadow-sm">
                <div class="card-body">
                    <h6>HIGH</h6>
                    <h2>${counts.HIGH}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-info shadow-sm">
                <div class="card-body">
                    <h6>MEDIUM</h6>
                    <h2>${counts.MEDIUM}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-white bg-success shadow-sm">
                <div class="card-body">
                    <h6>LOW</h6>
                    <h2>${counts.LOW}</h2>
                </div>
            </div>
        </div>
    `;
}

function populateResourceFilter(findings) {
    const types = [...new Set(findings.map(f => f.resource_type))];
    const select = document.getElementById('filter-resource');
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function setupFilters() {
    document.getElementById('filter-severity').addEventListener('change', applyFilters);
    document.getElementById('filter-resource').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('export-csv').addEventListener('click', () => {
        const scanId = document.getElementById('scan-id').textContent;
        window.location.href = `/api/export/${scanId}/csv`;
    });
}

function applyFilters() {
    const severity = document.getElementById('filter-severity').value;
    const resource = document.getElementById('filter-resource').value;
    const search = document.getElementById('search-input').value.toLowerCase();

    const rows = document.querySelectorAll('#report-table tbody tr');
    rows.forEach(row => {
        const risk = row.dataset.risk;
        const type = row.dataset.resource;
        const text = row.textContent.toLowerCase();
        const matchesSeverity = severity === 'all' || risk === severity;
        const matchesResource = resource === 'all' || type === resource;
        const matchesSearch = text.includes(search);
        row.style.display = (matchesSeverity && matchesResource && matchesSearch) ? '' : 'none';
    });
}

function renderTable(findings) {
    const tbody = document.querySelector('#report-table tbody');
    tbody.innerHTML = findings.map(f => `
        <tr data-risk="${f.risk}" data-resource="${f.resource_type}">
            <td>${f.resource_type}</td>
            <td><code>${f.resource_id}</code></td>
            <td><span class="badge badge-${f.risk.toLowerCase()}">${f.risk}</span></td>
            <td>${f.detail}</td>
        </tr>
    `).join('');
}