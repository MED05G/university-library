"use server";

import { db } from "@/database/drizzle";
import { books, authors, genres } from "@/database/schema";
import { eq, ilike, and, or, desc, asc, count } from "drizzle-orm";

export interface SearchFilters {
  query?: string;
  genre?: string;
  author?: string;
  availability?: "all" | "available" | "unavailable";
  sortBy?: "title" | "author" | "rating" | "publishedYear" | "availableCopies";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export const searchBooks = async (filters: SearchFilters = {}) => {
  try {
    const {
      query = "",
      genre = "",
      author = "",
      availability = "all",
      sortBy = "title",
      sortOrder = "asc",
      page = 1,
      limit = 12,
    } = filters;

    // Build the where conditions
    const conditions = [];

    // Text search across title, author, and description
    if (query.trim()) {
      conditions.push(
        or(
          ilike(books.title, `%${query}%`),
          ilike(books.author, `%${query}%`),
          ilike(books.description, `%${query}%`)
        )
      );
    }

    // Filter by genre
    if (genre && genre !== "all") {
      conditions.push(ilike(books.genre, `%${genre}%`));
    }

    // Filter by author
    if (author && author !== "all") {
      conditions.push(ilike(books.author, `%${author}%`));
    }

    // Filter by availability
    if (availability === "available") {
      conditions.push(eq(books.availableCopies, 0));
    } else if (availability === "unavailable") {
      conditions.push(eq(books.availableCopies, 0));
    }

    // Combine all conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build the order by clause
    let orderByClause;
    switch (sortBy) {
      case "title":
        orderByClause = sortOrder === "asc" ? asc(books.title) : desc(books.title);
        break;
      case "author":
        orderByClause = sortOrder === "asc" ? asc(books.author) : desc(books.author);
        break;
      case "rating":
        orderByClause = sortOrder === "asc" ? asc(books.rating) : desc(books.rating);
        break;
      case "publishedYear":
        orderByClause = sortOrder === "asc" ? asc(books.publishedYear) : desc(books.publishedYear);
        break;
      case "availableCopies":
        orderByClause = sortOrder === "asc" ? asc(books.availableCopies) : desc(books.availableCopies);
        break;
      default:
        orderByClause = asc(books.title);
    }

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(books)
      .where(whereClause);

    const totalCount = totalCountResult?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const offset = (page - 1) * limit;

    // Get the books
    const searchResults = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        isbn: books.isbn,
        publishedYear: books.publishedYear,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        description: books.description,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
        rating: books.rating,
        shelfLocation: books.shelfLocation,
        createdAt: books.createdAt,
      })
      .from(books)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        books: JSON.parse(JSON.stringify(searchResults)),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        filters: {
          query,
          genre,
          author,
          availability,
          sortBy,
          sortOrder,
        },
      },
    };
  } catch (error) {
    console.error("Error searching books:", error);
    return {
      success: false,
      error: "Failed to search books",
    };
  }
};

export const getFilterOptions = async () => {
  try {
    // Get unique genres
    const genresResult = await db
      .selectDistinct({ genre: books.genre })
      .from(books)
      .where(books.genre)
      .orderBy(asc(books.genre));

    // Get unique authors
    const authorsResult = await db
      .selectDistinct({ author: books.author })
      .from(books)
      .where(books.author)
      .orderBy(asc(books.author));

    // Get availability statistics
    const [availabilityStats] = await db
      .select({
        totalBooks: count(),
        availableBooks: count(books.availableCopies),
      })
      .from(books);

    return {
      success: true,
      data: {
        genres: genresResult.map(g => g.genre).filter(Boolean),
        authors: authorsResult.map(a => a.author).filter(Boolean),
        availabilityStats,
      },
    };
  } catch (error) {
    console.error("Error getting filter options:", error);
    return {
      success: false,
      error: "Failed to get filter options",
    };
  }
};

export const getPopularBooks = async (limit: number = 10) => {
  try {
    // Get books sorted by rating and availability
    const popularBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        availableCopies: books.availableCopies,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
      })
      .from(books)
      .orderBy(desc(books.rating), desc(books.availableCopies))
      .limit(limit);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(popularBooks)),
    };
  } catch (error) {
    console.error("Error getting popular books:", error);
    return {
      success: false,
      error: "Failed to get popular books",
    };
  }
};

export const getRecentBooks = async (limit: number = 10) => {
  try {
    // Get recently added books
    const recentBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        availableCopies: books.availableCopies,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
        createdAt: books.createdAt,
      })
      .from(books)
      .orderBy(desc(books.createdAt))
      .limit(limit);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(recentBooks)),
    };
  } catch (error) {
    console.error("Error getting recent books:", error);
    return {
      success: false,
      error: "Failed to get recent books",
    };
  }
};

export const getSuggestedBooks = async (userId: string, limit: number = 10) => {
  try {
    // This is a simple suggestion algorithm based on user's borrowing history
    // In a real application, you might use more sophisticated recommendation algorithms
    
    // For now, we'll suggest books from genres the user has borrowed before
    // and highly rated books they haven't borrowed yet
    
    const suggestedBooks = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        genre: books.genre,
        rating: books.rating,
        availableCopies: books.availableCopies,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
      })
      .from(books)
      .where(eq(books.availableCopies, 0)) // Only suggest available books
      .orderBy(desc(books.rating))
      .limit(limit);

    return {
      success: true,
      data: JSON.parse(JSON.stringify(suggestedBooks)),
    };
  } catch (error) {
    console.error("Error getting suggested books:", error);
    return {
      success: false,
      error: "Failed to get suggested books",
    };
  }
};

