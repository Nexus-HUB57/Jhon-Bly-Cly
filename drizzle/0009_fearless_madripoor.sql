CREATE TABLE `core_role_audit_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` enum('planner','executor','monitor','optimizer') NOT NULL,
	`eventName` varchar(255) NOT NULL,
	`status` enum('aguardando evidências','pronto','observando','aguardando revisão','bloqueado','atenção') NOT NULL,
	`evidenceCount` int NOT NULL DEFAULT 0,
	`summary` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `core_role_audit_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `core_role_audit_events` ADD CONSTRAINT `core_role_audit_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;