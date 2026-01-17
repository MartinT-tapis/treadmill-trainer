# 🏃‍♂️ Treadmill Trainer

Application PWA d'entraînement par intervalles sur tapis roulant.

## ✨ Fonctionnalités

- **10 programmes personnalisables** avec jusqu'à 10 intervalles chacun
- **Timer intelligent** avec décompte, sons et vibrations
- **Répétition de programmes** (jusqu'à 10 fois)
- **Statistiques détaillées** avec calendrier et historique
- **Calcul des calories** estimées
- **Mode sombre/clair**
- **Unités km/h ou mph**
- **PWA installable** sur téléphone

## 🚀 Déploiement sur Vercel

### Étape 1: Créer un compte GitHub
1. Aller sur [github.com](https://github.com)
2. Cliquer "Sign up" et créer un compte gratuit

### Étape 2: Créer un repository
1. Cliquer le bouton "+" en haut à droite → "New repository"
2. Nom: `treadmill-trainer`
3. Laisser "Public" coché
4. Cliquer "Create repository"

### Étape 3: Upload les fichiers
1. Sur la page du repository, cliquer "uploading an existing file"
2. Glisser-déposer TOUS les fichiers du projet
3. Cliquer "Commit changes"

### Étape 4: Déployer sur Vercel
1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer "Sign Up" → "Continue with GitHub"
3. Autoriser Vercel à accéder à GitHub
4. Cliquer "Add New..." → "Project"
5. Trouver `treadmill-trainer` et cliquer "Import"
6. Framework Preset: **Create React App**
7. Cliquer "Deploy"

### Étape 5: C'est prêt! 🎉
- Vercel vous donnera une URL comme `treadmill-trainer.vercel.app`
- Ouvrez cette URL sur votre téléphone
- Utilisez "Ajouter à l'écran d'accueil" pour l'installer

## 💻 Développement local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm start

# Créer une build de production
npm run build
```

## 📱 Installation PWA

### Sur iPhone/iPad:
1. Ouvrir l'URL dans Safari
2. Appuyer sur le bouton "Partager" (carré avec flèche)
3. Défiler et appuyer "Sur l'écran d'accueil"
4. Confirmer "Ajouter"

### Sur Android:
1. Ouvrir l'URL dans Chrome
2. Appuyer sur les 3 points (menu)
3. Appuyer "Ajouter à l'écran d'accueil"
4. Confirmer

## 🎯 Utilisation

### Page Accueil
- Sélectionner un programme
- Appuyer sur Play pour démarrer
- Utiliser les boutons pour pause, skip, stop

### Page Setup
- Configurer vos 10 programmes
- Ajouter/modifier/supprimer des intervalles
- Définir nom, durée, inclinaison, vitesse
- Configurer le nombre de répétitions

### Page Stats
- Voir le calendrier avec les jours d'entraînement
- Consulter l'historique détaillé
- Suivre vos statistiques hebdomadaires/mensuelles

### Page Réglages
- Basculer thème sombre/clair
- Changer les unités (km/h ↔ mph)
- Activer/désactiver sons et vibrations
- Réinitialiser les données

## 📝 Notes

- Les données sont sauvegardées localement (localStorage)
- L'app fonctionne hors-ligne une fois installée
- Format durée: MM:SS ou HH:MM:SS (30 sec à 2h)

---

Créé avec ❤️ pour les amateurs de cardio!
