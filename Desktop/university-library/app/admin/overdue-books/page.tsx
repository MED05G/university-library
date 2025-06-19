import React from "react";
import { getOverdueBooksForAdmin, getOverdueStatistics } from "@/lib/actions/overdue";
import OverdueBookManagement from "@/components/admin/OverdueBookManagement";

const OverdueBooksPage = async () => {
  const [overdueResult, statsResult] = await Promise.all([
    getOverdueBooksForAdmin(),
    getOverdueStatistics(),
  ]);

  const overdueBooks = overdueResult.success ? overdueResult.data : [];
  const statistics = statsResult.success ? statsResult.data : null;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1>Overdue Books</h1>
        <p>Monitor and manage overdue book returns</p>
      </div>
      
      <div className="admin-table">
        <OverdueBookManagement 
          overdueBooks={overdueBooks} 
          statistics={statistics}
        />
      </div>
    </div>
  );
};

export default OverdueBooksPage;
