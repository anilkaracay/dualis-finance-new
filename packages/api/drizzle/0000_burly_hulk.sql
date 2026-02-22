CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_hash" varchar(256) NOT NULL,
	"name" varchar(128) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"permissions" jsonb NOT NULL,
	"rate_limit" integer DEFAULT 1000 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "compliance_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" varchar(256) NOT NULL,
	"institution_id" varchar(256) NOT NULL,
	"document_type" varchar(64) NOT NULL,
	"file_name" varchar(256) NOT NULL,
	"mime_type" varchar(128) NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "compliance_documents_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "composite_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"composite_score" real NOT NULL,
	"tier" varchar(32) NOT NULL,
	"on_chain_score" real NOT NULL,
	"off_chain_score" real NOT NULL,
	"ecosystem_score" real NOT NULL,
	"on_chain_detail" jsonb NOT NULL,
	"off_chain_detail" jsonb NOT NULL,
	"ecosystem_detail" jsonb NOT NULL,
	"benefits" jsonb NOT NULL,
	"last_calculated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "composite_scores_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "corporate_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" varchar(256) NOT NULL,
	"deal_id" varchar(256) NOT NULL,
	"action_type" varchar(32) NOT NULL,
	"security" varchar(64) NOT NULL,
	"record_date" timestamp with time zone NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"amount" numeric(38, 18) NOT NULL,
	"status" varchar(32) NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "corporate_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "credit_attestations" (
	"id" serial PRIMARY KEY NOT NULL,
	"attestation_id" varchar(256) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"attestation_type" varchar(64) NOT NULL,
	"provider" varchar(128) NOT NULL,
	"claimed_range" varchar(64) NOT NULL,
	"proof" jsonb NOT NULL,
	"issued_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked" boolean DEFAULT false NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_attestations_attestation_id_unique" UNIQUE("attestation_id")
);
--> statement-breakpoint
CREATE TABLE "credit_score_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"raw_score" real NOT NULL,
	"credit_tier" varchar(32) NOT NULL,
	"breakdown" jsonb NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_score_cache_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"token_hash" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "fractional_offers" (
	"id" serial PRIMARY KEY NOT NULL,
	"offer_id" varchar(256) NOT NULL,
	"lender" varchar(256) NOT NULL,
	"security" jsonb NOT NULL,
	"total_amount" numeric(38, 18) NOT NULL,
	"remaining_amount" numeric(38, 18) NOT NULL,
	"min_fill_amount" numeric(38, 18) NOT NULL,
	"fee_rate" real NOT NULL,
	"fills" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fractional_offers_offer_id_unique" UNIQUE("offer_id")
);
--> statement-breakpoint
CREATE TABLE "governance_proposals" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposal_id" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"proposer" varchar(256) NOT NULL,
	"status" varchar(32) NOT NULL,
	"for_votes" numeric(38, 18) NOT NULL,
	"against_votes" numeric(38, 18) NOT NULL,
	"abstain_votes" numeric(38, 18) NOT NULL,
	"quorum" numeric(38, 18) NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_proposals_proposal_id_unique" UNIQUE("proposal_id")
);
--> statement-breakpoint
CREATE TABLE "institutional_api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_id" varchar(256) NOT NULL,
	"institution_party" varchar(256) NOT NULL,
	"name" varchar(128) NOT NULL,
	"key_hash" varchar(256) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"permissions" jsonb NOT NULL,
	"rate_limit" integer DEFAULT 5000 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "institutional_api_keys_key_id_unique" UNIQUE("key_id"),
	CONSTRAINT "institutional_api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"company_name" varchar(256) NOT NULL,
	"company_legal_name" varchar(256),
	"registration_number" varchar(128),
	"tax_id" varchar(128),
	"jurisdiction" varchar(8) NOT NULL,
	"company_type" varchar(64),
	"website" varchar(512),
	"address_line_1" varchar(256),
	"address_line_2" varchar(256),
	"city" varchar(128),
	"state" varchar(128),
	"postal_code" varchar(32),
	"country" varchar(8),
	"rep_first_name" varchar(256) NOT NULL,
	"rep_last_name" varchar(256) NOT NULL,
	"rep_title" varchar(256) NOT NULL,
	"rep_email" varchar(320) NOT NULL,
	"rep_phone" varchar(32),
	"kyb_status" varchar(32) DEFAULT 'not_started' NOT NULL,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"kyb_submitted_at" timestamp with time zone,
	"kyb_approved_at" timestamp with time zone,
	"kyb_review_notes" text,
	"beneficial_owners" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"risk_profile" jsonb,
	"api_key_hash" varchar(256),
	"api_key_prefix" varchar(16),
	"custom_fee_rate" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_institution_id_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
