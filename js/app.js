/**
 * RadioAnalyzer - Main Application
 */

// Global state
let viewer = null;
let currentImageData = null;
let analysisResult = null;

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeConfig();
    setupLoginHandler();
    checkAuthAndInit();
});

/**
 * Setup login form handler
 */
function setupLoginHandler() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

/**
 * Handle login form submission
 */
function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (Auth.login(username, password)) {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        initializeApp();
        showToast('Connexion réussie', 'success');
    } else {
        showToast('Identifiants incorrects', 'error');
    }
}

/**
 * Check authentication and initialize
 */
function checkAuthAndInit() {
    const loginModal = document.getElementById('loginModal');
    const app = document.getElementById('app');

    if (Auth.isAuthenticated()) {
        loginModal.classList.add('hidden');
        app.classList.remove('hidden');
        initializeApp();
    } else {
        loginModal.classList.remove('hidden');
        app.classList.add('hidden');
    }
}

/**
 * Initialize main application
 */
function initializeApp() {
    // Initialize viewer
    viewer = new ImageViewer('#viewerContainer');

    // Setup event listeners
    setupFileUpload();
    setupViewerControls();
    setupAnalysis();
    setupNavigation();
}

/**
 * Setup file upload handlers
 */
function setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');

    // Click to select
    selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');

        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // New image button
    const newImageBtn = document.getElementById('newImageBtn');
    newImageBtn.addEventListener('click', () => {
        resetViewer();
    });
}

/**
 * Handle file selection
 */
async function handleFileSelect(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showToast('Format non supporté. Utilisez JPEG ou PNG.', 'error');
        return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
        showToast('Fichier trop volumineux (max 20MB)', 'error');
        return;
    }

    try {
        showLoading('Chargement de l\'image...');

        currentImageData = await viewer.loadImage(file);

        // Show viewer, hide upload zone
        document.getElementById('uploadZone').classList.add('hidden');
        document.getElementById('imageViewer').classList.remove('hidden');
        document.getElementById('newImageBtn').classList.remove('hidden');
        document.getElementById('analyzeBtn').classList.remove('hidden');
        document.getElementById('analyzeBtn').disabled = false;

        hideLoading();
        showToast('Image chargée avec succès', 'success');

    } catch (error) {
        hideLoading();
        showToast(error.message, 'error');
    }
}

/**
 * Reset viewer to initial state
 */
function resetViewer() {
    viewer.clear();
    currentImageData = null;
    analysisResult = null;

    // Reset UI
    document.getElementById('uploadZone').classList.remove('hidden');
    document.getElementById('imageViewer').classList.add('hidden');
    document.getElementById('newImageBtn').classList.add('hidden');
    document.getElementById('analyzeBtn').classList.add('hidden');
    document.getElementById('fileInput').value = '';

    // Reset anomalies list
    document.getElementById('anomaliesList').innerHTML = `
        <div class="empty-state">
            <p>Aucune analyse effectuée</p>
            <span>Uploadez une image et cliquez sur "Analyser"</span>
        </div>
    `;

    // Reset analysis memo
    document.getElementById('analysisMemo').innerHTML = `
        <div class="empty-state">
            <p>En attente d'analyse...</p>
            <span>Le rapport détaillé apparaîtra ici après l'analyse</span>
        </div>
    `;

    document.getElementById('copyReportBtn').disabled = true;
}

/**
 * Setup viewer controls
 */
function setupViewerControls() {
    // Zoom controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        viewer.zoomIn();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        viewer.zoomOut();
    });

    document.getElementById('zoomResetBtn').addEventListener('click', () => {
        viewer.resetZoom();
    });

    // Draw mode
    document.getElementById('drawModeBtn').addEventListener('click', () => {
        viewer.toggleDrawMode();
    });

    // Toggle overlay
    document.getElementById('toggleOverlayBtn').addEventListener('click', (e) => {
        const visible = viewer.toggleOverlay();
        e.currentTarget.classList.toggle('active', visible);
    });

    // Toggle all anomalies
    document.getElementById('toggleAllAnomalies').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        const showAll = btn.textContent === 'Tout afficher';

        viewer.toggleAllAnomalies(showAll);
        btn.textContent = showAll ? 'Tout masquer' : 'Tout afficher';

        // Update individual toggles
        updateAnomalyToggles();
    });
}

/**
 * Setup analysis functionality
 */
