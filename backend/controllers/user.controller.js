const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Vente, Approvisionnement, Product } = require("../models");
const { estExpire, DATE_EXPIRATION } = require("../config/license");

const JWT_SECRET =
  process.env.JWT_SECRET || "votre_cle_secrete_super_securisee";

// AUTH: Connexion d'un utilisateur (Login)
exports.login = async (req, res) => {
  if (estExpire()) {
    return res.status(403).json({
      code: "LICENSE_EXPIRED",
      message: `L'accès à cette application a expiré le ${DATE_EXPIRATION.toLocaleDateString("fr-FR")}.`,
    });
  }
  try {
    const { email, password } = req.body;

    // 1. Vérifier si l'utilisateur existe
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Email incorrect." });
    }

    // 2. Comparer le mot de passe soumis avec le hash en BDD
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // 3. Générer le Token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // Exclure le mot de passe du retour
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la connexion", error: error.message });
  }
};

// READ: Obtenir tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
};

// READ: Obtenir un utilisateur par ID avec historique
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Vente,
          include: [{ model: Product, attributes: ["nom", "prix_vente"] }],
        },
        {
          model: Approvisionnement,
          include: [{ model: Product, attributes: ["nom"] }],
        },
      ],
    });

    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// CREATE: Créer / S'inscrire (avec hachage Bcrypt)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "assistant",
    });

    const responseUser = newUser.toJSON();
    delete responseUser.password;

    res
      .status(201)
      .json({ message: "Utilisateur créé avec succès", user: responseUser });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: error.message,
    });
  }
};

// UPDATE: Mettre à jour un utilisateur (avec re-hachage si le mot de passe change)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    const user = await User.findByPk(id);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // Hacher à nouveau le mot de passe s'il est fourni
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    res.status(200).json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Erreur lors de la mise à jour", error: error.message });
  }
};

// DELETE: Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({ where: { id: req.params.id } });
    if (!deleted)
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression", error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};
