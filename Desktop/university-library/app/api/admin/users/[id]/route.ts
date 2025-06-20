import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// GET - Fetch a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isDeleted, false)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user[0];

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// PUT - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const body = await request.json();
    const {
      fullName,
      email,
      password,
      role,
      accountStatus,
      studentId,
      phone,
      address,
      departmentId,
      maxBooksAllowed,
      maxDaysAllowed,
      enrollmentDate,
      graduationDate
    } = body;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isDeleted, false)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser[0].email) {
      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), eq(users.isDeleted, false)))
        .limit(1);

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        );
      }
    }

    // Check if studentId is being changed and if it already exists
    if (studentId && studentId !== existingUser[0].studentId) {
      const studentIdExists = await db
        .select()
        .from(users)
        .where(and(eq(users.studentId, studentId), eq(users.isDeleted, false)))
        .limit(1);

      if (studentIdExists.length > 0) {
        return NextResponse.json(
          { error: "Un utilisateur avec cet ID étudiant existe déjà" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (accountStatus) updateData.accountStatus = accountStatus;
    if (studentId !== undefined) updateData.studentId = studentId || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (maxBooksAllowed) updateData.maxBooksAllowed = maxBooksAllowed;
    if (maxDaysAllowed) updateData.maxDaysAllowed = maxDaysAllowed;
    if (enrollmentDate !== undefined) updateData.enrollmentDate = enrollmentDate ? new Date(enrollmentDate) : null;
    if (graduationDate !== undefined) updateData.graduationDate = graduationDate ? new Date(graduationDate) : null;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser[0];

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isDeleted, false)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Soft delete user
    await db
      .update(users)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    );
  }
}
