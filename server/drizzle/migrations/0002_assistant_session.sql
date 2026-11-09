ALTER TABLE "assistant_messages" ADD COLUMN "session_id" uuid;--> statement-breakpoint
CREATE INDEX "assistant_messages_user_session_idx" ON "assistant_messages" USING btree ("user_id","session_id");