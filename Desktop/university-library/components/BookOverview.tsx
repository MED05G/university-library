import React from "react";
import Image from "next/image";
import BookCover from "@/components/BookCover";
import BookActionButton from "@/components/BookActionButton";
import { db } from "@/database/drizzle";
import { users, reservations } from "@/database/schema";
import { eq, and } from "drizzle-orm";

interface Props extends Book {
  userId: string;
}
const BookOverview = async ({
  title,
  author,
  genre,
  rating,
  totalCopies,
  availableCopies,
  description,
  coverColor,
  coverUrl,
  id,
  userId,
}: Props) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Check if user has an active reservation for this book
  const [activeReservation] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.userId, userId),
        eq(reservations.bookId, id),
        eq(reservations.status, "active")
      )
    )
    .limit(1);

  const borrowingEligibility = {
    isEligible: user?.accountStatus === "active",
    message:
      user?.accountStatus !== "active"
        ? "You are not eligible to borrow books"
        : availableCopies <= 0
        ? "Book is not available for borrowing"
        : "Book is available for borrowing",
  };

  return (
    <section className="book-overview">
      <div className="flex flex-1 flex-col gap-5">
        <h1>{title}</h1>

        <div className="book-info">
          <p>
            By <span className="font-semibold text-black">{author}</span>
          </p>

          <p>
            Category{" "}
            <span className="font-semibold text-black">{genre}</span>
          </p>

          <div className="flex flex-row gap-1">
            <Image src="/icons/star.svg" alt="star" width={22} height={22} />
            <p>{rating}</p>
          </div>
        </div>

        <div className="book-copies">
          <p>
            Total Books <span>{totalCopies}</span>
          </p>

          <p>
            Available Books <span>{availableCopies}</span>
          </p>
        </div>

        {/* Show reservation queue info if book is not available */}
        {availableCopies === 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-orange-800 text-sm">
              📚 This book is currently unavailable. You can reserve it to be notified when it becomes available.
            </p>
            {activeReservation && (
              <p className="text-orange-600 text-sm mt-1">
                ⏰ You are #{activeReservation.queuePosition} in the reservation queue.
              </p>
            )}
          </div>
        )}

        <p className="book-description">{description}</p>

        {user && (
          <BookActionButton
            bookId={id}
            userId={userId}
            availableCopies={availableCopies}
            borrowingEligibility={borrowingEligibility}
            hasActiveReservation={!!activeReservation}
          />
        )}
      </div>

      <div className="relative flex flex-1 justify-center">
        <div className="relative">
          <BookCover
            variant="wide"
            className="z-10"
            coverColor={coverColor}
            coverImage={coverUrl}
          />

          <div className="absolute left-16 top-10 rotate-12 opacity-40 max-sm:hidden">
            <BookCover
              variant="wide"
              coverColor={coverColor}
              coverImage={coverUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BookOverview;