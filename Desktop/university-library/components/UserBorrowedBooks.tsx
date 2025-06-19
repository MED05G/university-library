"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { renewUserBook } from "@/lib/actions/user-books";
import { returnBook } from "@/lib/actions/borrow";
import { toast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  CheckCircle, 
  Calendar,
  AlertTriangle,
  Book
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface BorrowedBook {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  copyId: string;
  copyNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewalCount: number;
  maxRenewals: number;
  createdAt: string;
}

interface UserBorrowedBooksProps {
  borrowedBooks: BorrowedBook[];
}

const UserBorrowedBooks = ({ borrowedBooks: initialBorrowedBooks }: UserBorrowedBooksProps) => {
  const { data: session } = useSession();
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>(initialBorrowedBooks);
  const [selectedBook, setSelectedBook] = useState<BorrowedBook | null>(null);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRenewBook = async () => {
    if (!selectedBook || !session?.user?.id) return;

    const result = await renewUserBook(selectedBook.id, session.user.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Book renewed successfully",
      });
      
      // Update the book in the local state
      setBorrowedBooks(borrowedBooks.map(book => 
        book.id === selectedBook.id 
          ? { 
              ...book, 
              dueDate: result.newDueDate!,
              renewalCount: book.renewalCount + 1,
              status: "borrowed"
            }
          : book
      ));
      
      setIsRenewDialogOpen(false);
      setSelectedBook(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleReturnBook = async () => {
    if (!selectedBook) return;

    const result = await returnBook(selectedBook.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Book returned successfully",
      });
      
      // Remove the book from the local state
      setBorrowedBooks(borrowedBooks.filter(book => book.id !== selectedBook.id));
      
      setIsReturnDialogOpen(false);
      setSelectedBook(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (book: BorrowedBook) => {
    if (isOverdue(book.dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    
    const daysUntilDue = getDaysUntilDue(book.dueDate);
    if (daysUntilDue <= 3) {
      return <Badge variant="secondary">Due Soon</Badge>;
    }
    
    return <Badge variant="default">Borrowed</Badge>;
  };

  if (borrowedBooks.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Book className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No borrowed books</h3>
          <p className="text-gray-600 text-center">
            You don't have any books currently borrowed. Visit the library to borrow some books!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {borrowedBooks.map((book) => (
          <Card key={book.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{book.bookTitle}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{book.bookAuthor}</p>
                </div>
                {book.bookCover && (
                  <div className="ml-3 flex-shrink-0">
                    <Image
                      src={book.bookCover}
                      alt={book.bookTitle}
                      width={60}
                      height={80}
                      className="rounded object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(book)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Copy:</span>
                <span className="text-sm font-medium">{book.copyNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Borrowed:</span>
                <span className="text-sm">{new Date(book.borrowDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due:</span>
                <div className="flex items-center space-x-1">
                  <span className="text-sm">{new Date(book.dueDate).toLocaleDateString()}</span>
                  {isOverdue(book.dueDate) && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Renewals:</span>
                <span className="text-sm">{book.renewalCount}/{book.maxRenewals}</span>
              </div>
              
              <div className="flex space-x-2 pt-2">
                {book.renewalCount < book.maxRenewals && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBook(book);
                      setIsRenewDialogOpen(true);
                    }}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Renew
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBook(book);
                    setIsReturnDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Return
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Renew Book Dialog */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to renew this book? The due date will be extended by 14 days.
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="py-4">
              <p><strong>Book:</strong> {selectedBook.bookTitle}</p>
              <p><strong>Author:</strong> {selectedBook.bookAuthor}</p>
              <p><strong>Current Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleDateString()}</p>
              <p><strong>Renewals Used:</strong> {selectedBook.renewalCount}/{selectedBook.maxRenewals}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenewBook}>
              Renew Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to return this book? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="py-4">
              <p><strong>Book:</strong> {selectedBook.bookTitle}</p>
              <p><strong>Author:</strong> {selectedBook.bookAuthor}</p>
              <p><strong>Copy:</strong> {selectedBook.copyNumber}</p>
              <p><strong>Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleDateString()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnBook}>
              Return Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBorrowedBooks;

