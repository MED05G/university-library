import React from "react";
import { getAllBorrowRequests } from "@/lib/actions/borrow";
import BorrowRequestManagementTable from "@/components/admin/BorrowRequestManagementTable";

const BorrowRequestsPage = async () => {
  const result = await getAllBorrowRequests();
  const borrowRequests = result.success ? result.data : [];

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Borrow Requests</h1>
        <p>Manage all book borrowing requests</p>
      </div>
      
      <div className="admin-table">
        <BorrowRequestManagementTable borrowRequests={borrowRequests} />
      </div>
    </div>
  );
};

export default BorrowRequestsPage;
