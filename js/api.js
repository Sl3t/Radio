/**
 * RadioAnalyzer - API Integration Module (OpenAI & Google Gemini)
 */

const API = {
    // Debug storage
    lastDebugInfo: null,

    /**
     * Analyze image using configured AI provider
     * @param {string} imageBase64 - Base64 encoded image (without data URI prefix)
     * @param {string} mimeType - Image MIME type (image/jpeg or image/png)
     * @param {number} imageWidth - Image width in pixels
     * @param {number} imageHeight - Image height in pixels
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeImage(imageBase64, mimeType = 'image/jpeg', imageWidth = 0, imageHeight = 0) {
        const config = getApiConfig();
        if (!config) {
            throw new Error('Configuration API non trouvée');
        }

        const prompt = getActivePrompt();
        if (!prompt) {
            throw new Error('Aucun prompt actif configuré');
        }

        // Inject image dimensions into the prompt
        let promptContent = prompt.content;
        if (imageWidth > 0 && imageHeight > 0) {
            const dimensionInfo = `\n\n[DIMENSIONS DE L'IMAGE : ${imageWidth} x ${imageHeight} pixels. Les coordonnées bounding_box doivent être exprimées en PIXELS RÉELS (pas de normalisation). xmin, ymin, xmax, ymax sont des valeurs entre 0 et ${imageWidth} (largeur) ou ${imageHeight} (hauteur).]`;
            promptContent = promptContent + dimensionInfo;
        }

        // Initialize debug info
        this.lastDebugInfo = {
            timestamp: new Date().toISOString(),
            provider: config.provider,
            model: config.provider === 'openai' ? config.openaiModel : config.geminiModel,
            imageWidth: imageWidth,
            imageHeight: imageHeight,
            promptSent: promptContent,
            rawResponse: null,
            parsedResponse: null
        };

        if (config.provider === 'openai') {
            return this.analyzeWithOpenAI(imageBase64, mimeType, promptContent, config);
        } else if (config.provider === 'gemini') {
            return this.analyzeWithGemini(imageBase64, mimeType, promptContent, config);
        } else {
            throw new Error('Fournisseur API non reconnu');
        }
    },

    /**
     * Analyze image with OpenAI GPT-4 Vision
     */
    async analyzeWithOpenAI(imageBase64, mimeType, promptContent, config) {
        if (!config.openaiKey) {
            throw new Error('Clé API OpenAI non configurée. Accédez à la page Administration.');
        }

        const response = await fetch(CONFIG.API_ENDPOINTS.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.openaiKey}`
            },
            body: JSON.stringify({
                model: config.openaiModel || CONFIG.DEFAULT_MODELS.openai,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: promptContent
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 4096,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Erreur OpenAI: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Réponse vide de l\'API OpenAI');
        }

        return this.parseResponse(content);
    },

    /**
     * Analyze image with Google Gemini
     */
    async analyzeWithGemini(imageBase64, mimeType, promptContent, config) {
        if (!config.geminiKey) {
            throw new Error('Clé API Gemini non configurée. Accédez à la page Administration.');
        }

        const model = config.geminiModel || CONFIG.DEFAULT_MODELS.gemini;
        const endpoint = `${CONFIG.API_ENDPOINTS.gemini}/${model}:generateContent?key=${config.geminiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: promptContent
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 4096
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Erreur Gemini: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('Réponse vide de l\'API Gemini');
        }

        return this.parseResponse(content);
    },

    /**
     * Parse AI response and extract JSON
     */
    parseResponse(content) {
        // Store raw response in debug info
        if (this.lastDebugInfo) {
            this.lastDebugInfo.rawResponse = content;
        }

        // Try to extract JSON from the response
        let jsonContent = content;

        // Remove markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonContent = jsonMatch[1];
        }

        // Try to find JSON object in the content
        const jsonObjectMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
            jsonContent = jsonObjectMatch[0];
        }

        try {
            const parsed = JSON.parse(jsonContent.trim());
            const result = this.validateAndNormalizeResponse(parsed);

            // Store parsed response in debug info
            if (this.lastDebugInfo) {
                this.lastDebugInfo.parsedResponse = result;
            }

            return result;
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.log('Raw content:', content);

            const fallback = {
                image_analysis: {
                    target: 'unknown',
                    detected_anomalies: []
                },
                medical_report: {
                    summary: 'Erreur de parsing de la réponse IA',
                    raw_response: content,
                    findings: ['La réponse n\'a pas pu être structurée correctement'],
                    recommendations: 'Veuillez réessayer l\'analyse'
                }
            };

            // Store fallback in debug info
            if (this.lastDebugInfo) {
                this.lastDebugInfo.parsedResponse = fallback;
                this.lastDebugInfo.parseError = e.message;
            }

            return fallback;
        }
    },

    /**
     * Validate and normalize the response structure
     */
    validateAndNormalizeResponse(data) {
        // Ensure image_analysis exists
        if (!data.image_analysis) {
            data.image_analysis = {
                target: 'unknown',
                detected_anomalies: []
            };
        }

        // Ensure detected_anomalies is an array
        if (!Array.isArray(data.image_analysis.detected_anomalies)) {
            data.image_analysis.detected_anomalies = [];
        }

        // Normalize each anomaly
        data.image_analysis.detected_anomalies = data.image_analysis.detected_anomalies.map((anomaly, index) => ({
            id: anomaly.id || index + 1,
            label: anomaly.label || `Anomalie ${index + 1}`,
            color_hint: anomaly.color_hint || this.getDefaultColor(index),
            severity: anomaly.severity || 'medium',
            bounding_box: {
                xmin: anomaly.bounding_box?.xmin || 0,
                ymin: anomaly.bounding_box?.ymin || 0,
                xmax: anomaly.bounding_box?.xmax || 100,
                ymax: anomaly.bounding_box?.ymax || 100
            },
            description: anomaly.description || ''
        }));

        // Ensure medical_report exists
        if (!data.medical_report) {
            data.medical_report = {
                summary: 'Aucun rapport généré',
                findings: [],
                recommendations: ''
            };
        }

        return data;
    },

    /**
     * Get default color for anomaly based on index
     */
    getDefaultColor(index) {
        const colors = ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];
        return colors[index % colors.length];
    },

    /**
     * Test API connection
     */
    async testConnection(provider) {
        const config = getApiConfig();

        if (provider === 'openai') {
            if (!config.openaiKey) {
                return { success: false, message: 'Clé API non configurée' };
            }

            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${config.openaiKey}`
                    }
                });

                if (response.ok) {
                    return { success: true, message: 'Connexion OpenAI réussie' };
                } else {
                    const error = await response.json().catch(() => ({}));
                    return { success: false, message: error.error?.message || 'Erreur de connexion' };
                }
            } catch (e) {
                return { success: false, message: e.message };
            }
        } else if (provider === 'gemini') {
            if (!config.geminiKey) {
                return { success: false, message: 'Clé API non configurée' };
            }

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${config.geminiKey}`
                );

                if (response.ok) {
                    return { success: true, message: 'Connexion Gemini réussie' };
                } else {
                    const error = await response.json().catch(() => ({}));
                    return { success: false, message: error.error?.message || 'Erreur de connexion' };
                }
            } catch (e) {
                return { success: false, message: e.message };
            }
        }

        return { success: false, message: 'Fournisseur non reconnu' };
    }
};
