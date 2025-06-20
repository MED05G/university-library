import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { users, books, borrowRequests } from '@/database/schema';
import { eq, count, and, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get total users
    const totalUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.isDeleted, false));
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get active users
    const activeUsersResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(eq(users.accountStatus, 'active'), eq(users.isDeleted, false)));
    const activeUsers = activeUsersResult[0]?.count || 0;

    // Get total books
    const totalBooksResult = await db
      .select({ count: count() })
      .from(books)
      .where(eq(books.isDeleted, false));
    const totalBooks = totalBooksResult[0]?.count || 0;

    // Get available books (sum of available copies)
    const availableBooksResult = await db
      .select({ total: sql<number>`sum(${books.availableCopies})` })
      .from(books)
      .where(eq(books.isDeleted, false));
    const availableBooks = availableBooksResult[0]?.total || 0;

    // Get borrowed books (sum of total copies - available copies)
    const borrowedBooksResult = await db
      .select({ total: sql<number>`sum(${books.totalCopies} - ${books.availableCopies})` })
      .from(books)
      .where(eq(books.isDeleted, false));
    const borrowedBooks = borrowedBooksResult[0]?.total || 0;

    // Get overdue books
    const overdueBooksResult = await db
      .select({ count: count() })
      .from(borrowRequests)
      .where(eq(borrowRequests.status, 'overdue'));
    const overdueBooks = overdueBooksResult[0]?.count || 0;

    // Get pending requests
    const pendingRequestsResult = await db
      .select({ count: count() })
      .from(borrowRequests)
      .where(eq(borrowRequests.status, 'pending'));
    const pendingRequests = pendingRequestsResult[0]?.count || 0;

    // Get recent activity (simplified for now)
    const recentActivity = [
      {
        id: '1',
        type: 'borrow',
        description: 'Nouveau livre emprunté',
        timestamp: new Date().toISOString(),
        user: 'Utilisateur exemple'
      },
      {
        id: '2',
        type: 'user_registered',
        description: 'Nouvel utilisateur enregistré',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'Admin'
      },
      {
        id: '3',
        type: 'return',
        description: 'Livre retourné',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: 'Utilisateur exemple'
      }
    ];

    const dashboardStats = {
      totalUsers,
      activeUsers,
      totalBooks,
      availableBooks,
      borrowedBooks,
      overdueBooks,
      pendingRequests,
      recentActivity
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

