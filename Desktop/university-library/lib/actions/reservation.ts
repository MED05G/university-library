"use server";

import { db } from "@/database/drizzle";
import { reservations, books, users, bookCopies, borrowRequests } from "@/database/schema";
import { eq, and, isNull, desc, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const createReservation = async (params: {
  userId: string;
  bookId: string;
}) => {
  const { userId, bookId } = params;

  try {
    // Check if the book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return {
        success: false,
        error: "Book not found",
      };
    }

    // Check if there are available copies
    if (book.availableCopies > 0) {
      return {
        success: false,
        error: "Book is currently available for borrowing",
      };
    }

    // Check if user already has an active reservation for this book
    const [existingReservation] = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.userId, userId),
          eq(reservations.bookId, bookId),
          eq(reservations.status, "active")
        )
      )
      .limit(1);

    if (existingReservation) {
      return {
        success: false,
        error: "You already have an active reservation for this book",
      };
    }

    // Check if user currently has this book borrowed
    const [currentBorrow] = await db
      .select()
      .from(borrowRequests)
      .where(
        and(
          eq(borrowRequests.userId, userId),
          eq(borrowRequests.bookId, bookId),
          isNull(borrowRequests.returnDate)
        )
      )
      .limit(1);

    if (currentBorrow) {
      return {
        success: false,
        error: "You currently have this book borrowed",
      };
    }

    // Get the current queue position (number of active reservations + 1)
    const [queueCount] = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.bookId, bookId),
          eq(reservations.status, "active")
        )
      );

    const queuePosition = (queueCount?.count || 0) + 1;

    // Set expiry date (7 days from now when notified)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Create the reservation
    const [newReservation] = await db
      .insert(reservations)
      .values({
        userId: userId,
        bookId: bookId,
        queuePosition: queuePosition,
        expiryDate: expiryDate,
        status: "active",
        notificationSent: false,
      })
      .returning();

    revalidatePath("/my-profile");
    revalidatePath(`/books/${bookId}`);

    return {
      success: true,
      message: "Book reserved successfully",
      reservationId: newReservation.id,
      queuePosition: queuePosition,
    };
  } catch (error) {
    console.error("Error creating reservation:", error);
    return {
      success: false,
      error: "Failed to create reservation",
    };
  }
};

export const cancelReservation = async (params: {
  reservationId: string;
  userId: string;
}) => {
  const { reservationId, userId } = params;

  try {
    // Get the reservation and verify it belongs to the user
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.id, reservationId),
          eq(reservations.userId, userId)
        )
      )
      .limit(1);

    if (!reservation) {
      return {
        success: false,
        error: "Reservation not found or access denied",
      };
    }

    if (reservation.status !== "active") {
      return {
        success: false,
        error: "Reservation is not active",
      };
    }

    // Cancel the reservation
    await db
      .update(reservations)
      .set({
        status: "cancelled",
      })
      .where(eq(reservations.id, reservationId));

    // Update queue positions for other reservations
    await updateQueuePositions(reservation.bookId);

    revalidatePath("/my-profile");
    revalidatePath(`/books/${reservation.bookId}`);

    return {
      success: true,
      message: "Reservation cancelled successfully",
    };
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return {
      success: false,
      error: "Failed to cancel reservation",
    };
  }
};

export const getUserReservations = async (userId: string) => {
  try {
    const userReservations = await db
      .select({
        id: reservations.id,
        bookId: reservations.bookId,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookCover: books.coverUrl,
        reservationDate: reservations.reservationDate,
        expiryDate: reservations.expiryDate,
        queuePosition: reservations.queuePosition,
        status: reservations.status,
        notificationSent: reservations.notificationSent,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .leftJoin(books, eq(reservations.bookId, books.id))
      .where(eq(reservations.userId, userId))
      .orderBy(desc(reservations.createdAt));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(userReservations)),
    };
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    return {
      success: false,
      error: "Failed to fetch reservations",
    };
  }
};

