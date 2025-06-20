import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle';
import { users } from '@/database/schema';
import { eq, ilike, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// GET - Fetch all users with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = db.select().from(users).where(eq(users.isDeleted, false));

    // Apply filters
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(users.fullName, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.studentId, `%${search}%`)
        )
      );
    }

    if (role && role !== 'all') {
      conditions.push(eq(users.role, role));
    }

    if (status && status !== 'all') {
      conditions.push(eq(users.accountStatus, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allUsers = await query
      .limit(limit)
      .offset(offset)
      .orderBy(users.createdAt);

    // Remove password from response
    const sanitizedUsers = allUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Les champs nom, email, mot de passe et rôle sont requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }

    // Check if studentId already exists (if provided)
    if (studentId) {
      const existingStudentId = await db
        .select()
        .from(users)
        .where(eq(users.studentId, studentId))
        .limit(1);

      if (existingStudentId.length > 0) {
        return NextResponse.json(
          { error: 'Un utilisateur avec cet ID étudiant existe déjà' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        fullName,
        email,
        password: hashedPassword,
        role,
        accountStatus: accountStatus || 'active',
        studentId: studentId || null,
        phone: phone || null,
        address: address || null,
        departmentId: departmentId || null,
        maxBooksAllowed: maxBooksAllowed || 5,
        maxDaysAllowed: maxDaysAllowed || 14,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : null,
        graduationDate: graduationDate ? new Date(graduationDate) : null,
      })
      .returning();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser[0];

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' },
      { status: 500 }
    );
  }
}
