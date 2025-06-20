import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { authors } from "@/database/schema";
import { eq, ilike, or } from "drizzle-orm";

// GET - Fetch all authors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(authors);

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          ilike(authors.fullName, `%${search}%`),
          ilike(authors.nationality, `%${search}%`)
        )
      );
    }

    const allAuthors = await query
      .limit(limit)
      .offset(offset)
      .orderBy(authors.fullName);

    return NextResponse.json(allAuthors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des auteurs" },
      { status: 500 }
    );
  }
}

// POST - Create a new author
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      birthDate,
      deathDate,
      nationality,
      biography
    } = body;

    // Validate required fields
    if (!fullName) {
      return NextResponse.json(
        { error: "Le nom de l\"auteur est requis" },
        { status: 400 }
      );
    }

    // Create author
    const newAuthor = await db
      .insert(authors)
      .values({
        fullName,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        nationality: nationality || null,
        biography: biography || null
      })
      .returning();

    return NextResponse.json(newAuthor[0], { status: 201 });
  } catch (error) {
    console.error("Error creating author:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l\"auteur" },
      { status: 500 }
    );
  }
}
