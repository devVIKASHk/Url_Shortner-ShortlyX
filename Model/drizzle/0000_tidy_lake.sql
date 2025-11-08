CREATE TABLE `googleAuth` (
	`_id` serial AUTO_INCREMENT NOT NULL,
	`auth_provider` enum('google','github') NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `googleAuth__id` PRIMARY KEY(`_id`),
	CONSTRAINT `googleAuth_provider_account_id_unique` UNIQUE(`provider_account_id`)
);
--> statement-breakpoint
CREATE TABLE `sessionId` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`valid` boolean NOT NULL DEFAULT true,
	`ip` varchar(255),
	`user_agent` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`user_id` int NOT NULL,
	CONSTRAINT `sessionId_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `urlData` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`shortCode` varchar(255) NOT NULL,
	`url` varchar(512) NOT NULL,
	`user_id` int NOT NULL,
	CONSTRAINT `urlData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userData` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255),
	`is_verifed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userData_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `is_email_valid` (
	`_id` serial AUTO_INCREMENT NOT NULL,
	`token` varchar(8) NOT NULL,
	`expires_at` timestamp DEFAULT (CURRENT_TIMESTAMP+INTERVAL 1 DAY),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`user_id` int NOT NULL,
	CONSTRAINT `is_email_valid__id` PRIMARY KEY(`_id`)
);
--> statement-breakpoint
ALTER TABLE `googleAuth` ADD CONSTRAINT `googleAuth_user_id_userData_id_fk` FOREIGN KEY (`user_id`) REFERENCES `userData`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessionId` ADD CONSTRAINT `sessionId_user_id_userData_id_fk` FOREIGN KEY (`user_id`) REFERENCES `userData`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `urlData` ADD CONSTRAINT `urlData_user_id_userData_id_fk` FOREIGN KEY (`user_id`) REFERENCES `userData`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `is_email_valid` ADD CONSTRAINT `is_email_valid_user_id_userData_id_fk` FOREIGN KEY (`user_id`) REFERENCES `userData`(`id`) ON DELETE cascade ON UPDATE no action;