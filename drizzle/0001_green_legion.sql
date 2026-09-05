CREATE TABLE `generation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int,
	`runType` enum('planejamento','imagem_referência','vídeo','exportação') NOT NULL,
	`status` enum('rascunho','planejando','aguardando revisão','gerando','concluído','com falha') NOT NULL DEFAULT 'rascunho',
	`input` json NOT NULL,
	`output` json,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`finishedAt` timestamp,
	CONSTRAINT `generation_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orchestra_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int,
	`eventName` varchar(160) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int NOT NULL,
	`payload` json NOT NULL,
	`deliveryStatus` enum('pendente','entregue','falha') NOT NULL DEFAULT 'pendente',
	`deliveryAttempts` int NOT NULL DEFAULT 0,
	`deliveryError` text,
	`deliveredAt` timestamp,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orchestra_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int,
	`uploadedBy` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`storageKey` varchar(1024),
	`url` varchar(2048) NOT NULL,
	`mimeType` varchar(160) NOT NULL,
	`byteSize` int NOT NULL DEFAULT 0,
	`kind` enum('referência','imagem gerada','resultado de vídeo','exportação') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`versionType` varchar(64) NOT NULL,
	`content` json NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`briefing` text NOT NULL,
	`format` varchar(24) NOT NULL,
	`durationSeconds` int NOT NULL,
	`language` varchar(80) NOT NULL,
	`objective` text NOT NULL,
	`creativeDirection` text,
	`script` text,
	`creativeSummary` text,
	`status` enum('rascunho','planejando','aguardando revisão','gerando','concluído','com falha') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneNumber` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`durationSeconds` int NOT NULL,
	`narrative` text NOT NULL,
	`camera` text,
	`visualPrompt` text NOT NULL,
	`productionPrompt` text NOT NULL,
	`storyboardPrompt` text NOT NULL,
	`referenceImageUrl` varchar(2048),
	`generationConfig` json,
	`status` enum('rascunho','planejando','aguardando revisão','gerando','concluído','com falha') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generation_runs` ADD CONSTRAINT `generation_runs_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generation_runs` ADD CONSTRAINT `generation_runs_sceneId_video_scenes_id_fk` FOREIGN KEY (`sceneId`) REFERENCES `video_scenes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orchestra_events` ADD CONSTRAINT `orchestra_events_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orchestra_events` ADD CONSTRAINT `orchestra_events_sceneId_video_scenes_id_fk` FOREIGN KEY (`sceneId`) REFERENCES `video_scenes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_assets` ADD CONSTRAINT `project_assets_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_assets` ADD CONSTRAINT `project_assets_sceneId_video_scenes_id_fk` FOREIGN KEY (`sceneId`) REFERENCES `video_scenes`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_assets` ADD CONSTRAINT `project_assets_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_versions` ADD CONSTRAINT `project_versions_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_versions` ADD CONSTRAINT `project_versions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_projects` ADD CONSTRAINT `video_projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `video_scenes` ADD CONSTRAINT `video_scenes_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;