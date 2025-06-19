"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { returnBook } from "@/lib/actions/borrow";
import { processOverdueBooks, sendOverdueReminders } from "@/lib/actions/overdue";
import { toast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CheckCircle, 
  Mail,
  Search,
  RefreshCw,
  DollarSign,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";

interface OverdueBook {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  copyId: string;
  copyNumber: string;
  borrowDate: string;
  dueDate: string;
  status: string;
  renewalCount: number;
  daysOverdue: number;
  createdAt: string;
}

interface OverdueStatistics {
  totalOverdueBooks: number;
  overdueBooks: OverdueBook[];
  totalUnpaidFines: number;
  usersWithOverdue: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    count: number;
  }>;
  averageDaysOverdue: number;
}

interface OverdueBookManagementProps {
  overdueBooks: OverdueBook[];
  statistics: OverdueStatistics | null;
}

const OverdueBookManagement = ({ 
  overdueBooks: initialOverdueBooks, 
  statistics 
}: OverdueBookManagementProps) => {
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>(initialOverdueBooks);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBook, setSelectedBook] = useState<OverdueBook | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredBooks = overdueBooks.filter(book =>
    book.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.copyNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReturnBook = async () => {
    if (!selectedBook) return;

    const result = await returnBook(selectedBook.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Book returned successfully",
      });
      
      // Remove the book from the local state
      setOverdueBooks(overdueBooks.filter(book => book.id !== selectedBook.id));
      
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

  const handleProcessOverdue = async () => {
    setIsProcessing(true);
    
    const result = await processOverdueBooks();

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  const handleSendReminders = async () => {
    const result = await sendOverdueReminders();

    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
      });
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getSeverityBadge = (daysOverdue: number) => {
    if (daysOverdue <= 7) {
      return <Badge variant="secondary">Recently Overdue</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="destructive">Severely Overdue</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.totalOverdueBooks}
                  </div>
                  <div className="text-sm text-gray-600">Overdue Books</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    ${statistics.totalUnpaidFines.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Unpaid Fines</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.usersWithOverdue.length}
                  </div>
                  <div className="text-sm text-gray-600">Users Affected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.averageDaysOverdue}
                  </div>
                  <div className="text-sm text-gray-600">Avg Days Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by user, book, or copy number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleProcessOverdue}
            disabled={isProcessing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            Process Overdue
          </Button>
          <Button
            variant="outline"
            onClick={handleSendReminders}
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
        </div>
      </div>

      {/* Overdue Books Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Overdue Books ({filteredBooks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Copy</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Fine Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.userName}</div>
                        <div className="text-sm text-gray-500">{book.userEmail}</div>
                        {book.userPhone && (
                          <div className="text-sm text-gray-500">{book.userPhone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{book.bookTitle}</div>
                        <div className="text-sm text-gray-500">{book.bookAuthor}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{book.copyNumber}</TableCell>
                    <TableCell>
                      {new Date(book.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">
                        {book.daysOverdue} days
                      </span>
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(book.daysOverdue)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        ${(book.daysOverdue * 1.00).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsReturnDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Return Book Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Overdue Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this overdue book as returned?
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="py-4">
              <p><strong>User:</strong> {selectedBook.userName}</p>
              <p><strong>Book:</strong> {selectedBook.bookTitle}</p>
              <p><strong>Copy:</strong> {selectedBook.copyNumber}</p>
              <p><strong>Due Date:</strong> {new Date(selectedBook.dueDate).toLocaleDateString()}</p>
              <p><strong>Days Overdue:</strong> <span className="text-red-600 font-semibold">{selectedBook.daysOverdue} days</span></p>
              <p><strong>Fine Amount:</strong> <span className="font-semibold">${(selectedBook.daysOverdue * 1.00).toFixed(2)}</span></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReturnBook}>
              Mark as Returned
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverdueBookManagement;

