CREATE TABLE `improvement_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleRunId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`rationale` text NOT NULL,
	`evidence` json NOT NULL,
	`proposedAction` text NOT NULL,
	`riskLevel` enum('baixo','médio','alto') NOT NULL DEFAULT 'médio',
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `improvement_proposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`sourceType` enum('referência','evento','ciclo','manual') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`tags` json,
	`sourceReference` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_retrievals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`query` text NOT NULL,
	`resultCount` int NOT NULL DEFAULT 0,
	`retrievedMemoryIds` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memory_retrievals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orchestra_inbox_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(255) NOT NULL,
	`eventName` varchar(160) NOT NULL,
	`source` varchar(160) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`payload` json NOT NULL,
	`status` enum('recebido','duplicado','rejeitado','processado') NOT NULL DEFAULT 'recebido',
	`verificationError` text,
	CONSTRAINT `orchestra_inbox_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `orchestra_inbox_events_event_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `orchestration_cycle_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cycleId` int NOT NULL,
	`trigger` enum('manual','agendado','evento') NOT NULL,
	`idempotencyKey` varchar(255) NOT NULL,
	`status` enum('pausado','pronto','em execução','aguardando revisão','concluído','com falha') NOT NULL DEFAULT 'pronto',
	`evidenceCount` int NOT NULL DEFAULT 0,
	`retrievedCount` int NOT NULL DEFAULT 0,
	`summary` text,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `orchestration_cycle_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `orchestration_cycle_runs_idempotency_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `orchestration_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('pausado','pronto','em execução','aguardando revisão','concluído','com falha') NOT NULL DEFAULT 'pausado',
	`scheduleCron` varchar(120) NOT NULL DEFAULT '0 */6 * * *',
	`taskUid` varchar(255),
	`minIntervalMinutes` int NOT NULL DEFAULT 15,
	`maxEvidencePerCycle` int NOT NULL DEFAULT 12,
	`lastStartedAt` timestamp,
	`lastFinishedAt` timestamp,
	`lastError` text,
	`pausedReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orchestration_cycles_id` PRIMARY KEY(`id`),
	CONSTRAINT `orchestration_cycles_user_unique` UNIQUE(`userId`),
	CONSTRAINT `orchestration_cycles_task_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
ALTER TABLE `improvement_proposals` ADD CONSTRAINT `improvement_proposals_cycleRunId_orchestration_cycle_runs_id_fk` FOREIGN KEY (`cycleRunId`) REFERENCES `orchestration_cycle_runs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `improvement_proposals` ADD CONSTRAINT `improvement_proposals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `improvement_proposals` ADD CONSTRAINT `improvement_proposals_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledge_memories` ADD CONSTRAINT `knowledge_memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `knowledge_memories` ADD CONSTRAINT `knowledge_memories_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memory_retrievals` ADD CONSTRAINT `memory_retrievals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memory_retrievals` ADD CONSTRAINT `memory_retrievals_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orchestration_cycle_runs` ADD CONSTRAINT `orchestration_cycle_runs_cycleId_orchestration_cycles_id_fk` FOREIGN KEY (`cycleId`) REFERENCES `orchestration_cycles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orchestration_cycles` ADD CONSTRAINT `orchestration_cycles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;