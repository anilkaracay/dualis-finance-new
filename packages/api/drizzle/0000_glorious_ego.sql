CREATE TABLE "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(128) NOT NULL,
	"target_type" varchar(64) NOT NULL,
	"target_id" varchar(256),
	"old_value" jsonb,
	"new_value" jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logout_at" timestamp with time zone,
	"ip_address" varchar(64),
	"user_agent" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aml_screenings" (
	"id" serial PRIMARY KEY NOT NULL,
	"screening_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"screening_type" varchar(32) NOT NULL,
	"provider" varchar(32) DEFAULT 'chainalysis' NOT NULL,
	"external_id" varchar(256),
	"status" varchar(32) DEFAULT 'clean' NOT NULL,
	"risk_score" real DEFAULT 0 NOT NULL,
	"risk_category" varchar(32),
	"wallet_address" varchar(256),
	"exposures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"flag_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"raw_response" jsonb,
	"reviewed_by" varchar(256),
	"review_note" text,
	"screened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_screening_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "aml_screenings_screening_id_unique" UNIQUE("screening_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"user_id" varchar(256),
	"pool_id" varchar(128),
	"amount" numeric(30, 6),
	"amount_usd" numeric(30, 6) NOT NULL,
	"tx_hash" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_pool_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" varchar(128) NOT NULL,
	"total_supply_usd" numeric(30, 6) NOT NULL,
	"total_borrow_usd" numeric(30, 6) NOT NULL,
	"available_liquidity_usd" numeric(30, 6) NOT NULL,
	"tvl_usd" numeric(30, 6) NOT NULL,
	"utilization" numeric(10, 6) NOT NULL,
	"supply_apy" numeric(10, 6) NOT NULL,
	"borrow_apy" numeric(10, 6) NOT NULL,
	"depositor_count" integer DEFAULT 0 NOT NULL,
	"borrower_count" integer DEFAULT 0 NOT NULL,
	"reserve_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_protocol_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_tvl_usd" numeric(30, 6) NOT NULL,
	"total_supply_usd" numeric(30, 6) NOT NULL,
	"total_borrow_usd" numeric(30, 6) NOT NULL,
	"total_reserve_usd" numeric(30, 6) NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"active_pools" integer DEFAULT 0 NOT NULL,
	"avg_utilization" numeric(10, 6) NOT NULL,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_user_position_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"total_supply_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"total_borrow_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"total_collateral_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"net_worth_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"interest_earned_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"interest_paid_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"net_interest_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"health_factor" numeric(10, 4),
	"net_apy" numeric(10, 6),
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "compliance_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" varchar(256) NOT NULL,
	"user_id" varchar(256),
	"action" varchar(64) NOT NULL,
	"actor_id" varchar(256),
	"actor_type" varchar(32) NOT NULL,
	"category" varchar(32) NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_audit_log_event_id_unique" UNIQUE("event_id")
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
CREATE TABLE "custodial_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"custodial_party_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"encrypted_key_ref" varchar(512),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "custodial_parties_custodial_party_id_unique" UNIQUE("custodial_party_id")
);
--> statement-breakpoint
CREATE TABLE "data_deletion_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"request_type" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"reason" text,
	"retention_end_date" timestamp with time zone,
	"processed_by" integer,
	"processed_at" timestamp with time zone,
	"export_file_key" varchar(512),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_deletion_requests_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "dual_token_balances" (
	"user_id" varchar(256) PRIMARY KEY NOT NULL,
	"user_address" varchar(256) NOT NULL,
	"balance" numeric(28, 8) DEFAULT '0' NOT NULL,
	"total_delegated_out" numeric(28, 8) DEFAULT '0' NOT NULL,
	"total_delegated_in" numeric(28, 8) DEFAULT '0' NOT NULL,
	"effective_voting_power" numeric(28, 8) DEFAULT '0' NOT NULL,
	"last_synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_delivery_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"notification_id" varchar(64) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"to_address" varchar(320) NOT NULL,
	"template_id" varchar(64) NOT NULL,
	"resend_id" varchar(256),
	"status" varchar(16) NOT NULL,
	"error" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "governance_delegations" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"delegator_id" varchar(256) NOT NULL,
	"delegator_address" varchar(256) NOT NULL,
	"delegatee_id" varchar(256) NOT NULL,
	"delegatee_address" varchar(256) NOT NULL,
	"amount" numeric(28, 8) NOT NULL,
	"is_active" boolean DEFAULT true,
	"daml_contract_id" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "governance_execution_queue" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"proposal_id" varchar(32) NOT NULL,
	"action_type" varchar(64) NOT NULL,
	"action_payload" jsonb NOT NULL,
	"timelock_ends_at" timestamp with time zone NOT NULL,
	"execution_deadline" timestamp with time zone NOT NULL,
	"status" varchar(32) DEFAULT 'PENDING' NOT NULL,
	"executed_at" timestamp with time zone,
	"executed_by" varchar(256),
	"execution_tx_hash" varchar(256),
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_execution_queue_proposal_id_unique" UNIQUE("proposal_id")
);
--> statement-breakpoint
CREATE TABLE "governance_proposals" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"proposal_number" integer NOT NULL,
	"proposer_id" varchar(256) NOT NULL,
	"proposer_address" varchar(256) NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"discussion_url" text,
	"type" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(32) DEFAULT 'DRAFT' NOT NULL,
	"snapshot_block" integer,
	"voting_starts_at" timestamp with time zone,
	"voting_ends_at" timestamp with time zone,
	"timelock_ends_at" timestamp with time zone,
	"execution_deadline" timestamp with time zone,
	"executed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"vetoed_at" timestamp with time zone,
	"vetoed_by" varchar(256),
	"votes_for" numeric(28, 8) DEFAULT '0' NOT NULL,
	"votes_against" numeric(28, 8) DEFAULT '0' NOT NULL,
	"votes_abstain" numeric(28, 8) DEFAULT '0' NOT NULL,
	"total_voters" integer DEFAULT 0 NOT NULL,
	"quorum_required" numeric(28, 8) NOT NULL,
	"quorum_met" boolean DEFAULT false,
	"daml_contract_id" varchar(256),
	"daml_timelock_id" varchar(256),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_proposals_proposal_number_unique" UNIQUE("proposal_number")
);
--> statement-breakpoint
CREATE TABLE "governance_token_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"proposal_id" varchar(32) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"user_address" varchar(256) NOT NULL,
	"balance" numeric(28, 8) NOT NULL,
	"delegated_to" varchar(256),
	"received_delegation" numeric(28, 8) DEFAULT '0',
	"effective_voting_power" numeric(28, 8) NOT NULL,
	"snapshot_block" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "governance_votes" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"proposal_id" varchar(32) NOT NULL,
	"voter_id" varchar(256) NOT NULL,
	"voter_address" varchar(256) NOT NULL,
	"direction" varchar(16) NOT NULL,
	"weight" numeric(28, 8) NOT NULL,
	"is_delegated" boolean DEFAULT false,
	"delegated_from" varchar(256),
	"daml_contract_id" varchar(256),
	"cast_at" timestamp with time zone DEFAULT now() NOT NULL,
	"previous_direction" varchar(16),
	"changed_at" timestamp with time zone
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
CREATE TABLE "kyc_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"verification_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"provider" varchar(32) DEFAULT 'sumsub' NOT NULL,
	"external_applicant_id" varchar(256),
	"status" varchar(32) DEFAULT 'not_started' NOT NULL,
	"review_answer" varchar(16),
	"rejection_reason" text,
	"rejection_labels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"document_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"check_results" jsonb,
	"raw_response" jsonb,
	"attempt_count" integer DEFAULT 1 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kyc_verifications_verification_id_unique" UNIQUE("verification_id")
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
	"channel_in_app" boolean DEFAULT true NOT NULL,
	"channel_webhook" boolean DEFAULT false NOT NULL,
	"hf_caution_threshold" real DEFAULT 1.5 NOT NULL,
	"hf_danger_threshold" real DEFAULT 1.2 NOT NULL,
	"hf_critical_threshold" real DEFAULT 1.05 NOT NULL,
	"financial_enabled" boolean DEFAULT true NOT NULL,
	"interest_milestones" boolean DEFAULT true NOT NULL,
	"rate_changes" boolean DEFAULT true NOT NULL,
	"auth_enabled" boolean DEFAULT true NOT NULL,
	"new_login_alerts" boolean DEFAULT true NOT NULL,
	"governance_enabled" boolean DEFAULT false NOT NULL,
	"digest_enabled" boolean DEFAULT false NOT NULL,
	"digest_frequency" varchar(16) DEFAULT 'daily' NOT NULL,
	"digest_time" varchar(8) DEFAULT '09:00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_party_id_unique" UNIQUE("party_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"type" varchar(64) NOT NULL,
	"category" varchar(32) NOT NULL,
	"severity" varchar(16) NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"channels" jsonb DEFAULT '["in_app"]'::jsonb NOT NULL,
	"link" text,
	"read_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oracle_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" varchar(64) NOT NULL,
	"asset" varchar(64),
	"message" text NOT NULL,
	"severity" varchar(16) NOT NULL,
	"metadata" jsonb,
	"resolved_at" timestamp with time zone,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "party_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"mapping_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"wallet_connection_id" varchar(256),
	"custody_mode" varchar(32) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "party_mappings_mapping_id_unique" UNIQUE("mapping_id")
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
CREATE TABLE "pool_parameter_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" varchar(128) NOT NULL,
	"parameter_name" varchar(128) NOT NULL,
	"old_value" varchar(256),
	"new_value" varchar(256),
	"changed_by" integer NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text
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
CREATE TABLE "price_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset" varchar(64) NOT NULL,
	"median_price" numeric(28, 8) NOT NULL,
	"sources" jsonb NOT NULL,
	"confidence" real NOT NULL,
	"twap_data" jsonb,
	"circuit_breaker_active" boolean DEFAULT false NOT NULL,
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
CREATE TABLE "protocol_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"protocol_fee_rate" numeric(10, 6) DEFAULT '0.001' NOT NULL,
	"liquidation_incentive_rate" numeric(10, 6) DEFAULT '0.05' NOT NULL,
	"flash_loan_fee_rate" numeric(10, 6) DEFAULT '0.0009' NOT NULL,
	"min_borrow_amount" numeric(28, 8) DEFAULT '100' NOT NULL,
	"max_borrow_amount" numeric(28, 8) DEFAULT '10000000' NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"paused_at" timestamp with time zone,
	"paused_by" integer,
	"pause_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "protocol_health_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"health_score" integer NOT NULL,
	"bad_debt_ratio" numeric(10, 6) NOT NULL,
	"reserve_coverage" numeric(10, 6) NOT NULL,
	"avg_health_factor" numeric(10, 4),
	"hf_danger_count" integer DEFAULT 0 NOT NULL,
	"hf_danger_volume_usd" numeric(30, 6) DEFAULT '0' NOT NULL,
	"liquidation_efficiency" numeric(10, 6),
	"oracle_uptime" numeric(10, 6),
	"concentration_risk" numeric(10, 6),
	"details" jsonb,
	"snapshot_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "revenue_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"pool_id" varchar(128),
	"revenue_type" varchar(30) NOT NULL,
	"amount" numeric(30, 6) NOT NULL,
	"amount_usd" numeric(30, 6) NOT NULL,
	"asset" varchar(20) NOT NULL,
	"tx_hash" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"kyc_score" real NOT NULL,
	"aml_score" real NOT NULL,
	"pep_score" real NOT NULL,
	"geo_score" real NOT NULL,
	"behavioral_score" real NOT NULL,
	"composite_score" real NOT NULL,
	"risk_level" varchar(32) NOT NULL,
	"factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"decision" varchar(32) NOT NULL,
	"decision_reason" text NOT NULL,
	"triggered_by" varchar(64) NOT NULL,
	"previous_risk_level" varchar(32),
	"reviewed_by" integer,
	"review_note" text,
	"valid_until" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "risk_assessments_assessment_id_unique" UNIQUE("assessment_id")
);
--> statement-breakpoint
CREATE TABLE "sanctions_list_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" varchar(256) NOT NULL,
	"list_source" varchar(64) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"full_name" varchar(512) NOT NULL,
	"normalized_name" varchar(512) NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"nationality" varchar(8),
	"date_of_birth" varchar(32),
	"identifiers" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sanctions_list_entries_entry_id_unique" UNIQUE("entry_id")
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
CREATE TABLE "transaction_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_log_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"wallet_connection_id" varchar(256),
	"tx_hash" varchar(512),
	"template_id" varchar(256),
	"choice_name" varchar(128),
	"routing_mode" varchar(32) NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"amount_usd" numeric(28, 8),
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	CONSTRAINT "transaction_logs_transaction_log_id_unique" UNIQUE("transaction_log_id")
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
	"aml_status" varchar(32) DEFAULT 'not_screened',
	"compliance_risk_level" varchar(32),
	"last_risk_assessment_at" timestamp with time zone,
	"sumsub_applicant_id" varchar(256),
	"next_screening_at" timestamp with time zone,
	"is_admin_active" boolean DEFAULT false NOT NULL,
	"admin_activated_at" timestamp with time zone,
	"admin_activated_by" integer,
	"suspended_at" timestamp with time zone,
	"suspended_by" integer,
	"suspended_reason" text,
	"is_blacklisted" boolean DEFAULT false NOT NULL,
	"blacklisted_at" timestamp with time zone,
	"blacklisted_reason" text,
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
CREATE TABLE "wallet_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_id" varchar(256) NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"wallet_address" varchar(256) NOT NULL,
	"wallet_type" varchar(32) NOT NULL,
	"custody_mode" varchar(32) DEFAULT 'self-custody' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"label" varchar(128),
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"disconnected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_connections_connection_id_unique" UNIQUE("connection_id")
);
--> statement-breakpoint
CREATE TABLE "wallet_nonces" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" varchar(256) NOT NULL,
	"nonce" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"default_wallet_connection_id" varchar(256),
	"signing_threshold" numeric(38, 18) DEFAULT '1000' NOT NULL,
	"routing_mode" varchar(32) DEFAULT 'auto' NOT NULL,
	"auto_disconnect_minutes" integer DEFAULT 30 NOT NULL,
	"show_transaction_confirm" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wallet_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_delivery_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"webhook_endpoint_id" varchar(64) NOT NULL,
	"notification_id" varchar(64) NOT NULL,
	"http_status" integer,
	"response_body" text,
	"attempt" integer DEFAULT 1 NOT NULL,
	"success" boolean NOT NULL,
	"error" text,
	"delivered_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"party_id" varchar(256) NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(256) NOT NULL,
	"events" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_delivery_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aml_screenings" ADD CONSTRAINT "aml_screenings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_user_position_snapshots" ADD CONSTRAINT "analytics_user_position_snapshots_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compliance_documents" ADD CONSTRAINT "compliance_documents_institution_id_institutions_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("institution_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custodial_parties" ADD CONSTRAINT "custodial_parties_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_log" ADD CONSTRAINT "email_delivery_log_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_delegations" ADD CONSTRAINT "governance_delegations_delegator_id_users_user_id_fk" FOREIGN KEY ("delegator_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_delegations" ADD CONSTRAINT "governance_delegations_delegatee_id_users_user_id_fk" FOREIGN KEY ("delegatee_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_execution_queue" ADD CONSTRAINT "governance_execution_queue_proposal_id_governance_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."governance_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_proposals" ADD CONSTRAINT "governance_proposals_proposer_id_users_user_id_fk" FOREIGN KEY ("proposer_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_token_snapshots" ADD CONSTRAINT "governance_token_snapshots_proposal_id_governance_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."governance_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_token_snapshots" ADD CONSTRAINT "governance_token_snapshots_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD CONSTRAINT "governance_votes_proposal_id_governance_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."governance_proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "governance_votes" ADD CONSTRAINT "governance_votes_voter_id_users_user_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutional_api_keys" ADD CONSTRAINT "institutional_api_keys_institution_party_verified_institutions_institution_party_fk" FOREIGN KEY ("institution_party") REFERENCES "public"."verified_institutions"("institution_party") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iot_readings" ADD CONSTRAINT "iot_readings_project_id_productive_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."productive_projects"("project_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_verifications" ADD CONSTRAINT "kyc_verifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "party_mappings" ADD CONSTRAINT "party_mappings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productive_borrows" ADD CONSTRAINT "productive_borrows_project_id_productive_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."productive_projects"("project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productive_cashflows" ADD CONSTRAINT "productive_cashflows_borrow_id_productive_borrows_borrow_id_fk" FOREIGN KEY ("borrow_id") REFERENCES "public"."productive_borrows"("borrow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retail_profiles" ADD CONSTRAINT "retail_profiles_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_logs" ADD CONSTRAINT "transaction_logs_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_connections" ADD CONSTRAINT "wallet_connections_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_preferences" ADD CONSTRAINT "wallet_preferences_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery_log" ADD CONSTRAINT "webhook_delivery_log_webhook_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("webhook_endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_delivery_log" ADD CONSTRAINT "webhook_delivery_log_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_aml_screenings_user_type" ON "aml_screenings" USING btree ("user_id","screening_type","screened_at");--> statement-breakpoint
CREATE INDEX "idx_aml_screenings_wallet" ON "aml_screenings" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "idx_aml_screenings_status" ON "aml_screenings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_aml_screenings_next" ON "aml_screenings" USING btree ("next_screening_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_type" ON "analytics_events" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_user" ON "analytics_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_pool" ON "analytics_events" USING btree ("pool_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_pool_snapshots_pool_time" ON "analytics_pool_snapshots" USING btree ("pool_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_pool_snapshots_pool_time" ON "analytics_pool_snapshots" USING btree ("pool_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_pool_snapshots_time" ON "analytics_pool_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_protocol_snapshots_time" ON "analytics_protocol_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_analytics_user_snapshots_user_time" ON "analytics_user_position_snapshots" USING btree ("user_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_user_snapshots_user_time" ON "analytics_user_position_snapshots" USING btree ("user_id","snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_compliance_audit_user" ON "compliance_audit_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_compliance_audit_action" ON "compliance_audit_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "idx_compliance_audit_category" ON "compliance_audit_log" USING btree ("category","created_at");--> statement-breakpoint
CREATE INDEX "idx_deletion_requests_user" ON "data_deletion_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_deletion_requests_status" ON "data_deletion_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_party" ON "email_delivery_log" USING btree ("party_id","sent_at");--> statement-breakpoint
CREATE INDEX "idx_email_delivery_notification" ON "email_delivery_log" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "gov_delegations_delegator_idx" ON "governance_delegations" USING btree ("delegator_id");--> statement-breakpoint
CREATE INDEX "gov_delegations_delegatee_idx" ON "governance_delegations" USING btree ("delegatee_id");--> statement-breakpoint
CREATE INDEX "gov_delegations_active_idx" ON "governance_delegations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "gov_exec_queue_status_idx" ON "governance_execution_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gov_exec_queue_timelock_idx" ON "governance_execution_queue" USING btree ("timelock_ends_at");--> statement-breakpoint
CREATE INDEX "gov_proposals_status_idx" ON "governance_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gov_proposals_type_idx" ON "governance_proposals" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gov_proposals_proposer_idx" ON "governance_proposals" USING btree ("proposer_id");--> statement-breakpoint
CREATE INDEX "gov_proposals_voting_ends_idx" ON "governance_proposals" USING btree ("voting_ends_at");--> statement-breakpoint
CREATE INDEX "gov_snapshots_proposal_idx" ON "governance_token_snapshots" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "gov_votes_proposal_idx" ON "governance_votes" USING btree ("proposal_id");--> statement-breakpoint
CREATE INDEX "gov_votes_voter_idx" ON "governance_votes" USING btree ("voter_id");--> statement-breakpoint
CREATE INDEX "idx_kyc_verifications_user" ON "kyc_verifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_kyc_verifications_status" ON "kyc_verifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_kyc_verifications_external" ON "kyc_verifications" USING btree ("external_applicant_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_party_created" ON "notifications" USING btree ("party_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_party_status" ON "notifications" USING btree ("party_id","status");--> statement-breakpoint
CREATE INDEX "idx_notifications_type_created" ON "notifications" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "idx_health_snapshots_time" ON "protocol_health_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_revenue_log_type" ON "revenue_log" USING btree ("revenue_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_revenue_log_pool" ON "revenue_log" USING btree ("pool_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_risk_assessments_user" ON "risk_assessments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_risk_assessments_level" ON "risk_assessments" USING btree ("risk_level");--> statement-breakpoint
CREATE INDEX "idx_risk_assessments_valid" ON "risk_assessments" USING btree ("valid_until");--> statement-breakpoint
CREATE INDEX "idx_sanctions_normalized_name" ON "sanctions_list_entries" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "idx_sanctions_list_source" ON "sanctions_list_entries" USING btree ("list_source");--> statement-breakpoint
CREATE INDEX "idx_sanctions_active" ON "sanctions_list_entries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_endpoint" ON "webhook_delivery_log" USING btree ("webhook_endpoint_id","delivered_at");--> statement-breakpoint
CREATE INDEX "idx_webhook_delivery_notification" ON "webhook_delivery_log" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "idx_webhook_endpoints_party" ON "webhook_endpoints" USING btree ("party_id");