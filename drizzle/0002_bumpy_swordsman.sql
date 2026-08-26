CREATE TABLE `fusion_connector_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectorId` varchar(120) NOT NULL,
	`status` enum('não configurado','aguardando credencial','ativo','bloqueado') NOT NULL DEFAULT 'não configurado',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fusion_connector_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `fusion_connector_profiles_user_connector_unique` UNIQUE(`userId`,`connectorId`)
);
--> statement-breakpoint
ALTER TABLE `fusion_connector_profiles` ADD CONSTRAINT `fusion_connector_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;