"use server";

import { db } from "@/database/drizzle";
import { borrowRequests, books, users, bookCopies } from "@/database/schema";
import { eq, and, isNull, lt, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const processOverdueBooks = async () => {
  try {
    const currentDate = new Date();
    
    // Find all borrowed books that are past due date and not returned
    const overdueBooks = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        bookId: borrowRequests.bookId,
        copyId: borrowRequests.copyId,
        dueDate: borrowRequests.dueDate,
        status: borrowRequests.status,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        bookAuthor: books.author,
      })
      .from(borrowRequests)
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .where(
        and(
          eq(borrowRequests.status, "borrowed"),
          isNull(borrowRequests.returnDate),
          lt(borrowRequests.dueDate, currentDate)
        )
      );

    let updatedCount = 0;
    let finesCreated = 0;

    for (const book of overdueBooks) {
      // Update the borrow record status to overdue
      await db
        .update(borrowRequests)
        .set({
          status: "overdue",
          updatedAt: currentDate,
        })
        .where(eq(borrowRequests.id, book.id));

      updatedCount++;

      // Calculate fine amount (e.g., $1 per day overdue)
      const daysOverdue = Math.ceil(
        (currentDate.getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const fineAmount = daysOverdue * 1.00; // $1 per day

      // Check if a fine already exists for this borrow record
      const [existingFine] = await db
        .select()
        .from(fines)
        .where(eq(fines.borrowRequestId, book.id))
        .limit(1);

      if (!existingFine) {
        // Create a fine record
        await db
          .insert(fines)
          .values({
            userId: book.userId,
            borrowRequestId: book.id,
            amount: fineAmount,
            reason: `Overdue book: ${book.bookTitle}`,
            status: "unpaid",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days to pay
          });

        finesCreated++;
      } else if (existingFine.status === "unpaid") {
        // Update existing fine amount
        await db
          .update(fines)
          .set({
            amount: fineAmount,
            updatedAt: currentDate,
          })
          .where(eq(fines.id, existingFine.id));
      }
    }

    return {
      success: true,
      message: `Processed ${updatedCount} overdue books and created ${finesCreated} new fines`,
      overdueCount: updatedCount,
      finesCreated: finesCreated,
    };
  } catch (error) {
    console.error("Error processing overdue books:", error);
    return {
      success: false,
      error: "Failed to process overdue books",
    };
  }
};

export const getOverdueStatistics = async () => {
  try {
    const currentDate = new Date();

    // Get overdue books count
    const overdueBooks = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        dueDate: borrowRequests.dueDate,
        daysOverdue: borrowRequests.dueDate,
      })
      .from(borrowRequests)
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .where(
        and(
          eq(borrowRequests.status, "overdue"),
          isNull(borrowRequests.returnDate)
        )
      )
      .orderBy(desc(borrowRequests.dueDate));

    // Calculate days overdue for each book
    const overdueWithDays = overdueBooks.map(book => ({
      ...book,
      daysOverdue: Math.ceil(
        (currentDate.getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    // Get unpaid fines total
    const unpaidFines = await db
      .select({
        totalAmount: fines.amount,
      })
      .from(fines)
      .where(eq(fines.status, "unpaid"));

    const totalUnpaidFines = unpaidFines.reduce((sum, fine) => sum + fine.totalAmount, 0);

    // Get users with overdue books
    const usersWithOverdue = await db
      .select({
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        overdueCount: borrowRequests.id,
      })
      .from(borrowRequests)
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .where(
        and(
          eq(borrowRequests.status, "overdue"),
          isNull(borrowRequests.returnDate)
        )
      );

    // Group by user
    const userOverdueMap = new Map();
    usersWithOverdue.forEach(item => {
      if (userOverdueMap.has(item.userId)) {
        userOverdueMap.get(item.userId).count++;
      } else {
        userOverdueMap.set(item.userId, {
          userId: item.userId,
          userName: item.userName,
          userEmail: item.userEmail,
          count: 1,
        });
      }
    });

    return {
      success: true,
      data: {
        totalOverdueBooks: overdueWithDays.length,
        overdueBooks: JSON.parse(JSON.stringify(overdueWithDays)),
        totalUnpaidFines: totalUnpaidFines,
        usersWithOverdue: Array.from(userOverdueMap.values()),
        averageDaysOverdue: overdueWithDays.length > 0 
          ? Math.round(overdueWithDays.reduce((sum, book) => sum + book.daysOverdue, 0) / overdueWithDays.length)
          : 0,
      },
    };
  } catch (error) {
    console.error("Error getting overdue statistics:", error);
    return {
      success: false,
      error: "Failed to get overdue statistics",
    };
  }
};

export const sendOverdueReminders = async () => {
  try {
    const currentDate = new Date();

    // Get all overdue books with user information
    const overdueBooks = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        bookTitle: books.title,
        bookAuthor: books.author,
        dueDate: borrowRequests.dueDate,
      })
      .from(borrowRequests)
      .leftJoin(users, eq(borrowRequests.userId, users.id))
      .leftJoin(books, eq(borrowRequests.bookId, books.id))
      .where(
        and(
          eq(borrowRequests.status, "overdue"),
          isNull(borrowRequests.returnDate)
        )
      );

    // Group by user email
    const userReminders = new Map();
    overdueBooks.forEach(book => {
      if (!userReminders.has(book.userEmail)) {
        userReminders.set(book.userEmail, {
          userName: book.userName,
          userEmail: book.userEmail,
          books: [],
        });
      }
      userReminders.get(book.userEmail).books.push({
        title: book.bookTitle,
        author: book.bookAuthor,
        dueDate: book.dueDate,
        daysOverdue: Math.ceil(
          (currentDate.getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      });
    });

    // Here you would integrate with your email service
    // For now, we'll just return the data that would be sent
    const reminders = Array.from(userReminders.values());

    return {
      success: true,
      message: `Prepared ${reminders.length} overdue reminders`,
      reminders: reminders,
    };
  } catch (error) {
    console.error("Error sending overdue reminders:", error);
    return {
      success: false,
      error: "Failed to send overdue reminders",
    };
  }
};

export const getOverdueBooksForAdmin = async () => {
  try {
    const currentDate = new Date();

    const overdueBooks = await db
      .select({
        id: borrowRequests.id,
        userId: borrowRequests.userId,
        userName: users.fullName,
        userEmail: users.email,
        userPhone: users.phone,
        bookId: borrowRequests.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        copyId: borrowRequests.copyId,
        copyNumber: bookCopies.copyNumber,
        borrowDate: borrowRequests.borrowDate,
        dueDate: borrowRequests.dueDate,
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
          eq(borrowRequests.status, "overdue"),
          isNull(borrowRequests.returnDate)
        )
      )
      .orderBy(desc(borrowRequests.dueDate));

    // Calculate days overdue for each book
    const overdueWithDays = overdueBooks.map(book => ({
      ...book,
      daysOverdue: Math.ceil(
        (currentDate.getTime() - new Date(book.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(overdueWithDays)),
    };
  } catch (error) {
    console.error("Error fetching overdue books for admin:", error);
    return {
      success: false,
      error: "Failed to fetch overdue books",
    };
  }
};

