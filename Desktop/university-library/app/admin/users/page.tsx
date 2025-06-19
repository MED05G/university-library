import React from "react";
import { getAllUsers } from "@/lib/actions/user";
import UserManagementTable from "@/components/admin/UserManagementTable";

const UsersPage = async () => {
  const result = await getAllUsers();
  const users = result.success ? result.data : [];

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>All Users</h1>
        <p>Manage all registered users</p>
      </div>
      
      <div className="admin-table">
        <UserManagementTable users={users} />
      </div>
    </div>
  );
};

export default UsersPage;
