"use server";

import { db } from "@/database/drizzle";
import { books, borrowRequests, bookCopies } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import dayjs from "dayjs";

export const borrowBook = async (params: BorrowBookParams) => {
  const { userId, bookId } = params;

  try {
    const book = await db
      .select({ availableCopies: books.availableCopies })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book.length || book[0].availableCopies <= 0) {
      return {
        success: false,
        error: "Book is not available for borrowing",
      };
    }

    // Find an available book copy
    const availableCopy = await db
      .select({ id: bookCopies.id })
      .from(bookCopies)
      .where(and(eq(bookCopies.bookId, bookId), eq(bookCopies.status, "available")))
      .limit(1);

    if (!availableCopy.length) {
      return {
        success: false,
        error: "No available copies of this book",
      };
    }

    const bookCopyId = availableCopy[0].id;
    const dueDate = dayjs().add(7, "day").toDate();

    const record = await db.insert(borrowRequests).values({
      userId,
      bookCopyId: bookCopyId,
      librarianId: null,
      requestDate: new Date(),
      approvedDate: new Date(),
      dueDate,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Update book copies and book available count
    await db
      .update(bookCopies)
      .set({ status: "borrowed" })
      .where(eq(bookCopies.id, bookCopyId));

    await db
      .update(books)
      .set({ availableCopies: book[0].availableCopies - 1 })
      .where(eq(books.id, bookId));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(record)),
    };
  } catch (error) {
    console.log(error);

    return {
      success: false,
      error: "An error occurred while borrowing the book",
    };
  }
};

