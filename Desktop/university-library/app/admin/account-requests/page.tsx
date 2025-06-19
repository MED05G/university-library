import React from "react";
import { getAllAccountRequests } from "@/lib/actions/account-request";
import AccountRequestManagementTable from "@/components/admin/AccountRequestManagementTable";

const AccountRequestsPage = async () => {
  const result = await getAllAccountRequests();
  const accountRequests = result.success ? result.data : [];

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Account Requests</h1>
        <p>Manage new account registration requests</p>
      </div>
      
      <div className="admin-table">
        <AccountRequestManagementTable accountRequests={accountRequests} />
      </div>
    </div>
  );
};

export default AccountRequestsPage;
