/**
 * RadioAnalyzer - Configuration & Default Prompts
 */

const CONFIG = {
    // Storage keys
    STORAGE_KEYS: {
        AUTH: 'radioanalyzer_auth',
        API_CONFIG: 'radioanalyzer_api',
        PROMPTS: 'radioanalyzer_prompts',
        ACTIVE_PROMPT: 'radioanalyzer_active_prompt',
        CREDENTIALS: 'radioanalyzer_credentials'
    },

    // Default credentials
    DEFAULT_CREDENTIALS: {
        username: 'Admin_RA',
        password: 'Admin_RA'
    },

    // API endpoints
    API_ENDPOINTS: {
        openai: 'https://api.openai.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models'
    },

    // Default models
    DEFAULT_MODELS: {
        openai: 'gpt-4o',
        gemini: 'gemini-1.5-pro'
    }
};

// Default prompts library
const DEFAULT_PROMPTS = [
    {
        id: 'fracture_analysis',
        name: 'Analyse de fractures osseuses',
        description: 'Détection et localisation des fractures sur radiographies',
        isDefault: true,
        content: `Tu es un assistant médical expert en radiologie. Analyse cette radiographie et identifie toutes les anomalies visibles.

IMPORTANT: Tu dois répondre UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Le JSON doit avoir cette structure exacte:
{
  "image_analysis": {
    "target": "description_courte_de_la_zone_analysee",
    "image_dimensions": {
      "reference_width": 1000,
      "reference_height": 1000
    },
    "detected_anomalies": [
      {
        "id": 1,
        "label": "Nom de l'anomalie détectée",
        "color_hint": "#FF0000",
        "severity": "high|medium|low",
        "bounding_box": {
          "xmin": 0,
          "ymin": 0,
          "xmax": 100,
          "ymax": 100
        },
        "description": "Description détaillée de l'anomalie"
      }
    ]
  },
  "medical_report": {
    "summary": "Résumé concis de l'analyse",
    "interpretation": {
      "location": "Localisation anatomique précise",
      "nature": "Nature de la pathologie observée",
      "displacement": "Description du déplacement si applicable"
    },
    "findings": [
      "Point d'observation 1",
      "Point d'observation 2"
    ],
    "recommendations": "Recommandations cliniques"
  }
}

Instructions:
1. Les coordonnées bounding_box sont sur une échelle de 0-1000 (référence normalisée)
2. Utilise des couleurs distinctes pour chaque anomalie (#FF0000 rouge pour sévère, #FFA500 orange pour modéré, #FFFF00 jaune pour léger)
3. Si aucune anomalie n'est détectée, retourne un tableau detected_anomalies vide
4. Sois précis dans les coordonnées pour permettre un affichage correct sur l'image

Analyse l'image fournie et retourne le JSON structuré.`
    },
    {
        id: 'thorax_analysis',
        name: 'Analyse thoracique',
        description: 'Analyse de radiographies thoraciques (poumons, cœur)',
        isDefault: true,
        content: `Tu es un assistant médical expert en radiologie thoracique. Analyse cette radiographie du thorax.

IMPORTANT: Tu dois répondre UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Le JSON doit avoir cette structure exacte:
{
  "image_analysis": {
    "target": "thorax_analysis",
    "image_dimensions": {
      "reference_width": 1000,
      "reference_height": 1000
    },
    "detected_anomalies": [
      {
        "id": 1,
        "label": "Nom de l'anomalie",
        "color_hint": "#FF0000",
        "severity": "high|medium|low",
        "bounding_box": {
          "xmin": 0,
          "ymin": 0,
          "xmax": 100,
          "ymax": 100
        },
        "description": "Description détaillée"
      }
    ]
  },
  "medical_report": {
    "summary": "Résumé de l'analyse thoracique",
    "interpretation": {
      "cardiac_silhouette": "Description de la silhouette cardiaque",
      "pulmonary_fields": "État des champs pulmonaires",
      "mediastinum": "Observation du médiastin",
      "pleural_spaces": "État des espaces pleuraux",
      "bone_structures": "Structures osseuses visibles"
    },
    "findings": [
      "Observation 1",
      "Observation 2"
    ],
    "recommendations": "Recommandations cliniques"
  }
}

Points à analyser:
- Silhouette cardiaque (taille, forme)
- Champs pulmonaires (opacités, nodules, infiltrats)
- Hiles pulmonaires
- Médiastin
- Coupoles diaphragmatiques
- Espaces pleuraux
- Structures osseuses (côtes, clavicules, rachis)

Analyse l'image fournie et retourne le JSON structuré.`
    },
    {
        id: 'dental_analysis',
        name: 'Analyse dentaire',
        description: 'Analyse de radiographies dentaires (panoramique, rétro-alvéolaire)',
        isDefault: true,
        content: `Tu es un assistant médical expert en radiologie dentaire. Analyse cette radiographie dentaire.

IMPORTANT: Tu dois répondre UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Le JSON doit avoir cette structure exacte:
{
  "image_analysis": {
    "target": "dental_analysis",
    "image_dimensions": {
      "reference_width": 1000,
      "reference_height": 1000
    },
    "detected_anomalies": [
      {
        "id": 1,
        "label": "Nom de l'anomalie dentaire",
        "color_hint": "#FF0000",
        "severity": "high|medium|low",
        "tooth_number": "numéro de la dent selon la nomenclature FDI",
        "bounding_box": {
          "xmin": 0,
          "ymin": 0,
          "xmax": 100,
          "ymax": 100
        },
        "description": "Description détaillée"
      }
    ]
  },
  "medical_report": {
    "summary": "Résumé de l'analyse dentaire",
    "interpretation": {
      "teeth_present": "Dents présentes",
      "teeth_missing": "Dents absentes",
      "restorations": "Restaurations observées",
      "bone_level": "Niveau osseux"
    },
    "findings": [
      "Observation 1",
      "Observation 2"
    ],
    "recommendations": "Recommandations de soins"
  }
}

Points à analyser:
- Caries (proximales, occlusales)
- Lésions péri-apicales
- État parodontal et niveau osseux
- Restaurations existantes
- Dents incluses ou en éruption
- Kystes ou tumeurs
- État des racines

Analyse l'image fournie et retourne le JSON structuré.`
    },
    {
        id: 'general_xray',
        name: 'Analyse générale',
        description: 'Analyse polyvalente pour tout type de radiographie',
        isDefault: true,
        content: `Tu es un assistant médical expert en radiologie. Analyse cette radiographie médicale.

IMPORTANT: Tu dois répondre UNIQUEMENT avec un JSON valide, sans texte avant ou après.

Le JSON doit avoir cette structure exacte:
{
  "image_analysis": {
    "target": "general_xray_analysis",
    "image_type": "type de radiographie détecté",
    "anatomical_region": "région anatomique",
    "image_dimensions": {
      "reference_width": 1000,
      "reference_height": 1000
    },
    "detected_anomalies": [
      {
        "id": 1,
        "label": "Nom de l'anomalie",
        "color_hint": "#FF0000",
        "severity": "high|medium|low",
        "bounding_box": {
          "xmin": 0,
          "ymin": 0,
          "xmax": 100,
          "ymax": 100
        },
        "description": "Description détaillée de l'anomalie"
      }
    ]
  },
  "medical_report": {
    "summary": "Résumé de l'analyse",
    "image_quality": "Évaluation de la qualité de l'image",
    "interpretation": {
      "primary_findings": "Observations principales",
      "secondary_findings": "Observations secondaires",
      "normal_structures": "Structures normales identifiées"
    },
    "findings": [
      "Observation détaillée 1",
      "Observation détaillée 2"
    ],
    "differential_diagnosis": [
      "Diagnostic différentiel 1",
      "Diagnostic différentiel 2"
    ],
    "recommendations": "Recommandations cliniques et examens complémentaires suggérés"
  }
}

Instructions:
1. Identifie d'abord le type de radiographie et la région anatomique
2. Les coordonnées sont sur une échelle 0-1000
3. Utilise des couleurs distinctes selon la sévérité
4. Sois exhaustif dans l'analyse

Analyse l'image fournie et retourne le JSON structuré.`
    }
];

