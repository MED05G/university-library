"use server";

import { db } from "@/database/drizzle";
import { accountRequests, users, departments } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendAccountApprovalNotification } from "@/lib/actions/email";

export const getAllAccountRequests = async () => {
  try {
    const requests = await db
      .select({
        id: accountRequests.id,
        fullName: accountRequests.fullName,
        email: accountRequests.email,
        studentId: accountRequests.studentId,
        phone: accountRequests.phone,
        address: accountRequests.address,
        departmentId: accountRequests.departmentId,
        departmentName: departments.name,
        universityCardUrl: accountRequests.universityCardUrl,
        requestDate: accountRequests.requestDate,
        status: accountRequests.status,
        reviewedBy: accountRequests.reviewedBy,
        reviewerName: users.fullName,
        reviewedAt: accountRequests.reviewedAt,
        rejectionReason: accountRequests.rejectionReason,
        createdAt: accountRequests.createdAt,
      })
      .from(accountRequests)
      .leftJoin(departments, eq(accountRequests.departmentId, departments.id))
      .leftJoin(users, eq(accountRequests.reviewedBy, users.id))
      .orderBy(desc(accountRequests.createdAt));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(requests)),
    };
  } catch (error) {
    console.error("Error fetching account requests:", error);
    return {
      success: false,
      error: "Failed to fetch account requests",
    };
  }
};

export const getPendingAccountRequests = async () => {
  try {
    const requests = await db
      .select({
        id: accountRequests.id,
        fullName: accountRequests.fullName,
        email: accountRequests.email,
        studentId: accountRequests.studentId,
        phone: accountRequests.phone,
        address: accountRequests.address,
        departmentId: accountRequests.departmentId,
        departmentName: departments.name,
        universityCardUrl: accountRequests.universityCardUrl,
        requestDate: accountRequests.requestDate,
        status: accountRequests.status,
        createdAt: accountRequests.createdAt,
      })
      .from(accountRequests)
      .leftJoin(departments, eq(accountRequests.departmentId, departments.id))
      .where(eq(accountRequests.status, "pending"))
      .orderBy(desc(accountRequests.createdAt));

    return {
      success: true,
      data: JSON.parse(JSON.stringify(requests)),
    };
  } catch (error) {
    console.error("Error fetching pending account requests:", error);
    return {
      success: false,
      error: "Failed to fetch pending account requests",
    };
  }
};

export const approveAccountRequest = async (params: {
  requestId: string;
  reviewerId: string;
  password: string;
  role?: string;
  maxBooksAllowed?: number;
}) => {
  const { requestId, reviewerId, password, role = "student", maxBooksAllowed = 5 } = params;

  try {
    // Get the account request
    const [request] = await db
      .select()
      .from(accountRequests)
      .where(eq(accountRequests.id, requestId))
      .limit(1);

    if (!request) {
      return {
        success: false,
        error: "Account request not found",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        error: "Account request has already been processed",
      };
    }

    // Check if email already exists in users table
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, request.email))
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user account
    const [newUser] = await db
      .insert(users)
      .values({
        fullName: request.fullName,
        email: request.email,
        studentId: request.studentId,
        phone: request.phone,
        address: request.address,
        password: hashedPassword,
        role: role,
        departmentId: request.departmentId,
        accountStatus: "active",
        maxBooksAllowed: maxBooksAllowed,
        enrollmentDate: new Date(),
      })
      .returning();

    // Update the account request
    await db
      .update(accountRequests)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        approvedUserId: newUser.id,
        updatedAt: new Date(),
      })
      .where(eq(accountRequests.id, requestId));

    // Send approval email notification
    try {
      await sendAccountApprovalNotification({
        userEmail: request.email,
        userName: request.fullName,
        loginUrl: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/sign-in`,
      });
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Don't fail the approval process if email fails
    }

    revalidatePath("/admin/account-requests");

    return {
      success: true,
      message: "Account request approved and user created successfully",
      userId: newUser.id,
    };
  } catch (error) {
    console.error("Error approving account request:", error);
    return {
      success: false,
      error: "Failed to approve account request",
    };
  }
};

export const rejectAccountRequest = async (params: {
  requestId: string;
  reviewerId: string;
  rejectionReason: string;
}) => {
  const { requestId, reviewerId, rejectionReason } = params;

  try {
    // Get the account request
    const [request] = await db
      .select()
      .from(accountRequests)
      .where(eq(accountRequests.id, requestId))
      .limit(1);

    if (!request) {
      return {
        success: false,
        error: "Account request not found",
      };
    }

    if (request.status !== "pending") {
      return {
        success: false,
        error: "Account request has already been processed",
      };
    }

    // Update the account request
    await db
      .update(accountRequests)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(accountRequests.id, requestId));

    revalidatePath("/admin/account-requests");

    return {
      success: true,
      message: "Account request rejected successfully",
    };
  } catch (error) {
    console.error("Error rejecting account request:", error);
    return {
      success: false,
      error: "Failed to reject account request",
    };
  }
};

export const createAccountRequest = async (params: {
  fullName: string;
  email: string;
  studentId?: string;
  phone?: string;
  address?: string;
  departmentId?: string;
  universityCardUrl?: string;
}) => {
  try {
    // Check if email already exists in users table
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser) {
      return {
        success: false,
        error: "User with this email already exists",
      };
    }

    // Check if there's already a pending request with this email
    const [existingRequest] = await db
      .select()
      .from(accountRequests)
      .where(eq(accountRequests.email, params.email))
      .limit(1);

    if (existingRequest && existingRequest.status === "pending") {
      return {
        success: false,
        error: "There is already a pending request for this email",
      };
    }

    // Create the account request
    const [newRequest] = await db
      .insert(accountRequests)
      .values({
        fullName: params.fullName,
        email: params.email,
        studentId: params.studentId,
        phone: params.phone,
        address: params.address,
        departmentId: params.departmentId,
        universityCardUrl: params.universityCardUrl,
        status: "pending",
      })
      .returning();

    return {
      success: true,
      message: "Account request submitted successfully",
      requestId: newRequest.id,
    };
  } catch (error) {
    console.error("Error creating account request:", error);
    return {
      success: false,
      error: "Failed to create account request",
    };
  }
};

