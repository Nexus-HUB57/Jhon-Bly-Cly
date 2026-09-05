CREATE TABLE `scene_production_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneId` int NOT NULL,
	`createdBy` int NOT NULL,
	`status` enum('rascunho','aguardando revisão','aprovado','rejeitado') NOT NULL DEFAULT 'rascunho',
	`keyframePlan` json NOT NULL,
	`audioPlan` json NOT NULL,
	`editDecisionList` json NOT NULL,
	`qualityGate` json NOT NULL,
	`reviewNote` text,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scene_production_packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `scene_production_packages_scene_unique` UNIQUE(`sceneId`)
);
--> statement-breakpoint
ALTER TABLE `scene_production_packages` ADD CONSTRAINT `scene_production_packages_projectId_video_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `video_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scene_production_packages` ADD CONSTRAINT `scene_production_packages_sceneId_video_scenes_id_fk` FOREIGN KEY (`sceneId`) REFERENCES `video_scenes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `scene_production_packages` ADD CONSTRAINT `scene_production_packages_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;