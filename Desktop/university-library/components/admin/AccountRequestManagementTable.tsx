"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { approveAccountRequest, rejectAccountRequest } from "@/lib/actions/account-request";
import { toast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Eye,
  Search,
  ExternalLink
} from "lucide-react";
import { useSession } from "next-auth/react";

interface AccountRequest {
  id: string;
  fullName: string;
  email: string;
  studentId: string | null;
  phone: string | null;
  address: string | null;
  departmentId: string | null;
  departmentName: string | null;
  universityCardUrl: string | null;
  requestDate: string;
  status: string;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface AccountRequestManagementTableProps {
  accountRequests: AccountRequest[];
}

const AccountRequestManagementTable = ({ 
  accountRequests: initialAccountRequests 
}: AccountRequestManagementTableProps) => {
  const { data: session } = useSession();
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>(initialAccountRequests);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [maxBooksAllowed, setMaxBooksAllowed] = useState(5);
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const filteredRequests = accountRequests.filter(request => {
    const matchesSearch = 
      request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.studentId && request.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.departmentName && request.departmentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = (() => {
      switch (activeTab) {
        case "pending":
          return request.status === "pending";
        case "approved":
          return request.status === "approved";
        case "rejected":
          return request.status === "rejected";
        default:
          return true;
      }
    })();

    return matchesSearch && matchesTab;
  });

  const handleApproveRequest = async () => {
    if (!selectedRequest || !session?.user?.id || !password) return;

    const result = await approveAccountRequest({
      requestId: selectedRequest.id,
      reviewerId: session.user.id,
      password: password,
      role: role,
      maxBooksAllowed: maxBooksAllowed,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Account request approved and user created successfully",
      });
      
      // Update the request in the local state
      setAccountRequests(accountRequests.map(request => 
        request.id === selectedRequest.id 
          ? { 
              ...request, 
              status: "approved", 
              reviewedBy: session.user.id,
              reviewerName: session.user.name || "Unknown",
              reviewedAt: new Date().toISOString()
            }
          : request
      ));
      
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      setPassword("");
      setRole("student");
      setMaxBooksAllowed(5);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest || !session?.user?.id || !rejectionReason) return;

    const result = await rejectAccountRequest({
      requestId: selectedRequest.id,
      reviewerId: session.user.id,
      rejectionReason: rejectionReason,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "Account request rejected successfully",
      });
      
      // Update the request in the local state
      setAccountRequests(accountRequests.map(request => 
        request.id === selectedRequest.id 
          ? { 
              ...request, 
              status: "rejected", 
              reviewedBy: session.user.id,
              reviewerName: session.user.name || "Unknown",
              reviewedAt: new Date().toISOString(),
              rejectionReason: rejectionReason
            }
          : request
      ));
      
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, email, student ID, or department..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.fullName}</TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>{request.studentId || "N/A"}</TableCell>
                    <TableCell>{request.departmentName || "N/A"}</TableCell>
                    <TableCell>
                      {new Date(request.requestDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.reviewerName || "Not reviewed"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsViewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsApproveDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setIsRejectDialogOpen(true);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
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

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Account Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Full Name</Label>
                  <p>{selectedRequest.fullName}</p>
                </div>
                <div>
                  <Label className="font-semibold">Email</Label>
                  <p>{selectedRequest.email}</p>
                </div>
                <div>
                  <Label className="font-semibold">Student ID</Label>
                  <p>{selectedRequest.studentId || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Phone</Label>
                  <p>{selectedRequest.phone || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-semibold">Address</Label>
                  <p>{selectedRequest.address || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Department</Label>
                  <p>{selectedRequest.departmentName || "N/A"}</p>
                </div>
                <div>
                  <Label className="font-semibold">Request Date</Label>
                  <p>{new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                {selectedRequest.reviewerName && (
                  <div>
                    <Label className="font-semibold">Reviewed By</Label>
                    <p>{selectedRequest.reviewerName}</p>
                  </div>
                )}
                {selectedRequest.rejectionReason && (
                  <div className="col-span-2">
                    <Label className="font-semibold">Rejection Reason</Label>
                    <p>{selectedRequest.rejectionReason}</p>
                  </div>
                )}
                {selectedRequest.universityCardUrl && (
                  <div className="col-span-2">
                    <Label className="font-semibold">University Card</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedRequest.universityCardUrl!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View University Card
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Request Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Account Request</DialogTitle>
            <DialogDescription>
              Create a new user account for this request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p><strong>Name:</strong> {selectedRequest.fullName}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Student ID:</strong> {selectedRequest.studentId || "N/A"}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter initial password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxBooks" className="text-right">
                  Max Books
                </Label>
                <Input
                  id="maxBooks"
                  type="number"
                  value={maxBooksAllowed}
                  onChange={(e) => setMaxBooksAllowed(parseInt(e.target.value) || 5)}
                  className="col-span-3"
                  min="1"
                  max="20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveRequest} disabled={!password}>
              Approve & Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Account Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p><strong>Name:</strong> {selectedRequest.fullName}</p>
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p><strong>Student ID:</strong> {selectedRequest.studentId || "N/A"}</p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rejectionReason" className="text-right">
                  Reason
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter reason for rejection..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectRequest} 
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountRequestManagementTable;

