-- ============================================================
--  Team Mavericks — Database Schema
--  Generated from Sequelize models
--  Import this file into phpMyAdmin on Hostinger
-- ============================================================
--  Database: mavericks_events
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
--  Create Database (if not already created on Hostinger)
-- ============================================================
-- CREATE DATABASE IF NOT EXISTS `mavericks_events`
--   DEFAULT CHARACTER SET utf8mb4
--   COLLATE utf8mb4_general_ci;
-- USE `mavericks_events`;

-- ============================================================
--  Table: Users
-- ============================================================
CREATE TABLE IF NOT EXISTS `Users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `prn` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'member', 'admin') NOT NULL DEFAULT 'user',
  `phone` VARCHAR(255) DEFAULT NULL,
  `mustChangePassword` TINYINT(1) NOT NULL DEFAULT 0,
  `college` VARCHAR(255) DEFAULT NULL,
  `branch` VARCHAR(255) DEFAULT NULL,
  `year` ENUM('FY', 'SY', 'TY', 'Final', 'Other') DEFAULT NULL,
  `unique_id` VARCHAR(255) DEFAULT NULL,
  `profile_picture` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prn` (`prn`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `unique_id` (`unique_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: Events
-- ============================================================
CREATE TABLE IF NOT EXISTS `Events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `date` DATE NOT NULL,
  `time` VARCHAR(255) DEFAULT NULL,
  `venue` VARCHAR(255) DEFAULT NULL,
  `photo_url` VARCHAR(255) DEFAULT NULL,
  `poster_url` VARCHAR(255) DEFAULT NULL,
  `qr_code_url` VARCHAR(255) DEFAULT NULL,
  `offline_payment` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_amount` INT NOT NULL DEFAULT 0,
  `require_online_payment` TINYINT(1) NOT NULL DEFAULT 0,
  `require_offline_payment` TINYINT(1) NOT NULL DEFAULT 0,
  `offline_payment_contacts` TEXT DEFAULT NULL,
  `custom_fields` TEXT DEFAULT NULL,
  `status` ENUM('active', 'past') NOT NULL DEFAULT 'active',
  `whatsapp_link` VARCHAR(255) DEFAULT NULL,
  `payment_details` TEXT DEFAULT NULL,
  `participant_limit` INT DEFAULT NULL,
  `event_duration` INT NOT NULL DEFAULT 1,
  `registration_open` TINYINT(1) NOT NULL DEFAULT 1,
  `attendance_sessions` TEXT DEFAULT NULL,
  `isFeedbackEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `feedbackQuestions` TEXT DEFAULT NULL,
  `isCountdownEnabled` TINYINT(1) NOT NULL DEFAULT 0,
  `countdownTargetDate` DATETIME DEFAULT NULL,
  `feedbackTitle` VARCHAR(255) DEFAULT 'Event Feedback',
  `feedbackSessions` TEXT DEFAULT NULL,
  `certificateTemplates` LONGTEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: Registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS `Registrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  `payment_ss_url` VARCHAR(255) DEFAULT NULL,
  `payment_method` ENUM('online', 'offline') NOT NULL DEFAULT 'online',
  `custom_data` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `attendance` TINYINT(1) NOT NULL DEFAULT 0,
  `qr_code_data` TEXT DEFAULT NULL,
  `isCertificateIssued` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_registrations_user` (`user_id`),
  KEY `fk_registrations_event` (`event_id`),
  CONSTRAINT `fk_registrations_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_registrations_event` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: Queries
-- ============================================================
CREATE TABLE IF NOT EXISTS `Queries` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `response` TEXT DEFAULT NULL,
  `status` ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_queries_user` (`user_id`),
  CONSTRAINT `fk_queries_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: otp_verifications (Otp model)
-- ============================================================
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `otp` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: Attendances
-- ============================================================
CREATE TABLE IF NOT EXISTS `Attendances` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `registration_id` INT NOT NULL,
  `day_number` INT NOT NULL,
  `session_id` VARCHAR(255) DEFAULT NULL,
  `scanned_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_attendances_registration` (`registration_id`),
  CONSTRAINT `fk_attendances_registration` FOREIGN KEY (`registration_id`) REFERENCES `Registrations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: SeatingGrids
-- ============================================================
CREATE TABLE IF NOT EXISTS `SeatingGrids` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `rows` INT NOT NULL DEFAULT 5,
  `cols` INT NOT NULL DEFAULT 6,
  `blocked_cells` TEXT DEFAULT '[]',
  `zone_map` TEXT DEFAULT '[]',
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_id` (`event_id`),
  CONSTRAINT `fk_seatinggrids_event` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: AllocationRules
-- ============================================================
CREATE TABLE IF NOT EXISTS `AllocationRules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `mode` ENUM('group', 'pair', 'squad') NOT NULL DEFAULT 'group',
  `group_size` INT NOT NULL DEFAULT 4,
  `mix_branches` TINYINT(1) NOT NULL DEFAULT 1,
  `no_repeat_pairs` TINYINT(1) NOT NULL DEFAULT 1,
  `is_locked` TINYINT(1) NOT NULL DEFAULT 0,
  `custom_constraints` TEXT DEFAULT '{}',
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_id` (`event_id`),
  CONSTRAINT `fk_allocationrules_event` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: Assignments
-- ============================================================
CREATE TABLE IF NOT EXISTS `Assignments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `day_number` INT NOT NULL DEFAULT 1,
  `group_name` VARCHAR(255) NOT NULL,
  `seat_row` INT DEFAULT NULL,
  `seat_col` INT DEFAULT NULL,
  `role` VARCHAR(255) DEFAULT NULL,
  `is_revealed` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignments_event_user_day` (`event_id`, `user_id`, `day_number`),
  KEY `fk_assignments_user` (`user_id`),
  CONSTRAINT `fk_assignments_event` FOREIGN KEY (`event_id`) REFERENCES `Events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_assignments_user` FOREIGN KEY (`user_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: AuditLogs
-- ============================================================
CREATE TABLE IF NOT EXISTS `AuditLogs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT DEFAULT NULL,
  `userName` VARCHAR(255) NOT NULL,
  `userRole` VARCHAR(255) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `target` VARCHAR(255) DEFAULT NULL,
  `ipAddress` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_auditlogs_user` (`userId`),
  CONSTRAINT `fk_auditlogs_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: SystemConfigs
-- ============================================================
CREATE TABLE IF NOT EXISTS `SystemConfigs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `supportPhone1Name` VARCHAR(255) DEFAULT NULL,
  `supportPhone1Number` VARCHAR(255) DEFAULT NULL,
  `supportPhone2Name` VARCHAR(255) DEFAULT NULL,
  `supportPhone2Number` VARCHAR(255) DEFAULT NULL,
  `supportEmail` VARCHAR(255) DEFAULT NULL,
  `instagramUrl` VARCHAR(255) DEFAULT NULL,
  `linkedinUrl` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
--  Table: FeedbackResponses
-- ============================================================
CREATE TABLE IF NOT EXISTS `FeedbackResponses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `eventId` INT NOT NULL,
  `sessionName` VARCHAR(255) NOT NULL DEFAULT 'General',
  `userId` INT NOT NULL,
  `answers` TEXT DEFAULT NULL,
  `rating` INT NOT NULL,
  `isHidden` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_feedbackresponses_event` (`eventId`),
  KEY `fk_feedbackresponses_user` (`userId`),
  CONSTRAINT `fk_feedbackresponses_event` FOREIGN KEY (`eventId`) REFERENCES `Events` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_feedbackresponses_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
