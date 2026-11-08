CREATE TABLE "alert_reads" (
	"user_id" uuid NOT NULL,
	"alert_id" text NOT NULL,
	"read_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alert_reads_user_id_alert_id_pk" PRIMARY KEY("user_id","alert_id")
);
--> statement-breakpoint
CREATE TABLE "commodities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"price_unit" text NOT NULL,
	"aliases" text[] NOT NULL,
	"unit_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commodity_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"commodity_id" text NOT NULL,
	"source" text NOT NULL,
	"price" integer NOT NULL,
	"price_date" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"share_community" boolean DEFAULT true NOT NULL,
	"rounding_step" integer DEFAULT 500 NOT NULL,
	"notify_in_app" boolean DEFAULT true NOT NULL,
	"notify_telegram" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "menu_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"qty" double precision NOT NULL,
	"unit" text NOT NULL,
	"commodity_id" text,
	"manual_price_per_kg" integer
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"sell_price" integer NOT NULL,
	"price_set_at" timestamp (3) with time zone NOT NULL,
	"target_margin" double precision NOT NULL,
	"threshold" double precision NOT NULL,
	"extra_cost" integer NOT NULL,
	"custom" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"commodity_id" text NOT NULL,
	"price_per_kg" integer NOT NULL,
	"shared" boolean NOT NULL,
	"recorded_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alert_reads" ADD CONSTRAINT "alert_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commodity_prices" ADD CONSTRAINT "commodity_prices_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_ingredients" ADD CONSTRAINT "menu_ingredients_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menus"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_ingredients" ADD CONSTRAINT "menu_ingredients_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_prices_commodity_source_date_idx" ON "commodity_prices" USING btree ("commodity_id","source","price_date");--> statement-breakpoint
CREATE INDEX "menu_ingredients_menu_idx" ON "menu_ingredients" USING btree ("menu_id");--> statement-breakpoint
CREATE INDEX "menus_user_idx" ON "menus" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notas_user_idx" ON "notas" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notas_commodity_recorded_idx" ON "notas" USING btree ("commodity_id","recorded_at");