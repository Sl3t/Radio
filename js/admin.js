/**
 * RadioAnalyzer - Admin Page Logic
 */

// Current editing state
let currentEditingPromptId = null;

/**
 * Initialize admin page
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeConfig();

    // Check authentication
    if (!Auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    initializeAdmin();
});

/**
 * Initialize admin functionality
 */
function initializeAdmin() {
    setupNavigation();
    setupApiSection();
    setupPromptsSection();
    setupMoodBoardSection();
    setupCredentialsSection();
    loadCurrentConfig();
}

/**
 * Setup navigation between sections
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;

            // Update nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show corresponding section
            document.querySelectorAll('.admin-section').forEach(sec => {
                sec.classList.remove('active');
            });
            document.getElementById(`${section}Section`).classList.add('active');
        });
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });
}

/**
 * Setup API configuration section
 */
function setupApiSection() {
    // Provider selection
    document.querySelectorAll('input[name="provider"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const config = getApiConfig();
            config.provider = e.target.value;
            saveApiConfig(config);
            showToast('Fournisseur IA mis à jour', 'success');
        });
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                `;
            } else {
                input.type = 'password';
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                `;
            }
        });
    });

    // Save API keys
    document.getElementById('saveApiKeys').addEventListener('click', () => {
        const config = getApiConfig();
        config.openaiKey = document.getElementById('openaiKey').value.trim();
        config.geminiKey = document.getElementById('geminiKey').value.trim();
        config.openaiModel = document.getElementById('openaiModel').value;
        config.geminiModel = document.getElementById('geminiModel').value;

        saveApiConfig(config);
        showToast('Configuration API sauvegardée', 'success');
    });

    // Model selection change
    document.getElementById('openaiModel').addEventListener('change', (e) => {
        const config = getApiConfig();
        config.openaiModel = e.target.value;
        saveApiConfig(config);
    });

    document.getElementById('geminiModel').addEventListener('change', (e) => {
        const config = getApiConfig();
        config.geminiModel = e.target.value;
        saveApiConfig(config);
    });
}

/**
 * Setup prompts section
 */
function setupPromptsSection() {
    // Active prompt selection
    document.getElementById('activePromptSelect').addEventListener('change', (e) => {
        setActivePrompt(e.target.value);
        loadPromptForEditing(e.target.value);
        showToast('Prompt actif mis à jour', 'success');
    });

    // New prompt button
    document.getElementById('newPromptBtn').addEventListener('click', () => {
        currentEditingPromptId = null;
        document.getElementById('promptName').value = '';
        document.getElementById('promptContent').value = '';
        document.getElementById('promptDescription').value = '';
        document.getElementById('promptName').focus();
    });

    // Save prompt
    document.getElementById('savePromptBtn').addEventListener('click', savePrompt);

    // Delete prompt
    document.getElementById('deletePromptBtn').addEventListener('click', deletePrompt);
}

/**
 * Setup Mood Board section
 */
function setupMoodBoardSection() {
    // Theme preset buttons
    document.querySelectorAll('.theme-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const themeName = btn.dataset.theme;

            // Apply preset theme
            if (ThemeManager.applyPreset(themeName)) {
                // Update active state
                document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update color inputs to reflect preset
                updateColorInputsFromPreset(themeName);

                showToast(`Thème "${THEME_PRESETS[themeName].name}" appliqué`, 'success');
            }
        });
    });

    // Color input synchronization (color picker <-> text input)
    const colorInputPairs = [
        ['accentColor', 'accentColorText', '--accent-primary'],
        ['accentHoverColor', 'accentHoverColorText', '--accent-primary-hover'],
        ['bgPrimaryColor', 'bgPrimaryColorText', '--bg-primary'],
        ['bgSecondaryColor', 'bgSecondaryColorText', '--bg-secondary'],
        ['borderColor', 'borderColorText', '--border-color'],
        ['textPrimaryColor', 'textPrimaryColorText', '--text-primary']
    ];

    colorInputPairs.forEach(([colorId, textId, cssVar]) => {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);

        if (colorInput && textInput) {
            // Sync color to text
            colorInput.addEventListener('input', () => {
                textInput.value = colorInput.value;
                updatePreviewLive();
            });

            // Sync text to color
            textInput.addEventListener('input', () => {
                if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    colorInput.value = textInput.value;
                    updatePreviewLive();
                }
            });

            textInput.addEventListener('blur', () => {
                // Validate and fix on blur
                if (!/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
                    textInput.value = colorInput.value;
                }
            });
        }
    });

    // Apply theme button
    document.getElementById('applyThemeBtn').addEventListener('click', () => {
        const colors = getColorsFromInputs();
        ThemeManager.applyCustomTheme(colors);

        // Clear preset active state
        document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));

        showToast('Thème personnalisé appliqué', 'success');
    });

    // Reset theme button
    document.getElementById('resetThemeBtn').addEventListener('click', () => {
        ThemeManager.resetToDefault();

        // Update UI
        document.querySelectorAll('.theme-preset').forEach(b => {
            b.classList.toggle('active', b.dataset.theme === 'dark-blue');
        });
        updateColorInputsFromPreset('dark-blue');

        showToast('Thème réinitialisé', 'success');
    });

    // Load current theme state
    loadCurrentThemeState();
}

