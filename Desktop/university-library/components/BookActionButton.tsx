"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { borrowBook } from "@/lib/actions/book";
import { createReservation } from "@/lib/actions/reservation";
import { BookOpen, Clock } from "lucide-react";

interface Props {
  userId: string;
  bookId: string;
  availableCopies: number;
  borrowingEligibility: {
    isEligible: boolean;
    message: string;
  };
  hasActiveReservation?: boolean;
}

const BookActionButton = ({
  userId,
  bookId,
  availableCopies,
  borrowingEligibility: { isEligible, message },
  hasActiveReservation = false,
}: Props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleBorrowBook = async () => {
    if (!isEligible) {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await borrowBook({ bookId, userId });

      if (result.success) {
        toast({
          title: "Success",
          description: "Book borrowed successfully",
        });

        router.push("/my-profile");
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while borrowing the book",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReserveBook = async () => {
    if (!isEligible) {
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createReservation({ bookId, userId });

      if (result.success) {
        toast({
          title: "Success",
          description: `Book reserved successfully. You are #${result.queuePosition} in the queue.`,
        });

        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while reserving the book",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If book is available, show borrow button
  if (availableCopies > 0) {
    return (
      <Button
        className="book-overview_btn"
        onClick={handleBorrowBook}
        disabled={isLoading || !isEligible}
      >
        <BookOpen className="w-5 h-5 mr-2" />
        <p className="font-bebas-neue text-xl text-white">
          {isLoading ? "Borrowing..." : "Borrow Book"}
        </p>
      </Button>
    );
  }

  // If book is not available and user doesn't have a reservation, show reserve button
  if (!hasActiveReservation) {
    return (
      <Button
        className="book-overview_btn bg-orange-600 hover:bg-orange-700"
        onClick={handleReserveBook}
        disabled={isLoading || !isEligible}
      >
        <Clock className="w-5 h-5 mr-2" />
        <p className="font-bebas-neue text-xl text-white">
          {isLoading ? "Reserving..." : "Reserve Book"}
        </p>
      </Button>
    );
  }

  // If user already has a reservation, show disabled button
  return (
    <Button
      className="book-overview_btn bg-gray-500"
      disabled={true}
    >
      <Clock className="w-5 h-5 mr-2" />
      <p className="font-bebas-neue text-xl text-white">
        Already Reserved
      </p>
    </Button>
  );
};

export default BookActionButton;

