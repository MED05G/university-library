"use server";

import { db } from "@/database/drizzle";
import { borrowRequests, books, bookCopies } from "@/database/schema";
import { eq, and, isNull, desc } from "drizzle-orm";

export const getUserBorrowedBooks = async (userId: string) => {
  try {
    const borrowedBooks = await db
      .select({
        id: borrowRequests.id,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverUrl,
        copyId: borrowRequests.copyId,
        copyNumber: bookCopies.copyNumber,
        borrowDate: borrowRequests.borrowDate,
        dueDate: borrowRequests.dueDate,
        returnDate: borrowRequests.returnDate,
        status: borrowRequests.status,
        renewalCount: borrowRequests.renewalCount,
        maxRenewals: borrowRequests.maxRenewals,
        createdAt: borrowRequests.createdAt,
      })
      .from(borrowRequests)
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .leftJoin(bookCopies, eq(borrowRequests.copyId, bookCopies.id))
      .where(
        and(
          eq(borrowRequests.userId, userId),
          isNull(borrowRequests.returnDate)
        )
      )
      .orderBy(desc(borrowRequests.borrowDate));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(borrowedBooks)),
    };
  } catch (error) {
    console.error("Error fetching user borrowed books:", error);
    return {
      success: false,
      error: "Failed to fetch borrowed books",
    };
  }
};

export const getUserBorrowHistory = async (userId: string) => {
  try {
    const borrowHistory = await db
      .select({
        id: borrowRequests.id,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverUrl,
        copyId: borrowRequests.copyId,
        copyNumber: bookCopies.copyNumber,
        borrowDate: borrowRequests.borrowDate,
        dueDate: borrowRequests.dueDate,
        returnDate: borrowRequests.returnDate,
        status: borrowRequests.status,
        renewalCount: borrowRequests.renewalCount,
        createdAt: borrowRequests.createdAt,
      })
      .from(borrowRequests)
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .leftJoin(bookCopies, eq(borrowRequests.copyId, bookCopies.id))
      .where(eq(borrowRequests.userId, userId))
      .orderBy(desc(borrowRequests.borrowDate));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(borrowHistory)),
    };
  } catch (error) {
    console.error("Error fetching user borrow history:", error);
    return {
      success: false,
      error: "Failed to fetch borrow history",
    };
  }
};

export const renewUserBook = async (borrowRecordId: string, userId: string) => {
  try {
    const currentDate = new Date();

    // Get the borrow record and verify it belongs to the user
    const [borrowRecord] = await db
      .select()
      .from(borrowRequests)
      .where(
        and(
          eq(borrowRequests.id, borrowRecordId),
          eq(borrowRequests.userId, userId)
        )
      )
      .limit(1);

    if (!borrowRecord) {
      return {
        success: false,
        error: "Borrow record not found or access denied",
      };
    }

    // Check if the book can be renewed
    if (borrowRecord.renewalCount >= (borrowRecord.maxRenewals || 2)) {
      return {
        success: false,
        error: "Maximum renewal limit reached",
      };
    }

    if (borrowRecord.returnDate) {
      return {
        success: false,
        error: "Book has already been returned",
      };
    }

    // Calculate new due date (14 days from current date)
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + 14);

    // Update the borrow record
    await db
      .update(borrowRequests)
      .set({
        dueDate: newDueDate,
        renewalCount: borrowRecord.renewalCount + 1,
        status: "borrowed", // Reset status if it was overdue
        updatedAt: currentDate,
      })
      .where(eq(borrowRequests.id, borrowRecordId));

    return {
      success: true,
      message: "Book renewed successfully",
      newDueDate: newDueDate.toISOString(),
    };
  } catch (error) {
    console.error("Error renewing book:", error);
    return {
      success: false,
      error: "Failed to renew book",
    };
  }
};

