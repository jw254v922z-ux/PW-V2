ALTER TABLE `solar_models` ADD `percentConsumptionPPA` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `solar_models` ADD `percentConsumptionExport` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `solar_models` ADD `exportPrice` int DEFAULT 50 NOT NULL;