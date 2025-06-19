import dummyBooks from "../dummybooks.json";
import ImageKit from "imagekit";
import { books, bookCopies, authors, publishers } from "@/database/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";

config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql });

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
});

const uploadToImageKit = async (
  url: string,
  fileName: string,
  folder: string,
) => {
  try {
    const response = await imagekit.upload({
      file: url,
      fileName,
      folder,
    });

    return response.filePath;
  } catch (error) {
    console.error("Error uploading image to ImageKit:", error);
    return url; // Return original URL if upload fails
  }
};

const seed = async () => {
  console.log("Seeding data...");

  try {
    // First, create default publisher and author if they don't exist
    const defaultPublisher = await db.insert(publishers).values({
      name: "Default Publisher",
      address: "123 Main St",
      city: "New York",
      country: "USA",
      establishedYear: 2000,
    }).onConflictDoNothing().returning();

    const defaultAuthor = await db.insert(authors).values({
      fullName: "Default Author",
      nationality: "USA",
    }).onConflictDoNothing().returning();

    for (const book of dummyBooks) {
      const coverUrl = (await uploadToImageKit(
        book.coverUrl,
        `${book.title}.jpg`,
        "/books/covers",
      )) as string;

      const videoUrl = (await uploadToImageKit(
        book.videoUrl,
        `${book.title}.mp4`,
        "/books/videos",
      )) as string;

      // Insert book with required fields
      const insertedBook = await db.insert(books).values({
        id: book.id,
        title: book.title,
        publisherId: defaultPublisher[0]?.id || "default-publisher-id",
        publicationYear: 2023,
        shelfLocation: `A-${Math.floor(Math.random() * 100)}`,
        language: "English",
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        description: book.description,
        summary: book.summary,
        coverUrl,
        videoUrl,
        coverColor: book.coverColor,
      }).onConflictDoNothing().returning();

      // Create book copies for each book
      if (insertedBook.length > 0) {
        const bookId = insertedBook[0].id;
        const totalCopies = book.totalCopies;

        for (let i = 1; i <= totalCopies; i++) {
          await db.insert(bookCopies).values({
            bookId: bookId,
            copyNumber: `${book.title.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`,
            barcode: `${bookId}-${String(i).padStart(3, '0')}`,
            status: 'available',
            conditionRating: 'good',
          }).onConflictDoNothing();
        }
      }
    }

    console.log("Data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};

seed();

