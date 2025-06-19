"use server";

import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getAllUsers = async () => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        accountStatus: users.accountStatus,
        maxBooksAllowed: users.maxBooksAllowed,
        enrollmentDate: users.enrollmentDate,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.isDeleted, false));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(allUsers)),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: "Failed to fetch users",
    };
  }
};

export const getUserById = async (userId: string) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    return {
      success: true,
      data: JSON.parse(JSON.stringify(user)),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      success: false,
      error: "Failed to fetch user",
    };
  }
};

export const updateUser = async (params: {
  userId: string;
  fullName?: string;
  email?: string;
  role?: string;
  accountStatus?: string;
  maxBooksAllowed?: number;
}) => {
  const { userId, ...updateData } = params;

  try {
    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdateData).length === 0) {
      return {
        success: false,
        error: "No data to update",
      };
    }

    const updatedUser = await db
      .update(users)
      .set({
        ...cleanUpdateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser.length) {
      return {
        success: false,
        error: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      data: JSON.parse(JSON.stringify(updatedUser[0])),
    };
  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: "Failed to update user",
    };
  }
};

export const deleteUser = async (userId: string) => {
  try {
    // Soft delete by setting isDeleted to true
    const deletedUser = await db
      .update(users)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!deletedUser.length) {
      return {
        success: false,
        error: "User not found",
      };
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: "Failed to delete user",
    };
  }
};

export const searchUsers = async (searchTerm: string) => {
  try {
    const searchResults = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        accountStatus: users.accountStatus,
        maxBooksAllowed: users.maxBooksAllowed,
        enrollmentDate: users.enrollmentDate,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          like(users.fullName, `%${searchTerm}%`),
          like(users.email, `%${searchTerm}%`),
          like(users.role, `%${searchTerm}%`)
        )
      );

    return {
      success: true,
      data: JSON.parse(JSON.stringify(searchResults)),
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      success: false,
      error: "Failed to search users",
    };
  }
};

