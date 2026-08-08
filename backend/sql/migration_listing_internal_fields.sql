-- Backoffice-only listing fields (not exposed on public API)
ALTER TABLE listings
  ADD COLUMN source_name VARCHAR(255) NOT NULL DEFAULT '' AFTER availability,
  ADD COLUMN internal_note TEXT NULL AFTER source_name;