function setupAnalysis() {
    const analyzeBtn = document.getElementById('analyzeBtn');

    analyzeBtn.addEventListener('click', async () => {
        if (!currentImageData) {
            showToast('Veuillez d\'abord charger une image', 'error');
            return;
        }

        // Check API configuration
        const config = getApiConfig();
        if (!config || (!config.openaiKey && !config.geminiKey)) {
            showToast('Veuillez configurer une clé API dans Administration', 'error');
            return;
        }

        if (config.provider === 'openai' && !config.openaiKey) {
            showToast('Clé API OpenAI non configurée', 'error');
            return;
        }

        if (config.provider === 'gemini' && !config.geminiKey) {
            showToast('Clé API Gemini non configurée', 'error');
            return;
        }

        try {
            showLoading('Analyse en cours...');
            updateLoadingStatus('Envoi de l\'image à l\'IA...');

            analysisResult = await API.analyzeImage(
                currentImageData.base64,
                currentImageData.mimeType,
                currentImageData.width,
                currentImageData.height
            );

            updateLoadingStatus('Traitement des résultats...');

            // Update anomalies
            if (analysisResult.image_analysis?.detected_anomalies) {
                viewer.setAnomalies(analysisResult.image_analysis.detected_anomalies);
                renderAnomaliesList(analysisResult.image_analysis.detected_anomalies);
            }

            // Update report
            renderMedicalReport(analysisResult.medical_report);

            hideLoading();
            showToast('Analyse terminée', 'success');

        } catch (error) {
            hideLoading();
            console.error('Analysis error:', error);
            showToast(`Erreur: ${error.message}`, 'error');
        }
    });

    // Copy report button
    document.getElementById('copyReportBtn').addEventListener('click', () => {
        const memo = document.getElementById('analysisMemo');
        const text = memo.innerText;

        navigator.clipboard.writeText(text).then(() => {
            showToast('Rapport copié dans le presse-papiers', 'success');
        }).catch(() => {
            showToast('Erreur lors de la copie', 'error');
        });
    });
}

/**
 * Render anomalies list
 */
function renderAnomaliesList(anomalies) {
    const container = document.getElementById('anomaliesList');

    if (!anomalies || anomalies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Aucune anomalie détectée</p>
                <span>L'image semble normale</span>
            </div>
        `;
        return;
    }

    container.innerHTML = anomalies.map(anomaly => `
        <div class="anomaly-item" data-id="${anomaly.id}">
            <div class="anomaly-color" style="background-color: ${anomaly.color_hint}"></div>
            <div class="anomaly-info">
                <div class="anomaly-label">${anomaly.label}</div>
                <div class="anomaly-coords">
                    [${anomaly.bounding_box.xmin}, ${anomaly.bounding_box.ymin}] -
                    [${anomaly.bounding_box.xmax}, ${anomaly.bounding_box.ymax}]
                </div>
            </div>
            <button class="btn btn-icon anomaly-toggle active" data-anomaly-id="${anomaly.id}" title="Afficher/Masquer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Add toggle event listeners
    container.querySelectorAll('.anomaly-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.anomalyId);
            const visible = viewer.toggleAnomaly(id);
            btn.classList.toggle('active', visible);
        });
    });

    // Update toggle all button
    document.getElementById('toggleAllAnomalies').textContent = 'Tout masquer';
}

/**
 * Update anomaly toggle buttons state
 */
function updateAnomalyToggles() {
    document.querySelectorAll('.anomaly-toggle').forEach(btn => {
        const id = parseInt(btn.dataset.anomalyId);
        btn.classList.toggle('active', viewer.visibleAnomalies.has(id));
    });
}

/**
 * Render medical report
 */
function renderMedicalReport(report) {
    const container = document.getElementById('analysisMemo');

    if (!report) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Rapport non disponible</p>
            </div>
        `;
        return;
    }

    let html = '';

    // Summary
    if (report.summary) {
        html += `<h4>Résumé</h4><p>${report.summary}</p>`;
    }

    // Raw response (fallback)
    if (report.raw_response) {
        html += `<h4>Réponse brute</h4><p>${report.raw_response}</p>`;
    }

    // Interpretation
    if (report.interpretation) {
        html += '<h4>Interprétation</h4><ul>';
        for (const [key, value] of Object.entries(report.interpretation)) {
            if (value) {
                const label = formatLabel(key);
                html += `<li><strong>${label}:</strong> ${value}</li>`;
            }
        }
        html += '</ul>';
    }

    // Findings
    if (report.findings && report.findings.length > 0) {
        html += '<h4>Observations</h4><ul>';
        report.findings.forEach(finding => {
            html += `<li>${finding}</li>`;
        });
        html += '</ul>';
    }

    // Differential diagnosis
    if (report.differential_diagnosis && report.differential_diagnosis.length > 0) {
        html += '<h4>Diagnostic différentiel</h4><ul>';
        report.differential_diagnosis.forEach(diag => {
            html += `<li>${diag}</li>`;
        });
        html += '</ul>';
    }

    // Recommendations
    if (report.recommendations) {
        html += `<h4>Recommandations</h4><p>${report.recommendations}</p>`;
    }

    container.innerHTML = html || '<div class="empty-state"><p>Aucune donnée</p></div>';
    document.getElementById('copyReportBtn').disabled = false;
}

/**
 * Format label from snake_case to Title Case
 */
function formatLabel(key) {
    return key.replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Setup navigation
 */
function setupNavigation() {
    // Admin button
    document.getElementById('adminBtn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Chargement...') {
    const overlay = document.getElementById('loadingOverlay');
    overlay.querySelector('p').textContent = message;
    overlay.classList.remove('hidden');
}

/**
 * Update loading status
 */
function updateLoadingStatus(status) {
    const overlay = document.getElementById('loadingOverlay');
    const statusEl = overlay.querySelector('#loadingStatus');
    if (statusEl) {
        statusEl.textContent = status;
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}
