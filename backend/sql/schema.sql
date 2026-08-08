CREATE DATABASE IF NOT EXISTS property_listing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE property_listing;

CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED PRIMARY KEY DEFAULT 1,
  contact_name VARCHAR(255) NOT NULL DEFAULT '',
  contact_phone VARCHAR(64) NOT NULL DEFAULT '',
  contact_whatsapp VARCHAR(64) NOT NULL DEFAULT '',
  contact_email VARCHAR(255) NOT NULL DEFAULT '',
  brand_name_en VARCHAR(255) NOT NULL DEFAULT 'Property Listings',
  brand_name_zh VARCHAR(255) NOT NULL DEFAULT '厂房仓库',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS amenities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(64) NOT NULL UNIQUE,
  label_en VARCHAR(128) NOT NULL,
  label_zh VARCHAR(128) NOT NULL,
  icon VARCHAR(64) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title_en VARCHAR(255) NOT NULL,
  title_zh VARCHAR(255) NOT NULL,
  description_en TEXT NOT NULL,
  description_zh TEXT NOT NULL,
  property_type ENUM('factory', 'warehouse') NOT NULL,
  deal_type ENUM('rent', 'sell') NOT NULL,
  price_idr BIGINT UNSIGNED NOT NULL,
  area_sqm DECIMAL(12, 2) NOT NULL,
  city VARCHAR(128) NOT NULL,
  district VARCHAR(128) NOT NULL DEFAULT '',
  address VARCHAR(512) NOT NULL DEFAULT '',
  visibility ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  availability ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  source_name VARCHAR(255) NOT NULL DEFAULT '',
  internal_note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_listings_public (visibility, availability, city, property_type, deal_type),
  INDEX idx_listings_price (price_idr),
  INDEX idx_listings_area (area_sqm)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listing_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  listing_id INT UNSIGNED NOT NULL,
  path VARCHAR(512) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_listing_images_listing
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  INDEX idx_listing_images_listing (listing_id, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS listing_amenities (
  listing_id INT UNSIGNED NOT NULL,
  amenity_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (listing_id, amenity_id),
  CONSTRAINT fk_la_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT fk_la_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB;