/**
 * Initialize default configuration
 */
function initializeConfig() {
    // Initialize prompts if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.PROMPTS)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.PROMPTS, JSON.stringify(DEFAULT_PROMPTS));
    }

    // Set default active prompt if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT, 'fracture_analysis');
    }

    // Initialize credentials if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.CREDENTIALS)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.CREDENTIALS, JSON.stringify(CONFIG.DEFAULT_CREDENTIALS));
    }

    // Initialize API config if not exists
    if (!localStorage.getItem(CONFIG.STORAGE_KEYS.API_CONFIG)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.API_CONFIG, JSON.stringify({
            provider: 'openai',
            openaiKey: '',
            geminiKey: '',
            openaiModel: CONFIG.DEFAULT_MODELS.openai,
            geminiModel: CONFIG.DEFAULT_MODELS.gemini
        }));
    }
}

/**
 * Get all prompts
 */
function getPrompts() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.PROMPTS);
    return stored ? JSON.parse(stored) : DEFAULT_PROMPTS;
}

/**
 * Save prompts
 */
function savePrompts(prompts) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PROMPTS, JSON.stringify(prompts));
}

/**
 * Get active prompt
 */
function getActivePrompt() {
    const activeId = localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT);
    const prompts = getPrompts();
    return prompts.find(p => p.id === activeId) || prompts[0];
}

/**
 * Set active prompt
 */
function setActivePrompt(promptId) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_PROMPT, promptId);
}

/**
 * Get API configuration
 */
function getApiConfig() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.API_CONFIG);
    return stored ? JSON.parse(stored) : null;
}

/**
 * Save API configuration
 */
function saveApiConfig(config) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
}

// Initialize on load
initializeConfig();
