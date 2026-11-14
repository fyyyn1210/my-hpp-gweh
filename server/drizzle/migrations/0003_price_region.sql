DROP INDEX "commodity_prices_commodity_source_date_idx";--> statement-breakpoint
ALTER TABLE "commodity_prices" ADD COLUMN "region" text DEFAULT 'national' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_prices_commodity_source_region_date_idx" ON "commodity_prices" USING btree ("commodity_id","source","region","price_date");