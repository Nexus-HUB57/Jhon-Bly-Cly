CREATE TABLE `reference_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`byteSize` int NOT NULL,
	`category` enum('imagem','áudio','vídeo','documento','texto') NOT NULL,
	`agentUse` varchar(120) NOT NULL DEFAULT 'referência criativa',
	`purpose` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reference_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reference_assets` ADD CONSTRAINT `reference_assets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;