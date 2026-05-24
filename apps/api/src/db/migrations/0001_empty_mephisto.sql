CREATE TABLE "session_unlock_keys" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"client_key" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session_unlock_keys" ADD CONSTRAINT "session_unlock_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_unlock_keys" ADD CONSTRAINT "session_unlock_keys_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_unlock_keys_user_id_idx" ON "session_unlock_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_unlock_keys_session_id_idx" ON "session_unlock_keys" USING btree ("session_id");