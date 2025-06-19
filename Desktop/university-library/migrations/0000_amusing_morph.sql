CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" text NOT NULL,
	"record_id" bigint NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"timestamp" timestamp with time zone DEFAULT now(),
	"ip_address" "inet",
	"user_agent" text,
	CONSTRAINT "audit_log_id_unique" UNIQUE("id"),
	CONSTRAINT "chk_audit_action" CHECK ("audit_log"."action" IN ('INSERT', 'UPDATE', 'DELETE')),
	CONSTRAINT "chk_audit_action_values" CHECK (
    ("audit_log"."action" = 'INSERT' AND "audit_log"."old_values" IS NULL AND "audit_log"."new_values" IS NOT NULL) OR
    ("audit_log"."action" = 'UPDATE' AND "audit_log"."old_values" IS NOT NULL AND "audit_log"."new_values" IS NOT NULL) OR
    ("audit_log"."action" = 'DELETE' AND "audit_log"."old_values" IS NOT NULL AND "audit_log"."new_values" IS NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"birth_date" date,
	"death_date" date,
	"nationality" text,
	"biography" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "authors_id_unique" UNIQUE("id"),
	CONSTRAINT "chk_authors_dates" CHECK ("authors"."death_date" IS NULL OR "authors"."death_date" >= "authors"."birth_date"),
	CONSTRAINT "chk_authors_birth_date" CHECK ("authors"."birth_date" IS NULL OR "authors"."birth_date" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "book_authors" (
	"book_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"author_order" integer DEFAULT 1,
	CONSTRAINT "book_authors_book_id_author_id_pk" PRIMARY KEY("book_id","author_id"),
	CONSTRAINT "chk_book_authors_order" CHECK ("book_authors"."author_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "book_copies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"copy_number" text NOT NULL,
	"barcode" text,
	"status" text DEFAULT 'available' NOT NULL,
	"condition_rating" text DEFAULT 'good' NOT NULL,
	"acquired_date" date DEFAULT CURRENT_DATE,
	"last_maintenance" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "book_copies_id_unique" UNIQUE("id"),
	CONSTRAINT "book_copies_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "unique_book_copy_number" UNIQUE("book_id","copy_number"),
	CONSTRAINT "chk_book_copies_status" CHECK ("book_copies"."status" IN ('available', 'borrowed', 'reserved', 'maintenance', 'lost', 'damaged', 'withdrawn')),
	CONSTRAINT "chk_book_copies_condition" CHECK ("book_copies"."condition_rating" IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
	CONSTRAINT "chk_book_copies_acquired_date" CHECK ("book_copies"."acquired_date" <= CURRENT_DATE),
	CONSTRAINT "chk_book_copies_maintenance_date" CHECK ("book_copies"."last_maintenance" IS NULL OR "book_copies"."last_maintenance" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "book_subjects" (
	"book_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	CONSTRAINT "book_subjects_book_id_subject_id_pk" PRIMARY KEY("book_id","subject_id")
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"isbn_13" text,
	"isbn_10" text,
	"publisher_id" uuid NOT NULL,
	"publication_year" integer NOT NULL,
	"edition" text,
	"pages" integer,
	"language" text DEFAULT 'English' NOT NULL,
	"description" text,
	"shelf_location" text NOT NULL,
	"acquisition_date" date DEFAULT CURRENT_DATE,
	"acquisition_price" numeric(10, 2),
	"total_copies" integer DEFAULT 1 NOT NULL,
	"available_copies" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	"cover_url" text,
	"video_url" text,
	"cover_color" varchar(7) NOT NULL,
	CONSTRAINT "books_id_unique" UNIQUE("id"),
	CONSTRAINT "books_isbn_13_unique" UNIQUE("isbn_13"),
	CONSTRAINT "books_isbn_10_unique" UNIQUE("isbn_10"),
	CONSTRAINT "chk_books_year" CHECK ("books"."publication_year" BETWEEN 1400 AND EXTRACT(YEAR FROM NOW()) + 1),
	CONSTRAINT "chk_books_pages" CHECK ("books"."pages" IS NULL OR "books"."pages" > 0),
	CONSTRAINT "chk_books_copies" CHECK ("books"."total_copies" >= 0 AND "books"."available_copies" >= 0 AND "books"."available_copies" <= "books"."total_copies"),
	CONSTRAINT "chk_books_isbn13" CHECK ("books"."isbn_13" IS NULL OR (LENGTH("books"."isbn_13") = 13 AND "books"."isbn_13" ~ '^[0-9]{13}$')),
	CONSTRAINT "chk_books_isbn10" CHECK ("books"."isbn_10" IS NULL OR (LENGTH("books"."isbn_10") = 10 AND "books"."isbn_10" ~ '^[0-9]{9}[0-9X]$')),
	CONSTRAINT "chk_books_price" CHECK ("books"."acquisition_price" IS NULL OR "books"."acquisition_price" >= 0),
	CONSTRAINT "chk_books_acquisition_date" CHECK ("books"."acquisition_date" <= CURRENT_DATE)
);
--> statement-breakpoint
CREATE TABLE "borrow_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"book_copy_id" uuid NOT NULL,
	"librarian_id" uuid,
	"request_date" timestamp with time zone DEFAULT now(),
	"approved_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"return_date" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"renewal_count" integer DEFAULT 0,
	"max_renewals" integer DEFAULT 2,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_activity_date" date DEFAULT now(),
	CONSTRAINT "borrow_requests_id_unique" UNIQUE("id"),
	CONSTRAINT "chk_borrow_status" CHECK ("borrow_requests"."status" IN ('pending', 'approved', 'rejected', 'returned', 'overdue', 'lost')),
	CONSTRAINT "chk_borrow_dates" CHECK (
    ("borrow_requests"."approved_date" IS NULL OR "borrow_requests"."approved_date" >= "borrow_requests"."request_date") AND
    ("borrow_requests"."due_date" IS NULL OR "borrow_requests"."due_date" > "borrow_requests"."approved_date") AND
    ("borrow_requests"."return_date" IS NULL OR "borrow_requests"."return_date" >= "borrow_requests"."approved_date")
  ),
	CONSTRAINT "chk_renewal_count" CHECK ("borrow_requests"."renewal_count" >= 0 AND "borrow_requests"."renewal_count" <= "borrow_requests"."max_renewals"),
	CONSTRAINT "chk_borrow_rejection" CHECK (
    ("borrow_requests"."status" = 'rejected' AND "borrow_requests"."rejection_reason" IS NOT NULL) OR
    "borrow_requests"."status" != 'rejected'
  ),
	CONSTRAINT "chk_borrow_approval" CHECK (
    ("borrow_requests"."status" IN ('approved', 'returned', 'overdue', 'lost') AND "borrow_requests"."approved_date" IS NOT NULL AND "borrow_requests"."due_date" IS NOT NULL) OR
    "borrow_requests"."status" IN ('pending', 'rejected')
  )
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "departments_id_unique" UNIQUE("id"),
	CONSTRAINT "departments_name_unique" UNIQUE("name"),
	CONSTRAINT "departments_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "fines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"borrow_request_id" uuid,
	"waived_by" uuid,
	"fine_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"days_overdue" integer,
	"description" text,
	"fine_date" timestamp with time zone DEFAULT now(),
	"due_date" timestamp with time zone,
	"paid_date" timestamp with time zone,
	"payment_method" text,
	"waived_reason" text,
	"status" text DEFAULT 'unpaid' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "fines_id_unique" UNIQUE("id"),
	CONSTRAINT "chk_fine_type" CHECK ("fines"."fine_type" IN ('overdue', 'lost_book', 'damaged_book', 'processing_fee', 'other')),
	CONSTRAINT "chk_fine_status" CHECK ("fines"."status" IN ('unpaid', 'paid', 'waived', 'disputed')),
	CONSTRAINT "chk_payment_method" CHECK ("fines"."payment_method" IN ('cash', 'card', 'online', 'waived')),
	CONSTRAINT "chk_fine_amount" CHECK ("fines"."amount" >= 0),
	CONSTRAINT "chk_fine_days" CHECK ("fines"."days_overdue" IS NULL OR "fines"."days_overdue" >= 0),
	CONSTRAINT "chk_fine_payment" CHECK (
    ("fines"."status" = 'paid' AND "fines"."paid_date" IS NOT NULL) OR 
    ("fines"."status" = 'waived' AND "fines"."waived_by" IS NOT NULL AND "fines"."waived_reason" IS NOT NULL) OR 
    "fines"."status" IN ('unpaid', 'disputed')
  ),
	CONSTRAINT "chk_fine_due_date" CHECK ("fines"."due_date" IS NULL OR "fines"."due_date" >= "fines"."fine_date")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"email_sent" boolean DEFAULT false,
	"sms_sent" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"read_at" timestamp with time zone,
	CONSTRAINT "notifications_id_unique" UNIQUE("id"),
	CONSTRAINT "chk_notification_type" CHECK ("notifications"."type" IN ('due_reminder', 'overdue_notice', 'reservation_ready', 'fine_notice', 'account_status', 'general')),
	CONSTRAINT "chk_notification_read" CHECK (
    ("notifications"."is_read" = FALSE AND "notifications"."read_at" IS NULL) OR 
    ("notifications"."is_read" = TRUE AND "notifications"."read_at" IS NOT NULL)
  )
);
--> statement-breakpoint
CREATE TABLE "publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"country" text,
	"website" text,
	"established_year" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "publishers_id_unique" UNIQUE("id"),
	CONSTRAINT "publishers_name_unique" UNIQUE("name"),
	CONSTRAINT "chk_publishers_year" CHECK ("publishers"."established_year" IS NULL OR "publishers"."established_year" BETWEEN 1400 AND EXTRACT(YEAR FROM NOW())),
	CONSTRAINT "chk_publishers_website" CHECK ("publishers"."website" IS NULL OR "publishers"."website" ~* '^https?://.+')
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"book_id" uuid NOT NULL,
	"reservation_date" timestamp with time zone DEFAULT now(),
	"expiry_date" timestamp with time zone,
	"queue_position" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reservations_id_unique" UNIQUE("id"),
	CONSTRAINT "unique_user_book_reservation" UNIQUE("user_id","book_id"),
	CONSTRAINT "chk_reservation_status" CHECK ("reservations"."status" IN ('active', 'fulfilled', 'expired', 'cancelled')),
	CONSTRAINT "chk_reservation_dates" CHECK ("reservations"."expiry_date" IS NULL OR "reservations"."expiry_date" > "reservations"."reservation_date"),
	CONSTRAINT "chk_queue_position" CHECK ("reservations"."queue_position" > 0)
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_subject_id" uuid,
	"dewey_decimal" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subjects_id_unique" UNIQUE("id"),
	CONSTRAINT "subjects_name_unique" UNIQUE("name"),
	CONSTRAINT "chk_subjects_dewey" CHECK ("subjects"."dewey_decimal" IS NULL OR "subjects"."dewey_decimal" ~ '^[0-9]{3}(\.[0-9]+)?$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" text,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"password" text NOT NULL,
	"role" text NOT NULL,
	"department_id" uuid,
	"account_status" text DEFAULT 'active' NOT NULL,
	"max_books_allowed" integer DEFAULT 5 NOT NULL,
	"max_days_allowed" integer DEFAULT 14 NOT NULL,
	"enrollment_date" date,
	"graduation_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "users_id_unique" UNIQUE("id"),
	CONSTRAINT "users_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "chk_users_role" CHECK ("users"."role" IN ('admin', 'librarian', 'faculty', 'student')),
	CONSTRAINT "chk_users_account_status" CHECK ("users"."account_status" IN ('active', 'inactive', 'suspended', 'graduated')),
	CONSTRAINT "chk_users_email_format" CHECK ("users"."email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+.[A-Za-z]{2,}$'),
	CONSTRAINT "chk_users_phone_format" CHECK ("users"."phone" IS NULL OR "users"."phone" ~* '^+?[0-9s-()]{10,}$'),
	CONSTRAINT "chk_users_student_id" CHECK ("users"."student_id" IS NULL OR LENGTH("users"."student_id") >= 5),
	CONSTRAINT "chk_users_graduation_date" CHECK ("users"."graduation_date" IS NULL OR "users"."graduation_date" >= "users"."enrollment_date"),
	CONSTRAINT "chk_users_max_books" CHECK ("users"."max_books_allowed" > 0 AND "users"."max_books_allowed" <= 50),
	CONSTRAINT "chk_users_max_days" CHECK ("users"."max_days_allowed" > 0 AND "users"."max_days_allowed" <= 365)
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_authors" ADD CONSTRAINT "book_authors_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_copies" ADD CONSTRAINT "book_copies_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_subjects" ADD CONSTRAINT "book_subjects_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_subjects" ADD CONSTRAINT "book_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_book_copy_id_book_copies_id_fk" FOREIGN KEY ("book_copy_id") REFERENCES "public"."book_copies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "borrow_requests" ADD CONSTRAINT "borrow_requests_librarian_id_users_id_fk" FOREIGN KEY ("librarian_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_borrow_request_id_borrow_requests_id_fk" FOREIGN KEY ("borrow_request_id") REFERENCES "public"."borrow_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fines" ADD CONSTRAINT "fines_waived_by_users_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_parent_subject_id_subjects_id_fk" FOREIGN KEY ("parent_subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_log_table_record" ON "audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user" ON "audit_log" USING btree ("user_id") WHERE "audit_log"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_log_timestamp" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_authors_name" ON "authors" USING gin (to_tsvector('english', "full_name"));--> statement-breakpoint
CREATE INDEX "idx_book_authors_book" ON "book_authors" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_book_authors_author" ON "book_authors" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_book_copies_book" ON "book_copies" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_book_copies_status" ON "book_copies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_book_copies_barcode" ON "book_copies" USING btree ("barcode") WHERE "book_copies"."barcode" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_book_copies_available" ON "book_copies" USING btree ("book_id") WHERE "book_copies"."status" = 'available' AND "book_copies"."is_deleted" = FALSE;--> statement-breakpoint
CREATE INDEX "idx_book_subjects_book" ON "book_subjects" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_book_subjects_subject" ON "book_subjects" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_books_title" ON "books" USING gin (to_tsvector('english', "title"));--> statement-breakpoint
CREATE INDEX "idx_books_author_title" ON "books" USING gin (to_tsvector('english', "title" || ' ' || COALESCE("subtitle", '')));--> statement-breakpoint
CREATE INDEX "idx_books_isbn13" ON "books" USING btree ("isbn_13") WHERE "books"."isbn_13" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_books_isbn10" ON "books" USING btree ("isbn_10") WHERE "books"."isbn_10" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_books_publisher" ON "books" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "idx_books_year" ON "books" USING btree ("publication_year");--> statement-breakpoint
CREATE INDEX "idx_books_available" ON "books" USING btree ("id") WHERE "books"."available_copies" > 0 AND "books"."is_deleted" = FALSE;--> statement-breakpoint
CREATE INDEX "idx_books_shelf" ON "books" USING btree ("shelf_location");--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_user" ON "borrow_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_copy" ON "borrow_requests" USING btree ("book_copy_id");--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_status" ON "borrow_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_due_date" ON "borrow_requests" USING btree ("due_date") WHERE "borrow_requests"."due_date" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_overdue" ON "borrow_requests" USING btree ("id") WHERE "borrow_requests"."status" = 'overdue';--> statement-breakpoint
CREATE INDEX "idx_borrow_requests_active" ON "borrow_requests" USING btree ("user_id","status") WHERE "borrow_requests"."status" IN ('approved', 'overdue');--> statement-breakpoint
CREATE INDEX "idx_fines_user" ON "fines" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_fines_status" ON "fines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fines_user_status" ON "fines" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_fines_due_date" ON "fines" USING btree ("due_date") WHERE "fines"."due_date" IS NOT NULL AND "fines"."status" = 'unpaid';--> statement-breakpoint
CREATE INDEX "idx_fines_borrow_request" ON "fines" USING btree ("borrow_request_id") WHERE "fines"."borrow_request_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_type" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("user_id") WHERE "notifications"."is_read" = FALSE;--> statement-breakpoint
CREATE INDEX "idx_publishers_name" ON "publishers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_reservations_user" ON "reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_book" ON "reservations" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_user_book" ON "reservations" USING btree ("user_id","book_id");--> statement-breakpoint
CREATE INDEX "idx_reservations_status" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservations_queue" ON "reservations" USING btree ("book_id","queue_position") WHERE "reservations"."status" = 'active';--> statement-breakpoint
CREATE INDEX "idx_subjects_name" ON "subjects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_subjects_parent" ON "subjects" USING btree ("parent_subject_id") WHERE "subjects"."parent_subject_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_subjects_dewey" ON "subjects" USING btree ("dewey_decimal") WHERE "subjects"."dewey_decimal" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_student_id" ON "users" USING btree ("student_id") WHERE "users"."student_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_role_status" ON "users" USING btree ("role","account_status");--> statement-breakpoint
CREATE INDEX "idx_users_department" ON "users" USING btree ("department_id") WHERE "users"."department_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_active" ON "users" USING btree ("id") WHERE "users"."account_status" = 'active' AND "users"."is_deleted" = FALSE;