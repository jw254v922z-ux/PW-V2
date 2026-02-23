CREATE TABLE `domain_whitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `domain_whitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `domain_whitelist_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_verification_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `grid_connection_costs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`solarModelId` int NOT NULL,
	`agriculturalTrenchingMin` int NOT NULL DEFAULT 600000,
	`agriculturalTrenchingMax` int NOT NULL DEFAULT 1050000,
	`roadTrenchingMin` int NOT NULL DEFAULT 1200000,
	`roadTrenchingMax` int NOT NULL DEFAULT 2400000,
	`majorRoadCrossingsMin` int NOT NULL DEFAULT 300000,
	`majorRoadCrossingsMax` int NOT NULL DEFAULT 600000,
	`jointBaysMin` int NOT NULL DEFAULT 120000,
	`jointBaysMax` int NOT NULL DEFAULT 240000,
	`transformersMin` int NOT NULL DEFAULT 500000,
	`transformersMax` int NOT NULL DEFAULT 800000,
	`landRightsCompensationMin` int NOT NULL DEFAULT 20000,
	`landRightsCompensationMax` int NOT NULL DEFAULT 60000,
	`landRightsLegalMin` int NOT NULL DEFAULT 50000,
	`landRightsLegalMax` int NOT NULL DEFAULT 90000,
	`planningFeesMin` int NOT NULL DEFAULT 600,
	`planningFeesMax` int NOT NULL DEFAULT 1200,
	`planningConsentsMin` int NOT NULL DEFAULT 15000,
	`planningConsentsMax` int NOT NULL DEFAULT 40000,
	`constructionMin` int NOT NULL DEFAULT 3200000,
	`constructionMax` int NOT NULL DEFAULT 4200000,
	`softCostsMin` int NOT NULL DEFAULT 85000,
	`softCostsMax` int NOT NULL DEFAULT 190000,
	`projectMin` int NOT NULL DEFAULT 3300000,
	`projectMax` int NOT NULL DEFAULT 4400000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `grid_connection_costs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `project_drawings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_drawings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`inputs` text NOT NULL,
	`results` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `solar_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`mw` int NOT NULL,
	`capexPerMW` int NOT NULL,
	`privateWireCost` int NOT NULL,
	`gridConnectionCost` int NOT NULL DEFAULT 0,
	`developmentPremiumPerMW` int NOT NULL,
	`opexPerMW` int NOT NULL,
	`opexEscalation` varchar(20) NOT NULL,
	`generationPerMW` varchar(20) NOT NULL,
	`degradationRate` varchar(20) NOT NULL,
	`projectLife` int NOT NULL,
	`discountRate` varchar(20) NOT NULL,
	`powerPrice` int NOT NULL,
	`percentConsumptionPPA` int NOT NULL DEFAULT 100,
	`percentConsumptionExport` int NOT NULL DEFAULT 0,
	`exportPrice` int NOT NULL DEFAULT 50,
	`offsetableEnergyCost` int NOT NULL DEFAULT 120,
	`lcoe` varchar(20),
	`irr` varchar(20),
	`paybackPeriod` varchar(20),
	`totalNpv` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `solar_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255),
	`emailVerified` int NOT NULL DEFAULT 0,
	`name` text,
	`loginMethod` varchar(64) DEFAULT 'custom',
	`role` text NOT NULL DEFAULT ('user'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
