import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { publishers } from "@/database/schema";
import { eq, ilike, or, and } from "drizzle-orm";

// GET - Fetch all publishers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(publishers);

    // Apply search filter
    if (search) {
      query = query.where(
        or(
          ilike(publishers.name, `%${search}%`),
          ilike(publishers.city, `%${search}%`),
          ilike(publishers.country, `%${search}%`)
        )
      );
    }

    const allPublishers = await query
      .limit(limit)
      .offset(offset)
      .orderBy(publishers.name);

    return NextResponse.json(allPublishers);
  } catch (error) {
    console.error("Error fetching publishers:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des éditeurs" },
      { status: 500 }
    );
  }
}

// POST - Create a new publisher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      address,
      city,
      country,
      website,
      establishedYear
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Le nom de l\"éditeur est requis" },
        { status: 400 }
      );
    }

    // Check if publisher name already exists
    const existingPublisher = await db
      .select()
      .from(publishers)
      .where(eq(publishers.name, name))
      .limit(1);

    if (existingPublisher.length > 0) {
      return NextResponse.json(
        { error: "Un éditeur avec ce nom existe déjà" },
        { status: 400 }
      );
    }

    // Create publisher
    const newPublisher = await db
      .insert(publishers)
      .values({
        name,
        address: address || null,
        city: city || null,
        country: country || null,
        website: website || null,
        establishedYear: establishedYear || null
      })
      .returning();

    return NextResponse.json(newPublisher[0], { status: 201 });
  } catch (error) {
    console.error("Error creating publisher:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l\"éditeur" },
      { status: 500 }
    );
  }
}
