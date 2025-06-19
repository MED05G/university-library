"use server";

import { db } from "@/database/drizzle";
import { borrowRequests, books, users, bookCopies } from "@/database/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getAllBorrowRequests = async () => {
  try {
    const borrowRequests = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
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
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .leftJoin(bookCopies, eq(borrowRequests.copyId, bookCopies.id))
      .orderBy(desc(borrowRequests.createdAt));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(borrowRequests)),
    };
  } catch (error) {
    console.error("Error fetching borrow requests:", error);
    return {
      success: false,
      error: "Failed to fetch borrow requests",
    };
  }
};

export const getActiveBorrowRequests = async () => {
  try {
    const activeBorrowRequests = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
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
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .leftJoin(bookCopies, eq(borrowRequests.copyId, bookCopies.id))
      .where(
        or(
          eq(borrowRequests.status, "borrowed"),
          eq(borrowRequests.status, "overdue")
        )
      )
      .orderBy(desc(borrowRequests.createdAt));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(activeBorrowRequests)),
    };
  } catch (error) {
    console.error("Error fetching active borrow requests:", error);
    return {
      success: false,
      error: "Failed to fetch active borrow requests",
    };
  }
};

export const getOverdueBorrowRequests = async () => {
  try {
    const currentDate = new Date();
    
    const overdueBorrowRequests = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
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
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .leftJoin(bookCopies, eq(borrowRequests.copyId, bookCopies.id))
      .where(
        and(
          eq(borrowRequests.status, "borrowed"),
          isNull(borrowRequests.returnDate)
        )
      )
      .orderBy(desc(borrowRequests.createdAt));

    // Filter overdue records on the client side
    const overdueRecords = overdueBorrowRequests.filter(record => {
      if (!record.dueDate) return false;
      return new Date(record.dueDate) < currentDate;
    });

    return {
      success: true,
      data: JSON.parse(JSON.stringify(overdueRecords)),
    };
  } catch (error) {
    console.error("Error fetching overdue borrow requests:", error);
    return {
      success: false,
      error: "Failed to fetch overdue borrow requests",
    };
  }
};

export const returnBook = async (borrowRecordId: string) => {
  try {
    const currentDate = new Date();

    // Get the borrow record
    const [borrowRecord] = await db
      .select()
      .from(borrowRequests)
      .where(eq(borrowRequests.id, borrowRecordId))
      .limit(1);

    if (!borrowRecord) {
      return {
        success: false,
        error: "Borrow record not found",
      };
    }

    // Update the borrow record
    await db
      .update(borrowRequests)
      .set({
        returnDate: currentDate,
        status: "returned",
        updatedAt: currentDate,
      })
      .where(eq(borrowRequests.id, borrowRecordId));

    // Update the book copy status
    await db
      .update(bookCopies)
      .set({
        status: "available",
        updatedAt: currentDate,
      })
      .where(eq(bookCopies.id, borrowRecord.copyId));

    // Update the book's available copies count
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, borrowRecord.bookId))
      .limit(1);

    if (book) {
      await db
        .update(books)
        .set({
          availableCopies: book.availableCopies + 1,
          updatedAt: currentDate,
        })
        .where(eq(books.id, borrowRecord.bookId));
    }

    revalidatePath("/admin/book-requests");

    return {
      success: true,
      message: "Book returned successfully",
    };
  } catch (error) {
    console.error("Error returning book:", error);
    return {
      success: false,
      error: "Failed to return book",
    };
  }
};

export const renewBook = async (borrowRecordId: string, newDueDate: Date) => {
  try {
    const currentDate = new Date();

    // Get the borrow record
    const [borrowRecord] = await db
      .select()
      .from(borrowRequests)
      .where(eq(borrowRequests.id, borrowRecordId))
      .limit(1);

    if (!borrowRecord) {
      return {
        success: false,
        error: "Borrow record not found",
      };
    }

    // Check if the book can be renewed (max 2 renewals)
    if (borrowRecord.renewalCount >= 2) {
      return {
        success: false,
        error: "Maximum renewal limit reached",
      };
    }

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

    revalidatePath("/admin/book-requests");

    return {
      success: true,
      message: "Book renewed successfully",
    };
  } catch (error) {
    console.error("Error renewing book:", error);
    return {
      success: false,
      error: "Failed to renew book",
    };
  }
};

export const markAsOverdue = async (borrowRecordId: string) => {
  try {
    const currentDate = new Date();

    await db
      .update(borrowRequests)
      .set({
        status: "overdue",
        updatedAt: currentDate,
      })
      .where(eq(borrowRequests.id, borrowRecordId));

    revalidatePath("/admin/book-requests");

    return {
      success: true,
      message: "Book marked as overdue",
    };
  } catch (error) {
    console.error("Error marking book as overdue:", error);
    return {
      success: false,
      error: "Failed to mark book as overdue",
    };
  }
};

