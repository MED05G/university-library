import { books, bookCopies } from "@/database/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { config } from "dotenv";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

const populateBookCopies = async () => {
  console.log("Populating book copies...");

  try {
    // Get all books from the database
    const allBooks = await db.select().from(books);

    for (const book of allBooks) {
      // Check if book copies already exist for this book
      const existingCopies = await db
        .select()
        .from(bookCopies)
        .where(eq(bookCopies.bookId, book.id));

      if (existingCopies.length === 0) {
        // Create book copies for each book
        const totalCopies = book.totalCopies;

        for (let i = 1; i <= totalCopies; i++) {
          await db.insert(bookCopies).values({
            bookId: book.id,
            copyNumber: `${book.title.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
            barcode: `${book.id}-${String(i).padStart(3, '0')}`,
            status: 'available',
            conditionRating: 'good',
          });
        }

        console.log(`Created ${totalCopies} copies for book: ${book.title}`);
      } else {
        console.log(`Book copies already exist for: ${book.title}`);
      }
    }

    console.log("Book copies populated successfully!");
  } catch (error) {
    console.error("Error populating book copies:", error);
  }
};

populateBookCopies();

