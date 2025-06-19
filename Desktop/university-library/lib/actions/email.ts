"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_TOKEN);

interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (data: EmailNotificationData) => {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: "University Library <library@sculib.com>",
      to: data.to,
      subject: data.subject,
      html: data.html,
    });

    if (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: emailData,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: "Failed to send email",
    };
  }
};

export const sendDueDateReminder = async (params: {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: string;
  daysUntilDue: number;
}) => {
  const { userEmail, userName, bookTitle, bookAuthor, dueDate, daysUntilDue } = params;

  const subject = `Reminder: "${bookTitle}" is due ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Book Due Date Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .due-date { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 University Library</h1>
          <h2>Book Due Date Reminder</h2>
        </div>
        
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>This is a friendly reminder that you have a book due ${daysUntilDue === 1 ? 'tomorrow' : `in ${daysUntilDue} days`}.</p>
          
          <div class="book-info">
            <h3>📖 Book Details</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Author:</strong> ${bookAuthor}</p>
          </div>
          
          <div class="due-date">
            <h3>⏰ Due Date</h3>
            <p><strong>${new Date(dueDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</strong></p>
          </div>
          
          <p>Please return the book on time to avoid late fees. If you need more time, you can renew the book through your profile page (up to 2 renewals allowed).</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_API_ENDPOINT}/my-profile" class="button">
              View My Profile
            </a>
          </div>
          
          <p>Thank you for using the University Library!</p>
        </div>
        
        <div class="footer">
          <p>University Library System<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const sendOverdueNotification = async (params: {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  dueDate: string;
  daysOverdue: number;
  fineAmount: number;
}) => {
  const { userEmail, userName, bookTitle, bookAuthor, dueDate, daysOverdue, fineAmount } = params;

  const subject = `OVERDUE: "${bookTitle}" - ${daysOverdue} days overdue`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Overdue Book Notice</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .overdue-info { background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .fine-info { background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 University Library</h1>
          <h2>⚠️ Overdue Book Notice</h2>
        </div>
        
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p><strong>URGENT:</strong> You have an overdue book that needs to be returned immediately.</p>
          
          <div class="book-info">
            <h3>📖 Book Details</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Author:</strong> ${bookAuthor}</p>
          </div>
          
          <div class="overdue-info">
            <h3>⏰ Overdue Information</h3>
            <p><strong>Original Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue} days</p>
          </div>
          
          <div class="fine-info">
            <h3>💰 Fine Information</h3>
            <p><strong>Current Fine:</strong> $${fineAmount.toFixed(2)}</p>
            <p><em>Fines continue to accrue at $1.00 per day until the book is returned.</em></p>
          </div>
          
          <p>Please return this book as soon as possible to avoid additional fines. You can return books during library hours or use the book drop-off box.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_API_ENDPOINT}/my-profile" class="button">
              View My Profile
            </a>
          </div>
          
          <p>If you have any questions or concerns, please contact the library immediately.</p>
        </div>
        
        <div class="footer">
          <p>University Library System<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const sendReservationNotification = async (params: {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  queuePosition: number;
  expiryDate: string;
}) => {
  const { userEmail, userName, bookTitle, bookAuthor, queuePosition, expiryDate } = params;

  const subject = `📚 Your reserved book "${bookTitle}" is now available!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Book Reservation Ready</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .availability-info { background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .expiry-warning { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 University Library</h1>
          <h2>🎉 Your Reserved Book is Ready!</h2>
        </div>
        
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>Great news! The book you reserved is now available for pickup.</p>
          
          <div class="book-info">
            <h3>📖 Book Details</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Author:</strong> ${bookAuthor}</p>
            <p><strong>Your Queue Position:</strong> #${queuePosition}</p>
          </div>
          
          <div class="availability-info">
            <h3>✅ Ready for Pickup</h3>
            <p>Your reserved book is now available and waiting for you at the library circulation desk.</p>
          </div>
          
          <div class="expiry-warning">
            <h3>⏰ Important: Reservation Expires</h3>
            <p><strong>Pickup Deadline:</strong> ${new Date(expiryDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><em>Please pick up your book by this date, or your reservation will expire and the book will be offered to the next person in line.</em></p>
          </div>
          
          <p>You can also borrow the book directly through the library system if you prefer.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_API_ENDPOINT}/books/${bookTitle.replace(/\s+/g, '-').toLowerCase()}" class="button">
              Borrow Book Online
            </a>
          </div>
          
          <p>Thank you for using our reservation system!</p>
        </div>
        
        <div class="footer">
          <p>University Library System<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const sendAccountApprovalNotification = async (params: {
  userEmail: string;
  userName: string;
  loginUrl: string;
}) => {
  const { userEmail, userName, loginUrl } = params;

  const subject = "🎉 Your University Library account has been approved!";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .welcome-info { background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 University Library</h1>
          <h2>🎉 Welcome to the Library!</h2>
        </div>
        
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>Congratulations! Your University Library account has been approved and is now active.</p>
          
          <div class="welcome-info">
            <h3>🎊 Account Activated</h3>
            <p>You can now access all library services including:</p>
            <ul>
              <li>Browse and search our book collection</li>
              <li>Borrow books online</li>
              <li>Reserve unavailable books</li>
              <li>Renew borrowed books</li>
              <li>View your borrowing history</li>
            </ul>
          </div>
          
          <p>You can log in to your account using the email address and password you provided during registration.</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">
              Log In to Your Account
            </a>
          </div>
          
          <p>Welcome to the University Library community! We're excited to help you on your learning journey.</p>
        </div>
        
        <div class="footer">
          <p>University Library System<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const sendNewBookNotification = async (params: {
  userEmail: string;
  userName: string;
  bookTitle: string;
  bookAuthor: string;
  bookGenre: string;
}) => {
  const { userEmail, userName, bookTitle, bookAuthor, bookGenre } = params;

  const subject = `📚 New Book Alert: "${bookTitle}" is now available!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Book Available</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .book-info { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 University Library</h1>
          <h2>📖 New Book Available!</h2>
        </div>
        
        <div class="content">
          <p>Dear ${userName},</p>
          
          <p>We're excited to let you know that a new book has been added to our collection!</p>
          
          <div class="book-info">
            <h3>📚 New Addition</h3>
            <p><strong>Title:</strong> ${bookTitle}</p>
            <p><strong>Author:</strong> ${bookAuthor}</p>
            <p><strong>Genre:</strong> ${bookGenre}</p>
          </div>
          
          <p>This book is now available for borrowing. Be among the first to check it out!</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_API_ENDPOINT}/search?query=${encodeURIComponent(bookTitle)}" class="button">
              View Book Details
            </a>
          </div>
          
          <p>Happy reading!</p>
        </div>
        
        <div class="footer">
          <p>University Library System<br>
          This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

