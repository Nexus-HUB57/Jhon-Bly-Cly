CREATE TABLE `governance_catalog_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kind` enum('memória','roteamento','ferramenta') NOT NULL,
	`identifier` varchar(160) NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('catálogo','aguardando aprovação','ativado','bloqueado') NOT NULL DEFAULT 'catálogo',
	`riskLevel` enum('baixo','médio','alto') NOT NULL DEFAULT 'médio',
	`requiresHumanApproval` int NOT NULL DEFAULT 1,
	`externalEndpoint` varchar(1024),
	`purpose` text NOT NULL,
	`guardrail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governance_catalog_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `governance_catalog_user_identifier_unique` UNIQUE(`userId`,`identifier`)
);
--> statement-breakpoint
CREATE TABLE `governed_tool_invocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`catalogEntryId` int,
	`action` varchar(255) NOT NULL,
	`status` enum('proposta','aprovada','rejeitada','bloqueada','concluída','com falha') NOT NULL DEFAULT 'proposta',
	`requestSummary` text NOT NULL,
	`resultSummary` text,
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governed_tool_invocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operational_maturity_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`level` enum('observação','orientação','proposta','revisão') NOT NULL DEFAULT 'observação',
	`autonomyCeiling` enum('observação','orientação','proposta') NOT NULL DEFAULT 'observação',
	`evidenceCount` int NOT NULL DEFAULT 0,
	`approvedProposalCount` int NOT NULL DEFAULT 0,
	`reviewedMemoryCount` int NOT NULL DEFAULT 0,
	`encryptedAtRest` int NOT NULL DEFAULT 1,
	`lastCalculatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operational_maturity_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `operational_maturity_profiles_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `knowledge_memories` ADD `trustScore` int DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE `knowledge_memories` ADD `retentionClass` enum('curta','padrão','curada') DEFAULT 'padrão' NOT NULL;--> statement-breakpoint
ALTER TABLE `knowledge_memories` ADD `reviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `governance_catalog_entries` ADD CONSTRAINT `governance_catalog_entries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governed_tool_invocations` ADD CONSTRAINT `governed_tool_invocations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governed_tool_invocations` ADD CONSTRAINT `gti_catalog_fk` FOREIGN KEY (`catalogEntryId`) REFERENCES `governance_catalog_entries`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `governed_tool_invocations` ADD CONSTRAINT `gti_reviewer_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operational_maturity_profiles` ADD CONSTRAINT `omp_user_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
