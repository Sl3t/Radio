# RadioAnalyzer

Application d'analyse de radiographies médicales par Intelligence Artificielle (ChatGPT / Gemini).

## Fonctionnalités

- **Upload d'images** : Glissez-déposez ou sélectionnez des radiographies (JPEG, PNG)
- **Viewer interactif** : Zoom avant/arrière, déplacement, sélection de zone pour zoom automatique
- **Analyse IA** : Détection automatique d'anomalies via ChatGPT (OpenAI) ou Gemini (Google)
- **Overlay visuel** : Affichage des zones détectées avec des cadres colorés
- **Rapport médical** : Génération automatique d'un rapport d'analyse détaillé
- **Administration** : Configuration des APIs, gestion des prompts, modification des identifiants

## Installation sur IIS

1. Copiez le dossier complet sur votre serveur IIS
2. Créez un nouveau site web ou application pointant vers ce dossier
3. Assurez-vous que le fichier `web.config` est bien présent
4. Accédez à l'application via votre navigateur

## Configuration

### Identifiants par défaut

- **Utilisateur** : `admin`
- **Mot de passe** : `admin`

> ⚠️ Pensez à modifier le mot de passe dans la page Administration > Identifiants

### Configuration des APIs

1. Connectez-vous à l'application
2. Cliquez sur "Administration"
3. Dans "Configuration API", ajoutez vos clés API :
   - **OpenAI** : Obtenez votre clé sur [platform.openai.com](https://platform.openai.com/api-keys)
   - **Gemini** : Obtenez votre clé sur [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Sélectionnez le fournisseur IA actif (OpenAI ou Gemini)
5. Cliquez sur "Sauvegarder les clés"

## Utilisation

### Analyse d'une radiographie

1. Uploadez une image en la glissant sur la zone d'upload ou en cliquant sur "Sélectionner un fichier"
2. L'image s'affiche dans le viewer
3. Cliquez sur "Analyser"
4. L'IA analyse l'image et retourne :
   - Les anomalies détectées (affichées en overlay sur l'image)
   - Un rapport médical détaillé

### Navigation dans le viewer

- **Zoom** : Molette de souris ou boutons +/-
- **Déplacement** : Cliquer-glisser sur l'image
- **Zoom sur zone** : Cliquez sur l'icône de sélection, dessinez un rectangle pour zoomer automatiquement
- **Masquer les overlays** : Cliquez sur l'icône d'overlay ou sur l'œil de chaque anomalie

### Gestion des prompts

L'application inclut plusieurs prompts par défaut :
- Analyse de fractures osseuses
- Analyse thoracique
- Analyse dentaire
- Analyse générale

Vous pouvez créer vos propres prompts personnalisés dans Administration > Bibliothèque de Prompts.

## Structure du projet

```
Radio/
├── index.html          # Page principale
├── admin.html          # Page d'administration
├── web.config          # Configuration IIS
├── css/
│   └── style.css       # Styles CSS
├── js/
│   ├── config.js       # Configuration et prompts par défaut
│   ├── auth.js         # Authentification
│   ├── api.js          # Intégration APIs (OpenAI/Gemini)
│   ├── viewer.js       # Viewer d'images avec zoom et overlay
│   ├── app.js          # Application principale
│   └── admin.js        # Logique administration
└── assets/             # Ressources (images, etc.)
```

## Technologies utilisées

- HTML5 Canvas pour l'affichage et l'overlay
- CSS3 avec variables CSS pour le thème sombre
- JavaScript Vanilla (ES6+)
- API OpenAI GPT-4 Vision
- API Google Gemini Pro Vision

## Sécurité

- Authentification par mot de passe
- Stockage local (localStorage) des configurations
- Les clés API ne transitent que vers les serveurs OpenAI/Google

> ⚠️ **Note** : Cette application est conçue pour un usage éducatif. Pour un usage en production avec des données médicales sensibles, un backend sécurisé serait recommandé.

## Avertissement médical

Cette application est un outil d'aide à l'analyse et ne remplace en aucun cas l'expertise d'un professionnel de santé qualifié. Les résultats fournis par l'IA doivent être validés par un radiologue ou un médecin.

## Licence

Projet éducatif - Usage libre