CREATE TABLE "iot_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"metric_type" varchar(64) NOT NULL,
	"value" real NOT NULL,
	"unit" varchar(32) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquidation_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"borrower" varchar(256) NOT NULL,
	"liquidator" varchar(256) NOT NULL,
	"pool_id" varchar(128) NOT NULL,
	"borrow_position_id" varchar(256) NOT NULL,
	"debt_asset" varchar(64),
	"debt_repaid" numeric(38, 18),
	"collateral_asset" varchar(64),
	"collateral_seized" numeric(38, 18) NOT NULL,
	"liquidation_penalty" real,
	"liquidator_reward" numeric(38, 18) NOT NULL,
	"protocol_fee" numeric(38, 18) NOT NULL,
	"health_factor_before" real NOT NULL,
	"health_factor_after" real NOT NULL,
	"tier" varchar(32) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256),
	"email" varchar(320),
	"provider" varchar(32) NOT NULL,
	"success" boolean NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"failure_reason" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "netting_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_id" varchar(256) NOT NULL,
	"party_a" varchar(256) NOT NULL,
	"party_b" varchar(256) NOT NULL,
	"deal_ids" jsonb NOT NULL,
	"net_amount" numeric(38, 18) NOT NULL,
	"net_direction" varchar(32) NOT NULL,
	"status" varchar(32) NOT NULL,
	"executed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "netting_agreements_agreement_id_unique" UNIQUE("agreement_id")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"health_factor_threshold" real DEFAULT 1.2 NOT NULL,
	"liquidation_alerts" boolean DEFAULT true NOT NULL,
	"sec_lending_alerts" boolean DEFAULT true NOT NULL,
	"governance_alerts" boolean DEFAULT false NOT NULL,
	"email_address" varchar(320),
	"email_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"token_hash" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "pool_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" varchar(128) NOT NULL,
	"total_supply" numeric(38, 18) NOT NULL,
	"total_borrow" numeric(38, 18) NOT NULL,
	"total_reserves" numeric(38, 18) NOT NULL,
	"supply_apy" real NOT NULL,
	"borrow_apy" real NOT NULL,
	"utilization" real NOT NULL,
	"price_usd" numeric(28, 8) NOT NULL,
	"borrow_index" numeric(36, 18),
	"supply_index" numeric(36, 18),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset" varchar(64) NOT NULL,
	"price" numeric(28, 8) NOT NULL,
	"confidence" real NOT NULL,
	"source" varchar(128) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"requester_party" varchar(256) NOT NULL,
	"data_scope" varchar(32) NOT NULL,
	"granted" boolean NOT NULL,
	"reason" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "privacy_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"privacy_level" varchar(32) NOT NULL,
	"disclosure_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"audit_trail_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "privacy_configs_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "productive_borrows" (
	"id" serial PRIMARY KEY NOT NULL,
	"borrow_id" varchar(256) NOT NULL,
	"borrower_party" varchar(256) NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"pool_id" varchar(128) NOT NULL,
	"loan_amount" numeric(38, 18) NOT NULL,
	"outstanding_debt" numeric(38, 18) NOT NULL,
	"interest_rate" real NOT NULL,
	"collateral" jsonb NOT NULL,
	"grace_period_end" timestamp with time zone NOT NULL,
	"maturity_date" timestamp with time zone NOT NULL,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productive_borrows_borrow_id_unique" UNIQUE("borrow_id")
);
--> statement-breakpoint
CREATE TABLE "productive_cashflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"borrow_id" varchar(256) NOT NULL,
	"expected_date" timestamp with time zone NOT NULL,
	"expected_amount" numeric(38, 18) NOT NULL,
	"actual_amount" numeric(38, 18),
	"source" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productive_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" varchar(256) NOT NULL,
	"owner_party_id" varchar(256) NOT NULL,
	"category" varchar(64) NOT NULL,
	"status" varchar(32) NOT NULL,
	"metadata" jsonb NOT NULL,
	"attestations" jsonb NOT NULL,
	"requested_amount" numeric(38, 18) NOT NULL,
	"funded_amount" numeric(38, 18) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productive_projects_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "protocol_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"tvl" numeric(38, 18) NOT NULL,
	"total_borrowed" numeric(38, 18) NOT NULL,
	"total_fees" numeric(38, 18) NOT NULL,
	"total_liquidations" numeric(38, 18) NOT NULL,
	"unique_users" integer NOT NULL,
	"total_transactions" integer NOT NULL,
	"avg_health_factor" real NOT NULL,
	"sec_lending_volume" numeric(38, 18) NOT NULL,
	"flash_loan_volume" numeric(38, 18) NOT NULL,
	"protocol_revenue" numeric(38, 18) NOT NULL,
	CONSTRAINT "protocol_analytics_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "retail_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"first_name" varchar(256),
	"last_name" varchar(256),
	"country" varchar(8),
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retail_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sec_lending_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" varchar(256) NOT NULL,
	"offer_id" varchar(256) NOT NULL,
	"lender" varchar(256) NOT NULL,
	"borrower" varchar(256) NOT NULL,
	"security" jsonb NOT NULL,
	"status" varchar(32) NOT NULL,
	"fee_accrued" numeric(38, 18) NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"refresh_token_hash" varchar(256) NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"device" varchar(256),
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"activity_type" varchar(32) NOT NULL,
	"pool_id" varchar(128),
	"amount" numeric(38, 18),
	"transaction_id" varchar(256),
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" varchar(256),
	"role" varchar(32) DEFAULT 'retail' NOT NULL,
	"account_status" varchar(32) DEFAULT 'pending_verification' NOT NULL,
	"auth_provider" varchar(32) DEFAULT 'email' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"wallet_address" varchar(256),
	"party_id" varchar(256) NOT NULL,
	"display_name" varchar(256),
	"kyc_status" varchar(32) DEFAULT 'not_started' NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "users_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "verified_institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_party" varchar(256) NOT NULL,
	"legal_name" varchar(256) NOT NULL,
	"registration_no" varchar(128) NOT NULL,
	"jurisdiction" varchar(8) NOT NULL,
	"kyb_status" varchar(32) NOT NULL,
	"kyb_level" varchar(32) NOT NULL,
	"risk_profile" jsonb NOT NULL,
	"sub_accounts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verified_institutions_institution_party_unique" UNIQUE("institution_party")
);
--> statement-breakpoint
CREATE TABLE "wallet_nonces" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(256) NOT NULL,
	"nonce" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
