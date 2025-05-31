import {
  pgTable,
  uuid,
  bigint,
  text,
  timestamp,
  boolean,
  date,
  integer,
  numeric,
  inet,
  jsonb,
  primaryKey,
  unique,
  check,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// =============================================
// 1. DEPARTMENTS TABLE
// =============================================
export const departments = pgTable('departments', {
id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});



// =============================================
// 2. USERS TABLE
// =============================================
export const users = pgTable('users', {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  studentId: text('student_id').unique(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  address: text('address'),
    password: text('password').notNull(),
  role: text('role').notNull(),
    departmentId: uuid('department_id').references(() => departments.id),
  accountStatus: text('account_status').notNull().default('active'),
  maxBooksAllowed: integer('max_books_allowed').notNull().default(5),
  maxDaysAllowed: integer('max_days_allowed').notNull().default(14),
  enrollmentDate: date('enrollment_date'),
  graduationDate: date('graduation_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  roleCheck: check('chk_users_role', sql`${table.role} IN ('admin', 'librarian', 'faculty', 'student')`),
  accountStatusCheck: check('chk_users_account_status', sql`${table.accountStatus} IN ('active', 'inactive', 'suspended', 'graduated')`),
  emailFormatCheck: check('chk_users_email_format', sql`${table.email} ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  phoneFormatCheck: check('chk_users_phone_format', sql`${table.phone} IS NULL OR ${table.phone} ~* '^\+?[0-9\s\-\(\)]{10,}$'`),
  studentIdCheck: check('chk_users_student_id', sql`${table.studentId} IS NULL OR LENGTH(${table.studentId}) >= 5`),
  graduationDateCheck: check('chk_users_graduation_date', sql`${table.graduationDate} IS NULL OR ${table.graduationDate} >= ${table.enrollmentDate}`),
  maxBooksCheck: check('chk_users_max_books', sql`${table.maxBooksAllowed} > 0 AND ${table.maxBooksAllowed} <= 50`),
  maxDaysCheck: check('chk_users_max_days', sql`${table.maxDaysAllowed} > 0 AND ${table.maxDaysAllowed} <= 365`),
  
  // Indexes
  emailIdx: index('idx_users_email').on(table.email),
  studentIdIdx: index('idx_users_student_id').on(table.studentId).where(sql`${table.studentId} IS NOT NULL`),
  roleStatusIdx: index('idx_users_role_status').on(table.role, table.accountStatus),
  departmentIdx: index('idx_users_department').on(table.departmentId).where(sql`${table.departmentId} IS NOT NULL`),
  activeIdx: index('idx_users_active').on(table.id).where(sql`${table.accountStatus} = 'active' AND ${table.isDeleted} = FALSE`),
}));

// =============================================
// 3. AUTHORS TABLE
// =============================================
export const authors = pgTable('authors', {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: text('full_name').notNull(),
  birthDate: date('birth_date'),
  deathDate: date('death_date'),
  nationality: text('nationality'),
  biography: text('biography'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  datesCheck: check('chk_authors_dates', sql`${table.deathDate} IS NULL OR ${table.deathDate} >= ${table.birthDate}`),
  birthDateCheck: check('chk_authors_birth_date', sql`${table.birthDate} IS NULL OR ${table.birthDate} <= CURRENT_DATE`),
  
  // Indexes
  nameIdx: index('idx_authors_name').using('gin', sql`to_tsvector('english', ${table.fullName})`),
}));


// =============================================
// 4. PUBLISHERS TABLE
// =============================================
export const publishers = pgTable('publishers', {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  name: text('name').notNull().unique(),
  address: text('address'),
  city: text('city'),
  country: text('country'),
  website: text('website'),
  establishedYear: integer('established_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  yearCheck: check('chk_publishers_year', sql`${table.establishedYear} IS NULL OR ${table.establishedYear} BETWEEN 1400 AND EXTRACT(YEAR FROM NOW())`),
  websiteCheck: check('chk_publishers_website', sql`${table.website} IS NULL OR ${table.website} ~* '^https?://.+'`),
  
  // Indexes
  nameIdx: index('idx_publishers_name').on(table.name),
}));

// =============================================
// 5. SUBJECTS TABLE
// =============================================

export const subjects = pgTable('subjects', {
  id: uuid('id').primaryKey().defaultRandom().unique(),
  name: text('name').notNull().unique(),
  description: text('description'),
  parentSubjectId: uuid('parent_subject_id').references(() => subjects.id),
  deweyDecimal: text('dewey_decimal'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => {
  return {
    deweyCheck: check(
      'chk_subjects_dewey',
      sql`${table.deweyDecimal} IS NULL OR ${table.deweyDecimal} ~ '^[0-9]{3}(\\.[0-9]+)?$'`
    ),
    nameIdx: index('idx_subjects_name').on(table.name),
    parentIdx: index('idx_subjects_parent').on(table.parentSubjectId).where(sql`${table.parentSubjectId} IS NOT NULL`),
    deweyIdx: index('idx_subjects_dewey').on(table.deweyDecimal).where(sql`${table.deweyDecimal} IS NOT NULL`),
  };
});

// =============================================
// 6. BOOKS TABLE
// =============================================
export const books = pgTable('books', {
id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  isbn13: text('isbn_13').unique(),
  isbn10: text('isbn_10').unique(),
    publisherId: uuid('publisher_id').notNull().references(() => publishers.id),
  publicationYear: integer('publication_year').notNull(),
  edition: text('edition'),
  pages: integer('pages'),
  language: text('language').notNull().default('English'),
  description: text('description'),
  shelfLocation: text('shelf_location').notNull(),
  acquisitionDate: date('acquisition_date').default(sql`CURRENT_DATE`),
  acquisitionPrice: numeric('acquisition_price', { precision: 10, scale: 2 }),
  totalCopies: integer('total_copies').notNull().default(1),
  availableCopies: integer('available_copies').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  yearCheck: check('chk_books_year', sql`${table.publicationYear} BETWEEN 1400 AND EXTRACT(YEAR FROM NOW()) + 1`),
  pagesCheck: check('chk_books_pages', sql`${table.pages} IS NULL OR ${table.pages} > 0`),
  copiesCheck: check('chk_books_copies', sql`${table.totalCopies} >= 0 AND ${table.availableCopies} >= 0 AND ${table.availableCopies} <= ${table.totalCopies}`),
  isbn13Check: check('chk_books_isbn13', sql`${table.isbn13} IS NULL OR (LENGTH(${table.isbn13}) = 13 AND ${table.isbn13} ~ '^[0-9]{13}$')`),
  isbn10Check: check('chk_books_isbn10', sql`${table.isbn10} IS NULL OR (LENGTH(${table.isbn10}) = 10 AND ${table.isbn10} ~ '^[0-9]{9}[0-9X]$')`),
  priceCheck: check('chk_books_price', sql`${table.acquisitionPrice} IS NULL OR ${table.acquisitionPrice} >= 0`),
  acquisitionDateCheck: check('chk_books_acquisition_date', sql`${table.acquisitionDate} <= CURRENT_DATE`),
  
  // Indexes
  titleIdx: index('idx_books_title').using('gin', sql`to_tsvector('english', ${table.title})`),
  authorTitleIdx: index('idx_books_author_title').using('gin', sql`to_tsvector('english', ${table.title} || ' ' || COALESCE(${table.subtitle}, ''))`),
  isbn13Idx: index('idx_books_isbn13').on(table.isbn13).where(sql`${table.isbn13} IS NOT NULL`),
  isbn10Idx: index('idx_books_isbn10').on(table.isbn10).where(sql`${table.isbn10} IS NOT NULL`),
  publisherIdx: index('idx_books_publisher').on(table.publisherId),
  yearIdx: index('idx_books_year').on(table.publicationYear),
  availableIdx: index('idx_books_available').on(table.id).where(sql`${table.availableCopies} > 0 AND ${table.isDeleted} = FALSE`),
  shelfIdx: index('idx_books_shelf').on(table.shelfLocation),
}));

// =============================================
// 7. BOOK-AUTHORS RELATIONSHIP
// =============================================
export const bookAuthors = pgTable('book_authors', {
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull().references(() => authors.id, { onDelete: 'cascade' }),
  authorOrder: integer('author_order').default(1),
}, (table) => ({
  pk: primaryKey({ columns: [table.bookId, table.authorId] }),
  orderCheck: check('chk_book_authors_order', sql`${table.authorOrder} > 0`),
  
  // Indexes
  bookIdx: index('idx_book_authors_book').on(table.bookId),
  authorIdx: index('idx_book_authors_author').on(table.authorId),
}));

// =============================================
// 8. BOOK-SUBJECTS RELATIONSHIP
// =============================================
export const bookSubjects = pgTable('book_subjects', {
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),}, (table) => ({
  pk: primaryKey({ columns: [table.bookId, table.subjectId] }),
  
  // Indexes
  bookIdx: index('idx_book_subjects_book').on(table.bookId),
  subjectIdx: index('idx_book_subjects_subject').on(table.subjectId),
}));

// =============================================
// 9. BOOK COPIES TABLE
// =============================================
export const bookCopies = pgTable('book_copies', {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  copyNumber: text('copy_number').notNull(),
  barcode: text('barcode').unique(),
  status: text('status').notNull().default('available'),
  conditionRating: text('condition_rating').notNull().default('good'),
  acquiredDate: date('acquired_date').default(sql`CURRENT_DATE`),
  lastMaintenance: date('last_maintenance'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  uniqueBookCopy: unique('unique_book_copy_number').on(table.bookId, table.copyNumber),
  statusCheck: check('chk_book_copies_status', sql`${table.status} IN ('available', 'borrowed', 'reserved', 'maintenance', 'lost', 'damaged', 'withdrawn')`),
  conditionCheck: check('chk_book_copies_condition', sql`${table.conditionRating} IN ('excellent', 'good', 'fair', 'poor', 'damaged')`),
  acquiredDateCheck: check('chk_book_copies_acquired_date', sql`${table.acquiredDate} <= CURRENT_DATE`),
  maintenanceDateCheck: check('chk_book_copies_maintenance_date', sql`${table.lastMaintenance} IS NULL OR ${table.lastMaintenance} <= CURRENT_DATE`),
  
  // Indexes
  bookIdx: index('idx_book_copies_book').on(table.bookId),
  statusIdx: index('idx_book_copies_status').on(table.status),
  barcodeIdx: index('idx_book_copies_barcode').on(table.barcode).where(sql`${table.barcode} IS NOT NULL`),
  availableIdx: index('idx_book_copies_available').on(table.bookId).where(sql`${table.status} = 'available' AND ${table.isDeleted} = FALSE`),
}));

// =============================================
// 10. BORROW REQUESTS TABLE
// =============================================
export const borrowRequests = pgTable('borrow_requests', {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade', relationName: 'user' }),
  bookCopyId: uuid('book_copy_id').notNull().references(() => bookCopies.id, { onDelete: 'cascade', relationName: 'bookCopy' }),
  librarianId: uuid('librarian_id').references(() => users.id, { relationName: 'librarian' }),
  requestDate: timestamp('request_date', { withTimezone: true }).defaultNow(),
  approvedDate: timestamp('approved_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  returnDate: timestamp('return_date', { withTimezone: true }),
  status: text('status').notNull().default('pending'),
  rejectionReason: text('rejection_reason'),
  renewalCount: integer('renewal_count').default(0),
  maxRenewals: integer('max_renewals').default(2),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  statusCheck: check('chk_borrow_status', sql`${table.status} IN ('pending', 'approved', 'rejected', 'returned', 'overdue', 'lost')`),
  borrowDatesCheck: check('chk_borrow_dates', sql`
    (${table.approvedDate} IS NULL OR ${table.approvedDate} >= ${table.requestDate}) AND
    (${table.dueDate} IS NULL OR ${table.dueDate} > ${table.approvedDate}) AND
    (${table.returnDate} IS NULL OR ${table.returnDate} >= ${table.approvedDate})
  `),
  renewalCountCheck: check('chk_renewal_count', sql`${table.renewalCount} >= 0 AND ${table.renewalCount} <= ${table.maxRenewals}`),
  rejectionCheck: check('chk_borrow_rejection', sql`
    (${table.status} = 'rejected' AND ${table.rejectionReason} IS NOT NULL) OR
    ${table.status} != 'rejected'
  `),
  approvalCheck: check('chk_borrow_approval', sql`
    (${table.status} IN ('approved', 'returned', 'overdue', 'lost') AND ${table.approvedDate} IS NOT NULL AND ${table.dueDate} IS NOT NULL) OR
    ${table.status} IN ('pending', 'rejected')
  `),
  
  // Indexes
  userIdx: index('idx_borrow_requests_user').on(table.userId),
  copyIdx: index('idx_borrow_requests_copy').on(table.bookCopyId),
  statusIdx: index('idx_borrow_requests_status').on(table.status),
  dueDateIdx: index('idx_borrow_requests_due_date').on(table.dueDate).where(sql`${table.dueDate} IS NOT NULL`),
  overdueIdx: index('idx_borrow_requests_overdue').on(table.id).where(sql`${table.status} = 'overdue'`),
  activeIdx: index('idx_borrow_requests_active').on(table.userId, table.status).where(sql`${table.status} IN ('approved', 'overdue')`),
}));

// =============================================
// 11. RESERVATIONS TABLE
// =============================================
export const reservations = pgTable('reservations', {
id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid('user_id').references(() => users.id),        
  bookId: uuid('book_id').notNull().references(() => books.id, { onDelete: 'cascade' }),
  reservationDate: timestamp('reservation_date', { withTimezone: true }).defaultNow(),
  expiryDate: timestamp('expiry_date', { withTimezone: true }),
  queuePosition: integer('queue_position').notNull(),
  status: text('status').notNull().default('active'),
  notificationSent: boolean('notification_sent').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  uniqueUserBook: unique('unique_user_book_reservation').on(table.userId, table.bookId),
  statusCheck: check('chk_reservation_status', sql`${table.status} IN ('active', 'fulfilled', 'expired', 'cancelled')`),
  datesCheck: check('chk_reservation_dates', sql`${table.expiryDate} IS NULL OR ${table.expiryDate} > ${table.reservationDate}`),
  queuePositionCheck: check('chk_queue_position', sql`${table.queuePosition} > 0`),
  
  // Indexes
  userIdx: index('idx_reservations_user').on(table.userId),
  bookIdx: index('idx_reservations_book').on(table.bookId),
  userBookIdx: index('idx_reservations_user_book').on(table.userId, table.bookId),
  statusIdx: index('idx_reservations_status').on(table.status),
  queueIdx: index('idx_reservations_queue').on(table.bookId, table.queuePosition).where(sql`${table.status} = 'active'`),
}));

// =============================================
// 12. FINES TABLE
// =============================================
export const fines = pgTable('fines', {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid('user_id').references(() => users.id, { relationName: 'user' }),
  borrowRequestId: uuid('borrow_request_id').references(() => borrowRequests.id),
  waivedBy: uuid('waived_by').references(() => users.id, { relationName: 'waiver' }),
  fineType: text('fine_type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  daysOverdue: integer('days_overdue'),
  description: text('description'),
  fineDate: timestamp('fine_date', { withTimezone: true }).defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  paymentMethod: text('payment_method'),
   
  waivedReason: text('waived_reason'),
  status: text('status').notNull().default('unpaid'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  fineTypeCheck: check('chk_fine_type', sql`${table.fineType} IN ('overdue', 'lost_book', 'damaged_book', 'processing_fee', 'other')`),
  statusCheck: check('chk_fine_status', sql`${table.status} IN ('unpaid', 'paid', 'waived', 'disputed')`),
  paymentMethodCheck: check('chk_payment_method', sql`${table.paymentMethod} IN ('cash', 'card', 'online', 'waived')`),
  fineAmountCheck: check('chk_fine_amount', sql`${table.amount} >= 0`),
  fineDaysCheck: check('chk_fine_days', sql`${table.daysOverdue} IS NULL OR ${table.daysOverdue} >= 0`),
  finePaymentCheck: check('chk_fine_payment', sql`
    (${table.status} = 'paid' AND ${table.paidDate} IS NOT NULL) OR 
    (${table.status} = 'waived' AND ${table.waivedBy} IS NOT NULL AND ${table.waivedReason} IS NOT NULL) OR 
    ${table.status} IN ('unpaid', 'disputed')
  `),
  fineDueDateCheck: check('chk_fine_due_date', sql`${table.dueDate} IS NULL OR ${table.dueDate} >= ${table.fineDate}`),
  
  // Indexes
  userIdx: index('idx_fines_user').on(table.userId),
  statusIdx: index('idx_fines_status').on(table.status),
  userStatusIdx: index('idx_fines_user_status').on(table.userId, table.status),
  dueDateIdx: index('idx_fines_due_date').on(table.dueDate).where(sql`${table.dueDate} IS NOT NULL AND ${table.status} = 'unpaid'`),
  borrowRequestIdx: index('idx_fines_borrow_request').on(table.borrowRequestId).where(sql`${table.borrowRequestId} IS NOT NULL`),
}));

// =============================================
// 13. NOTIFICATIONS TABLE
// =============================================
export const notifications = pgTable('notifications', {
id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    userId: uuid('user_id').references(() => users.id), 
  type: text('type').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  emailSent: boolean('email_sent').default(false),
  smsSent: boolean('sms_sent').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => ({
  typeCheck: check('chk_notification_type', sql`${table.type} IN ('due_reminder', 'overdue_notice', 'reservation_ready', 'fine_notice', 'account_status', 'general')`),
  readCheck: check('chk_notification_read', sql`
    (${table.isRead} = FALSE AND ${table.readAt} IS NULL) OR 
    (${table.isRead} = TRUE AND ${table.readAt} IS NOT NULL)
  `),
  
  // Indexes
  userIdx: index('idx_notifications_user').on(table.userId),
  userReadIdx: index('idx_notifications_user_read').on(table.userId, table.isRead),
  typeIdx: index('idx_notifications_type').on(table.type),
  unreadIdx: index('idx_notifications_unread').on(table.userId).where(sql`${table.isRead} = FALSE`),
}));

// =============================================
// 14. AUDIT LOG TABLE
// =============================================
export const auditLog = pgTable('audit_log', {
id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  tableName: text('table_name').notNull(),
  recordId: bigint('record_id', { mode: 'number' }).notNull(),
  action: text('action').notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: uuid('user_id').references(() => users.id), 
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  actionCheck: check('chk_audit_action', sql`${table.action} IN ('INSERT', 'UPDATE', 'DELETE')`),
  actionValuesCheck: check('chk_audit_action_values', sql`
    (${table.action} = 'INSERT' AND ${table.oldValues} IS NULL AND ${table.newValues} IS NOT NULL) OR
    (${table.action} = 'UPDATE' AND ${table.oldValues} IS NOT NULL AND ${table.newValues} IS NOT NULL) OR
    (${table.action} = 'DELETE' AND ${table.oldValues} IS NOT NULL AND ${table.newValues} IS NULL)
  `),
  
  // Indexes
  tableRecordIdx: index('idx_audit_log_table_record').on(table.tableName, table.recordId),
  userIdx: index('idx_audit_log_user').on(table.userId).where(sql`${table.userId} IS NOT NULL`),
  timestampIdx: index('idx_audit_log_timestamp').on(table.timestamp),
}));

// =============================================
// RELATIONS
// =============================================

export const departmentsRelations = relations(departments, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  department: one(departments, {
    fields: [users.departmentId],
    references: [departments.id],
  }),
  borrowRequests: many(borrowRequests, { relationName: 'user' }),
  reservations: many(reservations),
  fines: many(fines, { relationName: 'user' }),
  notifications: many(notifications),
  approvedBorrowRequests: many(borrowRequests, { relationName: 'librarian' }), 
  waivedFines: many(fines, { relationName: 'waiver' }),
  auditLogs: many(auditLog),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  bookAuthors: many(bookAuthors),
}));

export const publishersRelations = relations(publishers, ({ many }) => ({
  books: many(books),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  parentSubject: one(subjects, {
    fields: [subjects.parentSubjectId],
    references: [subjects.id],
    relationName: 'parent',
  }),
  childSubjects: many(subjects, { relationName: 'parent' }),
  bookSubjects: many(bookSubjects),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  publisher: one(publishers, {
    fields: [books.publisherId],
    references: [publishers.id],
  }),
  bookAuthors: many(bookAuthors),
  bookSubjects: many(bookSubjects),
  bookCopies: many(bookCopies),
  reservations: many(reservations),
}));

export const bookAuthorsRelations = relations(bookAuthors, ({ one }) => ({
  book: one(books, {
    fields: [bookAuthors.bookId],
    references: [books.id],
  }),
  author: one(authors, {
    fields: [bookAuthors.authorId],
    references: [authors.id],
  }),
}));

export const bookSubjectsRelations = relations(bookSubjects, ({ one }) => ({
  book: one(books, {
    fields: [bookSubjects.bookId],
    references: [books.id],
  }),
  subject: one(subjects, {
    fields: [bookSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const bookCopiesRelations = relations(bookCopies, ({ one, many }) => ({
  book: one(books, {
    fields: [bookCopies.bookId],
    references: [books.id],
  }),
  borrowRequests: many(borrowRequests, {
    relationName: 'bookCopy',
  }),
}));

export const borrowRequestsRelations = relations(borrowRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [borrowRequests.userId],
    references: [users.id],
    relationName: 'user',
  }),
  bookCopy: one(bookCopies, {
    fields: [borrowRequests.bookCopyId],
    references: [bookCopies.id],
    relationName: 'bookCopy',
  }),
  librarian: one(users, {
    fields: [borrowRequests.librarianId],
    references: [users.id],
    relationName: 'librarian',
  }),
  fines: many(fines),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  user: one(users, {
    fields: [reservations.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [reservations.bookId],
    references: [books.id],
  }),
}));

export const finesRelations = relations(fines, ({ one }) => ({
  user: one(users, {
    fields: [fines.userId],
    references: [users.id],
    relationName: 'user',
  }),
  borrowRequest: one(borrowRequests, {
    fields: [fines.borrowRequestId],
    references: [borrowRequests.id],
  }),
  waivedBy: one(users, {
    fields: [fines.waivedBy],
    references: [users.id],
    relationName: 'waiver',
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));