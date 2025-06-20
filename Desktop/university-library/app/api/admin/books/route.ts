import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, publishers, authors, subjects, bookAuthors, bookSubjects } from "@/database/schema";
import { eq, ilike, or, and, sql } from "drizzle-orm";

// GET - Fetch all books with relationships
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const language = searchParams.get("language");
    const availability = searchParams.get("availability");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Base query with joins
    let query = db
      .select({
        id: books.id,
        title: books.title,
        subtitle: books.subtitle,
        isbn13: books.isbn13,
        isbn10: books.isbn10,
        publisherId: books.publisherId,
        publicationYear: books.publicationYear,
        edition: books.edition,
        pages: books.pages,
        language: books.language,
        description: books.description,
        shelfLocation: books.shelfLocation,
        totalCopies: books.totalCopies,
        availableCopies: books.availableCopies,
        coverUrl: books.coverUrl,
        coverColor: books.coverColor,
        createdAt: books.createdAt,
        publisher: {
          name: publishers.name
        }
      })
      .from(books)
      .leftJoin(publishers, eq(books.publisherId, publishers.id))
      .where(eq(books.isDeleted, false));

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(books.title, `%${search}%`),
          ilike(books.isbn13, `%${search}%`),
          ilike(books.isbn10, `%${search}%`)
        )
      );
    }

    if (language && language !== "all") {
      conditions.push(eq(books.language, language));
    }

    if (availability === "available") {
      conditions.push(sql`${books.availableCopies} > 0`);
    } else if (availability === "unavailable") {
      conditions.push(eq(books.availableCopies, 0));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allBooks = await query
      .limit(limit)
      .offset(offset)
      .orderBy(books.createdAt);

    // Fetch authors and subjects for each book
    const booksWithRelations = await Promise.all(
      allBooks.map(async (book) => {
        // Get authors
        const bookAuthorsData = await db
          .select({
            fullName: authors.fullName
          })
          .from(bookAuthors)
          .leftJoin(authors, eq(bookAuthors.authorId, authors.id))
          .where(eq(bookAuthors.bookId, book.id))
          .orderBy(bookAuthors.authorOrder);

        // Get subjects
        const bookSubjectsData = await db
          .select({
            name: subjects.name
          })
          .from(bookSubjects)
          .leftJoin(subjects, eq(bookSubjects.subjectId, subjects.id))
          .where(eq(bookSubjects.bookId, book.id));

        return {
          ...book,
          authors: bookAuthorsData,
          subjects: bookSubjectsData
        };
      })
    );

    return NextResponse.json(booksWithRelations);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des livres" },
      { status: 500 }
    );
  }
}

// POST - Create a new book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      subtitle,
      isbn13,
      isbn10,
      publisherId,
      publicationYear,
      edition,
      pages,
      language,
      description,
      shelfLocation,
      totalCopies,
      coverColor,
      authorIds,
      subjectIds
    } = body;

    // Validate required fields
    if (!title || !publisherId || !publicationYear || !shelfLocation) {
      return NextResponse.json(
        { error: "Les champs titre, éditeur, année de publication et emplacement sont requis" },
        { status: 400 }
      );
    }

    // Check if ISBN already exists
    if (isbn13) {
      const existingIsbn13 = await db
        .select()
        .from(books)
        .where(and(eq(books.isbn13, isbn13), eq(books.isDeleted, false)))
        .limit(1);

      if (existingIsbn13.length > 0) {
        return NextResponse.json(
          { error: "Un livre avec cet ISBN-13 existe déjà" },
          { status: 400 }
        );
      }
    }

    if (isbn10) {
      const existingIsbn10 = await db
        .select()
        .from(books)
        .where(and(eq(books.isbn10, isbn10), eq(books.isDeleted, false)))
        .limit(1);

      if (existingIsbn10.length > 0) {
        return NextResponse.json(
          { error: "Un livre avec cet ISBN-10 existe déjà" },
          { status: 400 }
        );
      }
    }

    // Create book
    const newBook = await db
      .insert(books)
      .values({
        title,
        subtitle: subtitle || null,
        isbn13: isbn13 || null,
        isbn10: isbn10 || null,
        publisherId,
        publicationYear,
        edition: edition || null,
        pages: pages || null,
        language: language || "English",
        description: description || null,
        shelfLocation,
        totalCopies: totalCopies || 1,
        availableCopies: totalCopies || 1,
        coverColor: coverColor || "#3B82F6"
      })
      .returning();

    const bookId = newBook[0].id;

    // Add authors if provided
    if (authorIds && authorIds.length > 0) {
      const authorRelations = authorIds.map((authorId: string, index: number) => ({
        bookId,
        authorId,
        authorOrder: index + 1
      }));

      await db.insert(bookAuthors).values(authorRelations);
    }

    // Add subjects if provided
    if (subjectIds && subjectIds.length > 0) {
      const subjectRelations = subjectIds.map((subjectId: string) => ({
        bookId,
        subjectId
      }));

      await db.insert(bookSubjects).values(subjectRelations);
    }

    return NextResponse.json(newBook[0], { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du livre" },
      { status: 500 }
    );
  }
}
