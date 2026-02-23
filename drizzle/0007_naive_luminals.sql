ALTER TABLE `domain_whitelist` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `email_verification_tokens` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `grid_connection_costs` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `grid_connection_costs` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `password_reset_tokens` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `project_drawings` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `description` varchar(1000);--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `inputs` varchar(65535) NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `results` varchar(65535) NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `solar_models` MODIFY COLUMN `description` varchar(1000);--> statement-breakpoint
ALTER TABLE `solar_models` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `solar_models` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) NOT NULL DEFAULT 'custom';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(50) NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp DEFAULT (now());