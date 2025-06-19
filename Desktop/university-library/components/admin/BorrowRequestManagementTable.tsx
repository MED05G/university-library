"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { returnBook, renewBook, markAsOverdue } from "@/lib/actions/borrow";
import { toast } from "@/hooks/use-toast";
import { 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Search,
  Filter
} from "lucide-react";

interface BorrowRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  copyId: string;
  copyNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  renewalCount: number;
  createdAt: string;
}

interface BorrowRequestManagementTableProps {
  borrowRequests: BorrowRequest[];
}

const BorrowRequestManagementTable = ({ 
  borrowRequests: initialBorrowRequests 
}: BorrowRequestManagementTableProps) => {
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>(initialBorrowRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredRequests = borrowRequests.filter(request => {
    const matchesSearch = 
      request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.copyNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = (() => {
      switch (activeTab) {
        case "active":
          return request.status === "borrowed" || request.status === "overdue";
        case "overdue":
          return request.status === "overdue" || 
                 (request.status === "borrowed" && 
                  new Date(request.dueDate) < new Date() && 
                  !request.returnDate);
        case "returned":
          return request.status === "returned";
        default:
          return true;
      }
    })();

    return matchesSearch && matchesTab;
  });

  const handleReturnBook = async () => {
    if (!selectedRequest) return;

    const result = await returnBook(selectedRequest.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Book returned successfully",
      });
      
      // Update the request in the local state
      setBorrowRequests(borrowRequests.map(request => 
        request.id === selectedRequest.id 
          ? { ...request, status: "returned", returnDate: new Date().toISOString() }
          : request
      ));
      
      setIsReturnDialogOpen(false);
      setSelectedRequest(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleRenewBook = async () => {
    if (!selectedRequest || !newDueDate) return;

    const result = await renewBook(selectedRequest.id, new Date(newDueDate));

    if (result.success) {
      toast({
        title: "Success",
        description: "Book renewed successfully",
      });
      
      // Update the request in the local state
      setBorrowRequests(borrowRequests.map(request => 
        request.id === selectedRequest.id 
          ? { 
              ...request, 
              dueDate: newDueDate, 
              renewalCount: request.renewalCount + 1,
              status: "borrowed"
            }
          : request
      ));
      
      setIsRenewDialogOpen(false);
      setSelectedRequest(null);
      setNewDueDate("");
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleMarkOverdue = async (request: BorrowRequest) => {
    const result = await markAsOverdue(request.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "Book marked as overdue",
      });
      
      // Update the request in the local state
      setBorrowRequests(borrowRequests.map(req => 
        req.id === request.id ? { ...req, status: "overdue" } : req
      ));
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string, dueDate: string, returnDate: string | null) => {
    if (status === "returned") return "default";
    if (status === "overdue") return "destructive";
    
    // Check if borrowed book is overdue
    if (status === "borrowed" && !returnDate && new Date(dueDate) < new Date()) {
      return "destructive";
    }
    
    if (status === "borrowed") return "secondary";
    return "outline";
  };

  const getStatusText = (status: string, dueDate: string, returnDate: string | null) => {
    if (status === "returned") return "Returned";
    if (status === "overdue") return "Overdue";
    
    // Check if borrowed book is overdue
    if (status === "borrowed" && !returnDate && new Date(dueDate) < new Date()) {
      return "Overdue";
    }
    
    if (status === "borrowed") return "Borrowed";
    return status;
  };

  const isOverdue = (dueDate: string, returnDate: string | null, status: string) => {
    return !returnDate && status === "borrowed" && new Date(dueDate) < new Date();
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-4">
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="returned">Returned</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Book</TableHead>
                  <TableHead>Copy</TableHead>
                  <TableHead>Borrow Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Renewals</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.userName}</div>
                        <div className="text-sm text-gray-500">{request.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.bookTitle}</div>
                        <div className="text-sm text-gray-500">{request.bookAuthor}</div>
                      </div>
                    </TableCell>
                    <TableCell>{request.copyNumber}</TableCell>
                    <TableCell>
                      {new Date(request.borrowDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <span>{new Date(request.dueDate).toLocaleDateString()}</span>
                        {isOverdue(request.dueDate, request.returnDate, request.status) && (
                          <span className="text-red-500 text-xs">
                            ({getDaysOverdue(request.dueDate)} days overdue)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.returnDate 
                        ? new Date(request.returnDate).toLocaleDateString()
                        : "Not returned"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status, request.dueDate, request.returnDate)}>
                        {getStatusText(request.status, request.dueDate, request.returnDate)}
                      </Badge>
                    </TableCell>
                    <TableCell>{request.renewalCount}/2</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {!request.returnDate && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsReturnDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            {request.renewalCount < 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setNewDueDate(
                                    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                                      .toISOString()
                                      .split('T')[0]
                                  );
                                  setIsRenewDialogOpen(true);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {isOverdue(request.dueDate, request.returnDate, request.status) && 
                             request.status !== "overdue" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkOverdue(request)}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Return Book Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this book as returned?
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4">
              <p><strong>User:</strong> {selectedRequest.userName}</p>
              <p><strong>Book:</strong> {selectedRequest.bookTitle}</p>
              <p><strong>Copy:</strong> {selectedRequest.copyNumber}</p>
              <p><strong>Due Date:</strong> {new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
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

      {/* Renew Book Dialog */}
      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Book</DialogTitle>
            <DialogDescription>
              Set a new due date for this book.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p><strong>User:</strong> {selectedRequest.userName}</p>
                <p><strong>Book:</strong> {selectedRequest.bookTitle}</p>
                <p><strong>Copy:</strong> {selectedRequest.copyNumber}</p>
                <p><strong>Current Due Date:</strong> {new Date(selectedRequest.dueDate).toLocaleDateString()}</p>
                <p><strong>Renewals Used:</strong> {selectedRequest.renewalCount}/2</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newDueDate" className="text-right">
                  New Due Date
                </Label>
                <Input
                  id="newDueDate"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="col-span-3"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenewBook} disabled={!newDueDate}>
              Renew Book
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowRequestManagementTable;

