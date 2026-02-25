-- MP25: Canton Coin Rewards tables
-- Run: docker exec dualis-postgres psql -U dualis -d dualis -f /tmp/0001_rewards.sql

-- 60. Activity Logs
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" varchar(64) PRIMARY KEY,
  "activity_type" varchar(32) NOT NULL,
  "user_id" varchar(256),
  "party_id" varchar(256) NOT NULL,
  "pool_id" varchar(128),
  "asset" varchar(64),
  "amount" numeric(38, 18),
  "canton_offset" varchar(64),
  "canton_contract_id" varchar(256),
  "activity_marker_created" boolean NOT NULL DEFAULT false,
  "activity_marker_contract_id" varchar(256),
  "reward_points" integer NOT NULL DEFAULT 0,
  "epoch" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_activity_logs_user" ON "activity_logs" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_party" ON "activity_logs" ("party_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_type" ON "activity_logs" ("activity_type", "created_at");
CREATE INDEX IF NOT EXISTS "idx_activity_logs_epoch" ON "activity_logs" ("epoch");

-- 61. Reward Epochs
CREATE TABLE IF NOT EXISTS "reward_epochs" (
  "id" serial PRIMARY KEY,
  "epoch_number" integer NOT NULL UNIQUE,
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "total_activities" integer NOT NULL DEFAULT 0,
  "total_volume" numeric(38, 18) NOT NULL DEFAULT '0',
  "total_points" integer NOT NULL DEFAULT 0,
  "canton_round_start" integer,
  "canton_round_end" integer,
  "canton_cc_earned" numeric(28, 8) NOT NULL DEFAULT '0',
  "status" varchar(16) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS "idx_reward_epochs_status" ON "reward_epochs" ("status");

-- 62. User Rewards
CREATE TABLE IF NOT EXISTS "user_rewards" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(256) NOT NULL UNIQUE,
  "total_points" integer NOT NULL DEFAULT 0,
  "total_activities" integer NOT NULL DEFAULT 0,
  "total_volume" numeric(38, 18) NOT NULL DEFAULT '0',
  "tier" varchar(16) NOT NULL DEFAULT 'bronze',
  "tier_multiplier" numeric(6, 2) NOT NULL DEFAULT '1.00',
  "last_activity_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_user_rewards_points" ON "user_rewards" ("total_points");
CREATE INDEX IF NOT EXISTS "idx_user_rewards_tier" ON "user_rewards" ("tier");

-- 63. Reward Claims
CREATE TABLE IF NOT EXISTS "reward_claims" (
  "id" varchar(64) PRIMARY KEY,
  "user_id" varchar(256) NOT NULL,
  "epoch_number" integer NOT NULL,
  "points_claimed" integer NOT NULL,
  "canton_cc_amount" numeric(28, 8),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_reward_claims_user" ON "reward_claims" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_reward_claims_epoch" ON "reward_claims" ("epoch_number");

-- Seed initial epoch
INSERT INTO "reward_epochs" ("epoch_number", "start_time", "status")
VALUES (1, now(), 'active')
ON CONFLICT ("epoch_number") DO NOTHING;
