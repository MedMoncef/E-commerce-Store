-- AlterTable
ALTER TABLE `products` ADD COLUMN `seoDescription` TEXT NULL,
    ADD COLUMN `seoKeywords` VARCHAR(191) NULL,
    ADD COLUMN `seoTitle` VARCHAR(191) NULL;
