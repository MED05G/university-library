"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search,
  Book,
  Calendar,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import Image from "next/image";

interface BorrowHistoryItem {
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
  createdAt: string;
}

interface UserBorrowHistoryProps {
  borrowHistory: BorrowHistoryItem[];
}

const UserBorrowHistory = ({ borrowHistory }: UserBorrowHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHistory = borrowHistory.filter(item =>
    item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bookAuthor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (item: BorrowHistoryItem) => {
    if (item.status === "returned") {
      return <Badge variant="default">Returned</Badge>;
    }
    if (item.status === "overdue") {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (item.status === "borrowed") {
      const isOverdue = new Date(item.dueDate) < new Date() && !item.returnDate;
      if (isOverdue) {
        return <Badge variant="destructive">Overdue</Badge>;
      }
      return <Badge variant="secondary">Currently Borrowed</Badge>;
    }
    return <Badge variant="outline">{item.status}</Badge>;
  };

  const isLateReturn = (dueDate: string, returnDate: string | null) => {
    if (!returnDate) return false;
    return new Date(returnDate) > new Date(dueDate);
  };

  if (borrowHistory.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Book className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No borrow history</h3>
          <p className="text-gray-600 text-center">
            You haven't borrowed any books yet. Start exploring our collection!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by book title or author..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Borrow History ({filteredHistory.length} records)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Copy</TableHead>
                  <TableHead>Borrow Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewals</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {item.bookCover && (
                          <Image
                            src={item.bookCover}
                            alt={item.bookTitle}
                            width={40}
                            height={50}
                            className="rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {item.bookTitle}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {item.bookAuthor}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.copyNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(item.borrowDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                        {isLateReturn(item.dueDate, item.returnDate) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" title="Returned late" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {item.returnDate ? (
                          <>
                            <span>{new Date(item.returnDate).toLocaleDateString()}</span>
                            {!isLateReturn(item.dueDate, item.returnDate) && (
                              <CheckCircle className="h-4 w-4 text-green-500" title="Returned on time" />
                            )}
                          </>
                        ) : (
                          <span className="text-gray-500">Not returned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.renewalCount}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {borrowHistory.length}
            </div>
            <div className="text-sm text-gray-600">Total Books Borrowed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {borrowHistory.filter(item => item.status === "returned").length}
            </div>
            <div className="text-sm text-gray-600">Books Returned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {borrowHistory.filter(item => 
                item.returnDate && isLateReturn(item.dueDate, item.returnDate)
              ).length}
            </div>
            <div className="text-sm text-gray-600">Late Returns</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {borrowHistory.reduce((sum, item) => sum + item.renewalCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Renewals</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserBorrowHistory;

