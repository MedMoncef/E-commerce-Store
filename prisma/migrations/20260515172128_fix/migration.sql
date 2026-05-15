-- AlterTable
ALTER TABLE `users` ADD COLUMN `addressLine1` VARCHAR(191) NULL,
    ADD COLUMN `addressLine2` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(32) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `previousEmails` JSON NULL,
    ADD COLUMN `previousNames` JSON NULL;
