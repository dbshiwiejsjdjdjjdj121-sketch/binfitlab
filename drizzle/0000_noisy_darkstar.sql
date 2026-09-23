CREATE TABLE `usage_daily` (
	`day` text NOT NULL,
	`event` text NOT NULL,
	`tool` text NOT NULL,
	`outcome` text NOT NULL,
	`reason` text NOT NULL,
	`duration` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `event`, `tool`, `outcome`, `reason`, `duration`)
);