export const getBookReservations = async (bookId: string) => {
  try {
    const bookReservations = await db
      .select({
        id: reservations.id,
        userId: reservations.userId,
        userName: users.fullName,
        userEmail: users.email,
        reservationDate: reservations.reservationDate,
        expiryDate: reservations.expiryDate,
        queuePosition: reservations.queuePosition,
        status: reservations.status,
        notificationSent: reservations.notificationSent,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .leftJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          eq(reservations.bookId, bookId),
          eq(reservations.status, "active")
        )
      )
      .orderBy(asc(reservations.queuePosition));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(bookReservations)),
    };
  } catch (error) {
    console.error("Error fetching book reservations:", error);
    return {
      success: false,
      error: "Failed to fetch book reservations",
    };
  }
};

export const processReservationQueue = async (bookId: string) => {
  try {
    // This function is called when a book is returned
    // It notifies the next person in the reservation queue

    // Get the next reservation in queue
    const [nextReservation] = await db
      .select({
        id: reservations.id,
        userId: reservations.userId,
        userName: users.fullName,
        userEmail: users.email,
        queuePosition: reservations.queuePosition,
      })
      .from(reservations)
      .leftJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          eq(reservations.bookId, bookId),
          eq(reservations.status, "active")
        )
      )
      .orderBy(asc(reservations.queuePosition))
      .limit(1);

    if (!nextReservation) {
      return {
        success: true,
        message: "No active reservations for this book",
      };
    }

    // Update the reservation to indicate notification was sent
    await db
      .update(reservations)
      .set({
        notificationSent: true,
        // Set new expiry date (3 days from notification)
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      })
      .where(eq(reservations.id, nextReservation.id));

    // Here you would send an email notification
    // For now, we'll just return the notification data

    return {
      success: true,
      message: "Next user in queue notified",
      notificationData: {
        userId: nextReservation.userId,
        userName: nextReservation.userName,
        userEmail: nextReservation.userEmail,
        queuePosition: nextReservation.queuePosition,
      },
    };
  } catch (error) {
    console.error("Error processing reservation queue:", error);
    return {
      success: false,
      error: "Failed to process reservation queue",
    };
  }
};

export const expireReservations = async () => {
  try {
    const currentDate = new Date();

    // Find expired reservations
    const expiredReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "active"),
          eq(reservations.notificationSent, true)
        )
      );

    // Filter expired reservations on the client side
    const expiredIds = expiredReservations
      .filter(reservation => new Date(reservation.expiryDate) < currentDate)
      .map(reservation => reservation.id);

    if (expiredIds.length === 0) {
      return {
        success: true,
        message: "No expired reservations found",
        expiredCount: 0,
      };
    }

    // Update expired reservations
    for (const reservationId of expiredIds) {
      await db
        .update(reservations)
        .set({
          status: "expired",
        })
        .where(eq(reservations.id, reservationId));
    }

    // Update queue positions for affected books
    const affectedBooks = new Set(
      expiredReservations
        .filter(r => expiredIds.includes(r.id))
        .map(r => r.bookId)
    );

    for (const bookId of affectedBooks) {
      await updateQueuePositions(bookId);
    }

    return {
      success: true,
      message: `Expired ${expiredIds.length} reservations`,
      expiredCount: expiredIds.length,
    };
  } catch (error) {
    console.error("Error expiring reservations:", error);
    return {
      success: false,
      error: "Failed to expire reservations",
    };
  }
};

// Helper function to update queue positions
const updateQueuePositions = async (bookId: string) => {
  try {
    // Get all active reservations for the book, ordered by creation date
    const activeReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.bookId, bookId),
          eq(reservations.status, "active")
        )
      )
      .orderBy(asc(reservations.createdAt));

    // Update queue positions
    for (let i = 0; i < activeReservations.length; i++) {
      await db
        .update(reservations)
        .set({
          queuePosition: i + 1,
        })
        .where(eq(reservations.id, activeReservations[i].id));
    }
  } catch (error) {
    console.error("Error updating queue positions:", error);
  }
};

