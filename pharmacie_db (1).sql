-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 03:49 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pharmacie_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `approvisionnement`
--

CREATE TABLE `approvisionnement` (
  `id` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prix_achat` double NOT NULL,
  `date_expiration` date NOT NULL,
  `id_utilisateur` int(11) NOT NULL,
  `numero_lot` varchar(20) NOT NULL,
  `dateApprovisionnement` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approvisionnement`
--

INSERT INTO `approvisionnement` (`id`, `id_produit`, `quantite`, `prix_achat`, `date_expiration`, `id_utilisateur`, `numero_lot`, `dateApprovisionnement`) VALUES
(8, 19, 15, 1400, '2026-09-20', 3, '4111', '2026-09-19'),
(9, 18, 4, 200, '2026-11-21', 3, '4111', '2026-09-19');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `nom`) VALUES
(6, 'antalgique'),
(5, 'antibiotique');

-- --------------------------------------------------------

--
-- Table structure for table `details_inventaire`
--

CREATE TABLE `details_inventaire` (
  `id` int(11) NOT NULL,
  `inventaire_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite_en_stock` int(11) NOT NULL,
  `quantite_constatee` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `details_inventaire`
--

INSERT INTO `details_inventaire` (`id`, `inventaire_id`, `produit_id`, `quantite_en_stock`, `quantite_constatee`) VALUES
(19, 5, 18, 1, 1),
(20, 5, 19, 12, 12);

-- --------------------------------------------------------

--
-- Table structure for table `details_vente`
--

CREATE TABLE `details_vente` (
  `id` int(11) NOT NULL,
  `vente_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL,
  `prix_unitaire` double NOT NULL,
  `total_ligne` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `details_vente`
--

INSERT INTO `details_vente` (`id`, `vente_id`, `produit_id`, `quantite`, `prix_unitaire`, `total_ligne`) VALUES
(5, 10, 19, 1, 100, 100),
(6, 11, 18, 2, 100, 200),
(7, 12, 19, 1, 100, 100),
(8, 12, 18, 1, 100, 100);

-- --------------------------------------------------------

--
-- Table structure for table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `adresse` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id`, `nom`, `contact`, `telephone`, `adresse`) VALUES
(5, 'shalina', NULL, '', 'Goma, birere'),
(6, 'unique pharma', NULL, '', 'Goma, birere'),
(7, 'moon pharma', NULL, '', 'Goma, axe birere');

-- --------------------------------------------------------

--
-- Table structure for table `inventaires`
--

CREATE TABLE `inventaires` (
  `id` int(11) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `date_inventaire` datetime DEFAULT current_timestamp(),
  `utilisateur_id` int(11) DEFAULT NULL,
  `statut` enum('en_cours','valide','annule') DEFAULT 'en_cours',
  `observations` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventaires`
--

INSERT INTO `inventaires` (`id`, `reference`, `date_inventaire`, `utilisateur_id`, `statut`, `observations`, `created_at`, `updated_at`) VALUES
(5, 'INV-1789859496601', '2026-09-19 23:11:36', 3, 'valide', '', '2026-09-19 23:11:36', '2026-09-19 23:11:36');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prix_achat` double DEFAULT NULL,
  `prix_vente` double NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 0,
  `stock_alerte` int(11) NOT NULL DEFAULT 5,
  `id_unite` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `dateExpiration` date NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `fournisseur_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `nom`, `prix_achat`, `prix_vente`, `quantite`, `stock_alerte`, `id_unite`, `description`, `dateExpiration`, `createdAt`, `updatedAt`, `categorie_id`, `fournisseur_id`) VALUES
(18, 'amoxilline 500mg', 200, 100, 1, 5, 5, NULL, '2026-12-10', '2026-09-19 20:30:43', '2026-09-19 23:11:36', 5, 6),
(19, 'amidol 500mg', NULL, 100, 12, 10, 6, NULL, '2027-04-14', '2026-09-19 20:50:16', '2026-09-19 23:11:36', 6, 5),
(20, 'Metro', NULL, 1500, 0, 10, 5, NULL, '2027-02-21', '2026-09-21 11:34:30', '2026-09-21 11:34:30', 5, 5);

-- --------------------------------------------------------

--
-- Table structure for table `sorties`
--

CREATE TABLE `sorties` (
  `id` int(11) NOT NULL,
  `service_beneficiaire` varchar(255) NOT NULL,
  `motif` text DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `dateSortie` datetime DEFAULT current_timestamp(),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sorties`
--

INSERT INTO `sorties` (`id`, `service_beneficiaire`, `motif`, `user_id`, `dateSortie`, `createdAt`, `updatedAt`) VALUES
(1, 'pediatrie', NULL, 3, '2026-09-19 23:04:22', '2026-09-19 23:04:22', '2026-09-19 23:04:22'),
(2, 'hospi', NULL, 3, '2026-09-19 23:09:23', '2026-09-19 23:09:23', '2026-09-19 23:09:23'),
(3, 'block operatoire', NULL, 3, '2026-09-19 23:09:59', '2026-09-19 23:09:59', '2026-09-19 23:09:59');

-- --------------------------------------------------------

--
-- Table structure for table `sortie_items`
--

CREATE TABLE `sortie_items` (
  `id` int(11) NOT NULL,
  `sortie_id` int(11) NOT NULL,
  `produit_id` int(11) NOT NULL,
  `quantite` int(11) NOT NULL CHECK (`quantite` > 0),
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sortie_items`
--

INSERT INTO `sortie_items` (`id`, `sortie_id`, `produit_id`, `quantite`, `createdAt`, `updatedAt`) VALUES
(1, 1, 18, 2, '2026-09-19 23:04:22', '2026-09-19 23:04:22'),
(2, 2, 18, 2, '2026-09-19 23:09:23', '2026-09-19 23:09:23'),
(3, 3, 19, 1, '2026-09-19 23:09:59', '2026-09-19 23:09:59');

-- --------------------------------------------------------

--
-- Table structure for table `unite_qte`
--

CREATE TABLE `unite_qte` (
  `id` int(11) NOT NULL,
  `label` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `unite_qte`
--

INSERT INTO `unite_qte` (`id`, `label`) VALUES
(5, 'plaquete'),
(6, 'flacon'),
(7, 'ampoule');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','pharmacien','assistant') DEFAULT 'assistant',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES
(3, 'alexis senga', 'alexxngabo@gmail.com', '$2b$10$FeLrkqa/HeNPNDdcnYy9duWAlhXZ.V0C8zkwRsedZTYoD.hA4cOTm', 'pharmacien', '2026-09-13 20:37:10', '2026-09-13 20:37:10'),
(4, 'samuel mb', 'samuel@gmail.com', '$2b$10$mnnv8tr966sHTJSnoDSwl.XrlyAcUhut/epYouOR2FDAbWTe2PptO', 'pharmacien', '2026-09-20 08:34:29', '2026-09-20 08:34:29');

-- --------------------------------------------------------

--
-- Table structure for table `vente`
--

CREATE TABLE `vente` (
  `id` int(11) NOT NULL,
  `nom_client` varchar(30) NOT NULL,
  `total` double NOT NULL,
  `dateVente` datetime NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vente`
--

INSERT INTO `vente` (`id`, `nom_client`, `total`, `dateVente`, `user_id`) VALUES
(10, 'samuel', 100, '2026-09-19 21:31:48', 3),
(11, 'eric', 200, '2026-09-19 22:02:37', 3),
(12, 'client ordinaire', 200, '2026-09-19 22:03:40', 3);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fr1` (`id_produit`),
  ADD KEY `frk2` (`id_utilisateur`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Indexes for table `details_inventaire`
--
ALTER TABLE `details_inventaire`
  ADD PRIMARY KEY (`id`),
  ADD KEY `inventaire_id` (`inventaire_id`),
  ADD KEY `produit_id` (`produit_id`);

--
-- Indexes for table `details_vente`
--
ALTER TABLE `details_vente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vente_id` (`vente_id`),
  ADD KEY `produit_id` (`produit_id`);

--
-- Indexes for table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `inventaires`
--
ALTER TABLE `inventaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`),
  ADD KEY `utilisateur_id` (`utilisateur_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_product_nom` (`nom`),
  ADD KEY `categorie_id` (`categorie_id`),
  ADD KEY `fournisseur_id` (`fournisseur_id`),
  ADD KEY `frk3` (`id_unite`);

--
-- Indexes for table `sorties`
--
ALTER TABLE `sorties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sorties_users` (`user_id`);

--
-- Indexes for table `sortie_items`
--
ALTER TABLE `sortie_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sortie_items_sorties` (`sortie_id`),
  ADD KEY `fk_sortie_items_products` (`produit_id`);

--
-- Indexes for table `unite_qte`
--
ALTER TABLE `unite_qte`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `vente`
--
ALTER TABLE `vente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `details_inventaire`
--
ALTER TABLE `details_inventaire`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `details_vente`
--
ALTER TABLE `details_vente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `inventaires`
--
ALTER TABLE `inventaires`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `sorties`
--
ALTER TABLE `sorties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sortie_items`
--
ALTER TABLE `sortie_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `unite_qte`
--
ALTER TABLE `unite_qte`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `vente`
--
ALTER TABLE `vente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  ADD CONSTRAINT `fr1` FOREIGN KEY (`id_produit`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `frk2` FOREIGN KEY (`id_utilisateur`) REFERENCES `users` (`id`);

--
-- Constraints for table `details_inventaire`
--
ALTER TABLE `details_inventaire`
  ADD CONSTRAINT `details_inventaire_ibfk_1` FOREIGN KEY (`inventaire_id`) REFERENCES `inventaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `details_inventaire_ibfk_2` FOREIGN KEY (`produit_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `details_vente`
--
ALTER TABLE `details_vente`
  ADD CONSTRAINT `fk_details_vente_products` FOREIGN KEY (`produit_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_details_vente_ventes` FOREIGN KEY (`vente_id`) REFERENCES `vente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `inventaires`
--
ALTER TABLE `inventaires`
  ADD CONSTRAINT `inventaires_ibfk_1` FOREIGN KEY (`utilisateur_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `frk3` FOREIGN KEY (`id_unite`) REFERENCES `unite_qte` (`id`),
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`fournisseur_id`) REFERENCES `fournisseurs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `sorties`
--
ALTER TABLE `sorties`
  ADD CONSTRAINT `fk_sorties_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `sortie_items`
--
ALTER TABLE `sortie_items`
  ADD CONSTRAINT `fk_sortie_items_products` FOREIGN KEY (`produit_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sortie_items_sorties` FOREIGN KEY (`sortie_id`) REFERENCES `sorties` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `vente`
--
ALTER TABLE `vente`
  ADD CONSTRAINT `vente_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