/**
 * Update color inputs from a preset
 */
function updateColorInputsFromPreset(presetName) {
    const preset = THEME_PRESETS[presetName];
    if (!preset) return;

    const mappings = {
        'accentColor': '--accent-primary',
        'accentHoverColor': '--accent-primary-hover',
        'bgPrimaryColor': '--bg-primary',
        'bgSecondaryColor': '--bg-secondary',
        'borderColor': '--border-color',
        'textPrimaryColor': '--text-primary'
    };

    for (const [inputId, cssVar] of Object.entries(mappings)) {
        const colorInput = document.getElementById(inputId);
        const textInput = document.getElementById(inputId + 'Text');
        const value = preset.colors[cssVar];

        if (colorInput && textInput && value) {
            colorInput.value = value;
            textInput.value = value;
        }
    }
}

/**
 * Get colors from inputs
 */
function getColorsFromInputs() {
    return {
        '--accent-primary': document.getElementById('accentColor').value,
        '--accent-primary-hover': document.getElementById('accentHoverColor').value,
        '--bg-primary': document.getElementById('bgPrimaryColor').value,
        '--bg-secondary': document.getElementById('bgSecondaryColor').value,
        '--bg-tertiary': adjustBrightness(document.getElementById('bgSecondaryColor').value, 10),
        '--bg-hover': adjustBrightness(document.getElementById('bgSecondaryColor').value, 20),
        '--bg-active': adjustBrightness(document.getElementById('bgSecondaryColor').value, 30),
        '--border-color': document.getElementById('borderColor').value,
        '--border-light': adjustBrightness(document.getElementById('borderColor').value, 20),
        '--text-primary': document.getElementById('textPrimaryColor').value,
        '--text-secondary': adjustBrightness(document.getElementById('textPrimaryColor').value, -35),
        '--text-muted': adjustBrightness(document.getElementById('textPrimaryColor').value, -55)
    };
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Update preview in real-time
 */
function updatePreviewLive() {
    const previewBox = document.getElementById('themePreviewBox');
    if (!previewBox) return;

    const colors = getColorsFromInputs();

    previewBox.style.setProperty('--preview-bg-primary', colors['--bg-primary']);
    previewBox.style.setProperty('--preview-bg-secondary', colors['--bg-secondary']);
    previewBox.style.setProperty('--preview-border', colors['--border-color']);
    previewBox.style.setProperty('--preview-accent', colors['--accent-primary']);
    previewBox.style.setProperty('--preview-text', colors['--text-primary']);

    // Apply to preview elements
    previewBox.style.background = colors['--bg-primary'];
    previewBox.querySelector('.preview-header').style.background = colors['--bg-secondary'];
    previewBox.querySelector('.preview-header').style.borderBottomColor = colors['--border-color'];
    previewBox.querySelector('.preview-logo').style.background = colors['--accent-primary'];
    previewBox.querySelector('.preview-header span').style.color = colors['--text-primary'];
    previewBox.querySelector('.preview-sidebar').style.background = colors['--bg-secondary'];
    previewBox.querySelector('.preview-sidebar').style.borderRightColor = colors['--border-color'];
    previewBox.querySelector('.preview-nav-item.active').style.background = colors['--accent-primary'];
    previewBox.querySelector('.preview-card').style.background = colors['--bg-secondary'];
    previewBox.querySelector('.preview-card').style.borderColor = colors['--border-color'];
    previewBox.querySelector('.preview-button').style.background = colors['--accent-primary'];
}

/**
 * Load current theme state into UI
 */
function loadCurrentThemeState() {
    const currentPreset = ThemeManager.getCurrentPreset();
    const currentColors = ThemeManager.getCurrentColors();

    // Set active preset button
    document.querySelectorAll('.theme-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentPreset);
    });

    // Set color inputs
    const mappings = {
        'accentColor': '--accent-primary',
        'accentHoverColor': '--accent-primary-hover',
        'bgPrimaryColor': '--bg-primary',
        'bgSecondaryColor': '--bg-secondary',
        'borderColor': '--border-color',
        'textPrimaryColor': '--text-primary'
    };

    for (const [inputId, cssVar] of Object.entries(mappings)) {
        const colorInput = document.getElementById(inputId);
        const textInput = document.getElementById(inputId + 'Text');
        const value = currentColors[cssVar];

        if (colorInput && textInput && value) {
            colorInput.value = value;
            textInput.value = value;
        }
    }

    // Update preview
    setTimeout(updatePreviewLive, 100);
}

/**
 * Setup credentials section
 */
