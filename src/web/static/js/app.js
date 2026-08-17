// Frontend JavaScript para o dashboard AWS Security Scanner

// URLs da API (ajuste conforme seu backend)
const API_BASE = '/api';
const API_SCANS = `${API_BASE}/scans`;
const API_FINDINGS = `${API_BASE}/findings`;

// Variáveis globais
let latestScanId = null;
let severityChart = null;
let historyChart = null;
let currentFilter = 'all';

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupEventListeners();
});

// Configura listeners de eventos
function setupEventListeners() {
    document.getElementById('filter-severity').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        loadFindings(latestScanId, currentFilter);
    });

    document.getElementById('export-csv').addEventListener('click', () => {
        if (latestScanId) {
            window.location.href = `${API_BASE}/export/${latestScanId}/csv`;
        }
    });
}

// Carrega dados do dashboard
async function loadDashboard() {
    try {
        // Busca lista de scans
        const scans = await fetch(API_SCANS).then(res => res.json());
        
        // Atualiza cards de resumo
        updateSummaryCards(scans);
        
        // Atualiza gráfico de histórico
        updateHistoryChart(scans);
        
        // Se houver scans, carrega o último
        if (scans.length > 0) {
            latestScanId = scans[scans.length - 1].id;
            await loadFindings(latestScanId);
            await loadSeverityChart(latestScanId);
        } else {
            // Nenhum scan encontrado
            document.getElementById('findings-table').querySelector('tbody').innerHTML = 
                '<tr><td colspan="4" class="text-center text-muted">Nenhum scan encontrado.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

// Atualiza cards de resumo
function updateSummaryCards(scans) {
    const container = document.getElementById('summary-cards');
    const totalScans = scans.length;
    const latestFindings = scans.length > 0 ? scans[scans.length - 1].total_findings : 0;
    const criticalCount = scans.length > 0 ? scans[scans.length - 1].critical_count || 0 : 0;
    const highCount = scans.length > 0 ? scans[scans.length - 1].high_count || 0 : 0;

    container.innerHTML = `
        <div class="col-md-3 mb-3">
            <div class="card text-white bg-primary shadow-sm">
                <div class="card-body">
                    <h6 class="card-title">Total de Scans</h6>
                    <h2 class="mb-0">${totalScans}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-white bg-dark shadow-sm">
                <div class="card-body">
                    <h6 class="card-title">Findings no Último Scan</h6>
                    <h2 class="mb-0">${latestFindings}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-white bg-danger shadow-sm">
                <div class="card-body">
                    <h6 class="card-title">CRITICAL</h6>
                    <h2 class="mb-0">${criticalCount}</h2>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-white bg-warning shadow-sm">
                <div class="card-body">
                    <h6 class="card-title">HIGH</h6>
                    <h2 class="mb-0">${highCount}</h2>
                </div>
            </div>
        </div>
    `;
}

// Atualiza gráfico de histórico de scans
function updateHistoryChart(scans) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    // Destroi gráfico anterior se existir
    if (historyChart) {
        historyChart.destroy();
    }

    const labels = scans.map(s => s.timestamp.split('T')[0]);
    const data = scans.map(s => s.total_findings);

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total de Findings',
                data: data,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// Atualiza gráfico de severidade do último scan
async function loadSeverityChart(scanId) {
    try {
        const findings = await fetch(`${API_FINDINGS}?scan_id=${scanId}`).then(res => res.json());
        const severityCounts = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        };

        findings.forEach(f => {
            if (severityCounts.hasOwnProperty(f.risk)) {
                severityCounts[f.risk]++;
            }
        });

        const ctx = document.getElementById('severityChart').getContext('2d');
        if (severityChart) {
            severityChart.destroy();
        }

        severityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                datasets: [{
                    data: [
                        severityCounts.CRITICAL,
                        severityCounts.HIGH,
                        severityCounts.MEDIUM,
                        severityCounts.LOW
                    ],
                    backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao carregar gráfico de severidade:', error);
    }
}

// Carrega findings de um scan
async function loadFindings(scanId, filter = 'all') {
    if (!scanId) return;

    try {
        let url = `${API_FINDINGS}?scan_id=${scanId}`;
        if (filter !== 'all') {
            url += `&risk=${filter}`;
        }

        const findings = await fetch(url).then(res => res.json());
        renderFindingsTable(findings);
    } catch (error) {
        console.error('Erro ao carregar findings:', error);
    }
}

// Renderiza tabela de findings
function renderFindingsTable(findings) {
    const tbody = document.querySelector('#findings-table tbody');
    
    if (findings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum finding encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = findings.map(f => `
        <tr>
            <td>${f.resource_type}</td>
            <td><code>${f.resource_id}</code></td>
            <td><span class="badge badge-${f.risk.toLowerCase()}">${f.risk}</span></td>
            <td>${f.detail}</td>
        </tr>
    `).join('');
}