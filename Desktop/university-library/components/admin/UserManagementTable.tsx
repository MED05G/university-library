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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateUser, deleteUser, searchUsers } from "@/lib/actions/user";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Search } from "lucide-react";

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  accountStatus: string;
  maxBooksAllowed: number;
  enrollmentDate: string | null;
  createdAt: string;
}

interface UserManagementTableProps {
  users: User[];
}

const UserManagementTable = ({ users: initialUsers }: UserManagementTableProps) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setUsers(initialUsers);
    } else {
      const result = await searchUsers(term);
      if (result.success) {
        setUsers(result.data);
      }
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser({ ...user });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const result = await updateUser({
      userId: editingUser.id,
      fullName: editingUser.fullName,
      email: editingUser.email,
      role: editingUser.role,
      accountStatus: editingUser.accountStatus,
      maxBooksAllowed: editingUser.maxBooksAllowed,
    });

    if (result.success) {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, ...editingUser } : user
      ));
      
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userToDelete.id));
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
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
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "suspended":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "librarian":
        return "default";
      case "faculty":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search users by name, email, or role..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Max Books</TableHead>
              <TableHead>Enrollment Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(user.accountStatus)}>
                    {user.accountStatus}
                  </Badge>
                </TableCell>
                <TableCell>{user.maxBooksAllowed}</TableCell>
                <TableCell>
                  {user.enrollmentDate 
                    ? new Date(user.enrollmentDate).toLocaleDateString()
                    : "N/A"
                  }
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information here.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Name
                </Label>
                <Input
                  id="fullName"
                  value={editingUser.fullName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, fullName: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, role: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="accountStatus" className="text-right">
                  Status
                </Label>
                <Select
                  value={editingUser.accountStatus}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, accountStatus: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
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
                  value={editingUser.maxBooksAllowed}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      maxBooksAllowed: parseInt(e.target.value) || 0,
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateUser}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="py-4">
              <p><strong>Name:</strong> {userToDelete.fullName}</p>
              <p><strong>Email:</strong> {userToDelete.email}</p>
              <p><strong>Role:</strong> {userToDelete.role}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTable;