function setupCredentialsSection() {
    document.getElementById('changePasswordBtn').addEventListener('click', () => {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        const result = Auth.changePassword(currentPassword, newPassword);

        if (result.success) {
            showToast(result.message, 'success');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            showToast(result.message, 'error');
        }
    });
}

/**
 * Load current configuration
 */
function loadCurrentConfig() {
    const config = getApiConfig();

    if (config) {
        // Set provider radio
        const providerRadio = document.querySelector(`input[name="provider"][value="${config.provider}"]`);
        if (providerRadio) {
            providerRadio.checked = true;
        }

        // Set API keys (masked by default due to password type)
        document.getElementById('openaiKey').value = config.openaiKey || '';
        document.getElementById('geminiKey').value = config.geminiKey || '';

        // Set models
        document.getElementById('openaiModel').value = config.openaiModel || CONFIG.DEFAULT_MODELS.openai;
        document.getElementById('geminiModel').value = config.geminiModel || CONFIG.DEFAULT_MODELS.gemini;
    }

    // Load prompts
    loadPromptsList();
}

/**
 * Load prompts list
 */
function loadPromptsList() {
    const prompts = getPrompts();
    const activePromptId = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT);

    // Populate select dropdown
    const select = document.getElementById('activePromptSelect');
    select.innerHTML = prompts.map(p => `
        <option value="${p.id}" ${p.id === activePromptId ? 'selected' : ''}>
            ${p.name}
        </option>
    `).join('');

    // Populate prompts list
    const listContainer = document.getElementById('promptsList');
    listContainer.innerHTML = prompts.map(p => `
        <div class="prompt-item ${p.id === activePromptId ? 'active' : ''}" data-id="${p.id}">
            <div class="prompt-item-info">
                <div class="prompt-item-name">${p.name}</div>
                <div class="prompt-item-desc">${p.description || 'Aucune description'}</div>
            </div>
            ${p.id === activePromptId ? '<span class="prompt-item-badge">Actif</span>' : ''}
            ${p.isDefault ? '<span class="prompt-item-badge" style="background: var(--text-muted)">Défaut</span>' : ''}
        </div>
    `).join('');

    // Add click handlers
    listContainer.querySelectorAll('.prompt-item').forEach(item => {
        item.addEventListener('click', () => {
            loadPromptForEditing(item.dataset.id);
        });
    });

    // Load first prompt for editing if none selected
    if (!currentEditingPromptId && prompts.length > 0) {
        loadPromptForEditing(activePromptId || prompts[0].id);
    }
}

/**
 * Load prompt for editing
 */
function loadPromptForEditing(promptId) {
    const prompts = getPrompts();
    const prompt = prompts.find(p => p.id === promptId);

    if (!prompt) return;

    currentEditingPromptId = promptId;
    document.getElementById('promptName').value = prompt.name;
    document.getElementById('promptContent').value = prompt.content;
    document.getElementById('promptDescription').value = prompt.description || '';

    // Update visual selection in list
    document.querySelectorAll('.prompt-item').forEach(item => {
        item.style.background = item.dataset.id === promptId ? 'var(--bg-hover)' : '';
    });
}

/**
 * Save prompt
 */
function savePrompt() {
    const name = document.getElementById('promptName').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    const description = document.getElementById('promptDescription').value.trim();

    if (!name || !content) {
        showToast('Le nom et le contenu sont requis', 'error');
        return;
    }

    const prompts = getPrompts();

    if (currentEditingPromptId) {
        // Update existing
        const index = prompts.findIndex(p => p.id === currentEditingPromptId);
        if (index !== -1) {
            prompts[index] = {
                ...prompts[index],
                name,
                content,
                description
            };
        }
    } else {
        // Create new
        const newPrompt = {
            id: 'custom_' + Date.now(),
            name,
            content,
            description,
            isDefault: false
        };
        prompts.push(newPrompt);
        currentEditingPromptId = newPrompt.id;
    }

    savePrompts(prompts);
    loadPromptsList();
    showToast('Prompt sauvegardé', 'success');
}

/**
 * Delete prompt
 */
function deletePrompt() {
    if (!currentEditingPromptId) {
        showToast('Aucun prompt sélectionné', 'error');
        return;
    }

    const prompts = getPrompts();
    const prompt = prompts.find(p => p.id === currentEditingPromptId);

    if (prompt?.isDefault) {
        showToast('Impossible de supprimer un prompt par défaut', 'error');
        return;
    }

    if (!confirm(`Supprimer le prompt "${prompt?.name}" ?`)) {
        return;
    }

    const newPrompts = prompts.filter(p => p.id !== currentEditingPromptId);
    savePrompts(newPrompts);

    // Reset active prompt if needed
    const activeId = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT);
    if (activeId === currentEditingPromptId && newPrompts.length > 0) {
        setActivePrompt(newPrompts[0].id);
    }

    currentEditingPromptId = null;
    loadPromptsList();
    showToast('Prompt supprimé', 'success');

    // Load first prompt
    if (newPrompts.length > 0) {
        loadPromptForEditing(newPrompts[0].id);
    }
}
