import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserBorrowedBooks, getUserBorrowHistory } from "@/lib/actions/user-books";
import { getUserReservations } from "@/lib/actions/reservation";
import UserBorrowedBooks from "@/components/UserBorrowedBooks";
import UserBorrowHistory from "@/components/UserBorrowHistory";
import UserReservations from "@/components/UserReservations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MyProfilePage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [borrowedBooksResult, borrowHistoryResult, reservationsResult] = await Promise.all([
    getUserBorrowedBooks(session.user.id),
    getUserBorrowHistory(session.user.id),
    getUserReservations(session.user.id),
  ]);

  const borrowedBooks = borrowedBooksResult.success ? borrowedBooksResult.data : [];
  const borrowHistory = borrowHistoryResult.success ? borrowHistoryResult.data : [];
  const reservations = reservationsResult.success ? reservationsResult.data : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your borrowed books, reservations, and view your reading history</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <p className="mt-1 text-sm text-gray-900">{session.user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{session.user.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="borrowed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="borrowed">
            Currently Borrowed ({borrowedBooks.length})
          </TabsTrigger>
          <TabsTrigger value="reservations">
            Reservations ({reservations.filter(r => r.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Borrow History ({borrowHistory.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="borrowed" className="mt-6">
          <UserBorrowedBooks borrowedBooks={borrowedBooks} />
        </TabsContent>
        
        <TabsContent value="reservations" className="mt-6">
          <UserReservations reservations={reservations} />
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <UserBorrowHistory borrowHistory={borrowHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProfilePage;
