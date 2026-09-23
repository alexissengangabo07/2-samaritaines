require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const sequelize = require('./config/database'); // Chemin vers votre configuration Sequelize
const apiRoutes = require('./routes'); // Importation du fichier routes/index.js
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middlewares Globaux
// ==========================================

// 1. CORS: Autorise les requêtes provenant de votre application React
// app.use(cors({
//   origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://10.169.171.92:4173','http://10.169.171.92:5173', 'http://localhost:4173', 'http://192.168.0.100:5173', 'http://192.168.0.100:4173'], // URL par défaut de Vite / React
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(cors())
// 2. Morgan: Logger de requêtes HTTP pour le développement
app.use(morgan('dev'));

// 3. Parsing JSON & URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Routes de l'API
// ==========================================

// Préfixe global pour votre API REST
app.use('/api', apiRoutes);

// Route de test d'état du serveur
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API Pharmacie opérationnelle' });
});

// Gestion des routes non trouvées (404)
app.use((req, res) => {
  res.status(404).json({ message: 'Ressource non trouvée 1' });
});


// ==========================================
// Connexion BDD & Démarrage du Serveur
// ==========================================

const startServer = async () => {
  try {
    // Vérification de la connexion à MySQL
    await sequelize.authenticate();
    console.log(' Connexion à la base de données MySQL établie avec succès.');
    
    // Synchronisation des modèles Sequelize avec la base de données
    // Note: Passez { alter: true } en développement si vous modifiez la structure des tables
    await sequelize.sync({ force: false });
    console.log(' Modèles synchronisés avec la base de données.');
    
    app.use(errorHandler);
    
    // Démarrage du serveur Express
    app.listen(PORT, '0.0.0.0', () => {
      console.log(` Serveur démarré sur le port ${PORT}`);
      console.log(` URL Client React autorisée : ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error(' Impossible de se connecter à la base de données :', error.message);
    process.exit(1);
  }
};

startServer();