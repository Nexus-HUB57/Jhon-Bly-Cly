CREATE TABLE `fusion_sync_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventName` varchar(160) NOT NULL,
	`payload` json NOT NULL,
	`deliveryStatus` enum('pendente','entregue','falha') NOT NULL DEFAULT 'pendente',
	`deliveryAttempts` int NOT NULL DEFAULT 0,
	`deliveryError` text,
	`deliveredAt` timestamp,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `fusion_sync_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `fusion_sync_events` ADD CONSTRAINT `fusion_sync_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;