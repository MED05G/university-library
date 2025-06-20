import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { books, publishers, authors, subjects, bookAuthors, bookSubjects } from "@/database/schema";
import { eq, and } from "drizzle-orm";

// GET - Fetch a specific book
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    const book = await db
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
      .where(and(eq(books.id, bookId), eq(books.isDeleted, false)))
      .limit(1);

    if (book.length === 0) {
      return NextResponse.json(
        { error: "Livre non trouvé" },
        { status: 404 }
      );
    }

    // Get authors
    const bookAuthorsData = await db
      .select({
        fullName: authors.fullName
      })
      .from(bookAuthors)
      .leftJoin(authors, eq(bookAuthors.authorId, authors.id))
      .where(eq(bookAuthors.bookId, bookId))
      .orderBy(bookAuthors.authorOrder);

    // Get subjects
    const bookSubjectsData = await db
      .select({
        name: subjects.name
      })
      .from(bookSubjects)
      .leftJoin(subjects, eq(bookSubjects.subjectId, subjects.id))
      .where(eq(bookSubjects.bookId, bookId));

    const bookWithRelations = {
      ...book[0],
      authors: bookAuthorsData,
      subjects: bookSubjectsData
    };

    return NextResponse.json(bookWithRelations);
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du livre" },
      { status: 500 }
    );
  }
}

// PUT - Update a book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;
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
      availableCopies,
      coverColor,
      authorIds,
      subjectIds
    } = body;

    // Check if book exists
    const existingBook = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.isDeleted, false)))
      .limit(1);

    if (existingBook.length === 0) {
      return NextResponse.json(
        { error: "Livre non trouvé" },
        { status: 404 }
      );
    }

    // Check if ISBN is being changed and if it already exists
    if (isbn13 && isbn13 !== existingBook[0].isbn13) {
      const isbn13Exists = await db
        .select()
        .from(books)
        .where(and(eq(books.isbn13, isbn13), eq(books.isDeleted, false)))
        .limit(1);

      if (isbn13Exists.length > 0) {
        return NextResponse.json(
          { error: "Un livre avec cet ISBN-13 existe déjà" },
          { status: 400 }
        );
      }
    }

    if (isbn10 && isbn10 !== existingBook[0].isbn10) {
      const isbn10Exists = await db
        .select()
        .from(books)
        .where(and(eq(books.isbn10, isbn10), eq(books.isDeleted, false)))
        .limit(1);

      if (isbn10Exists.length > 0) {
        return NextResponse.json(
          { error: "Un livre avec cet ISBN-10 existe déjà" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle || null;
    if (isbn13 !== undefined) updateData.isbn13 = isbn13 || null;
    if (isbn10 !== undefined) updateData.isbn10 = isbn10 || null;
    if (publisherId) updateData.publisherId = publisherId;
    if (publicationYear) updateData.publicationYear = publicationYear;
    if (edition !== undefined) updateData.edition = edition || null;
    if (pages !== undefined) updateData.pages = pages || null;
    if (language) updateData.language = language;
    if (description !== undefined) updateData.description = description || null;
    if (shelfLocation) updateData.shelfLocation = shelfLocation;
    if (totalCopies !== undefined) updateData.totalCopies = totalCopies;
    if (availableCopies !== undefined) updateData.availableCopies = availableCopies;
    if (coverColor) updateData.coverColor = coverColor;

    // Update book
    const updatedBook = await db
      .update(books)
      .set(updateData)
      .where(eq(books.id, bookId))
      .returning();

    // Update authors if provided
    if (authorIds !== undefined) {
      // Remove existing author relations
      await db.delete(bookAuthors).where(eq(bookAuthors.bookId, bookId));

      // Add new author relations
      if (authorIds.length > 0) {
        const authorRelations = authorIds.map((authorId: string, index: number) => ({
          bookId,
          authorId,
          authorOrder: index + 1
        }));

        await db.insert(bookAuthors).values(authorRelations);
      }
    }

    // Update subjects if provided
    if (subjectIds !== undefined) {
      // Remove existing subject relations
      await db.delete(bookSubjects).where(eq(bookSubjects.bookId, bookId));

      // Add new subject relations
      if (subjectIds.length > 0) {
        const subjectRelations = subjectIds.map((subjectId: string) => ({
          bookId,
          subjectId
        }));

        await db.insert(bookSubjects).values(subjectRelations);
      }
    }

    return NextResponse.json(updatedBook[0]);
  } catch (error) {
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du livre" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id;

    // Check if book exists
    const existingBook = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.isDeleted, false)))
      .limit(1);

    if (existingBook.length === 0) {
      return NextResponse.json(
        { error: "Livre non trouvé" },
        { status: 404 }
      );
    }

    // Soft delete book
    await db
      .update(books)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(books.id, bookId));

    return NextResponse.json({ message: "Livre supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du livre" },
      { status: 500 }
    );
  }
}
