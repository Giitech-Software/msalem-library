# M'Salem School Library Management System

User Manual

Version: 1.0  
Audience: Librarians, administrators, and superadmins  
Last updated: May 5, 2026

## 1. Overview

M'Salem School Library Management System is a desktop application for managing a school library. It supports physical book borrowing, digital PDF dispatch, book catalog management, student/staff/general-user directories, overdue tracking, PDF reports, email reports, security logs, and financial tracking.

The app runs locally on the computer. In production, it starts a local backend server automatically and stores library data in the app data folder.

## 2. User Roles

### Admin

Admins can:

- Log in to the system.
- Add book titles to the catalog.
- Issue physical books.
- Dispatch digital books by email.
- View and manage active borrowed books.
- Mark books as returned.
- View archived/returned books.
- Manage students, staff, and general users.
- View overdue books.
- Export and email reports.
- View general statistics.

### Superadmin

Superadmins can do everything admins can do, plus:

- Register new admin accounts.
- Suspend or reactivate admin accounts.
- Delete admin accounts, except the superadmin account.
- View security/audit logs.
- View the financial vault.

## 3. Login and Session

### Open the app

1. Launch M'Salem Library from the desktop or Start Menu.
2. Wait for the login screen or home page to appear.
3. If the app says the server is still starting, wait a few seconds and try again.

### Log in

1. Go to the login screen.
2. Enter the admin email address.
3. Enter the password.
4. Click `Enter Dashboard`.

If login fails:

- Check that the email and password are correct.
- If the account is suspended, contact the superadmin.
- If the server is starting, wait and retry.

### Session timeout

For security, the dashboard logs the user out after about 5 minutes of inactivity. Moving the mouse, typing, scrolling, or clicking keeps the session active.

### Log out

Click `Logout to Home` at the bottom of the dashboard sidebar.

## 4. Dashboard

The dashboard is the main navigation center. The sidebar groups tasks into:

- Superadmin
- Book Management
- User Management
- Monitoring

The overdue-books menu item shows a badge when books are overdue.

## 5. Book Management

### 5.1 Add Book Title

Use `Add Book Title` before issuing a book. A book must exist in the catalog before it can be selected in the borrowing form.

Fields:

- Book Title: Required.
- Author: Optional but recommended.
- ISBN: Optional.
- Published Year: Optional.
- Digital Copy PDF: Optional. Uploading a PDF makes the item a digital book.
- Category: Textbook, Storybook, Reference, Novel, or General.
- Borrowing Cost: Fee charged when the book is issued.
- Description: Optional.
- Physical Quantity: Required for physical books.

To add a physical book:

1. Open `Add Book Title`.
2. Enter the title and details.
3. Leave Digital Copy empty.
4. Enter the physical quantity.
5. Click `Add to Catalog`.

To add a digital book:

1. Open `Add Book Title`.
2. Enter the title and details.
3. Choose a PDF in Digital Copy.
4. Enter the borrowing cost if needed.
5. Click `Upload Digital Book`.

Notes:

- Exact duplicate titles are blocked.
- Digital books are treated as unlimited stock.
- Only PDF files should be uploaded for digital books.

### 5.2 Book Catalog

Use `Book Catalog` to view, search, edit, and delete catalog titles.

Features:

- Search by title or author.
- View category, format, borrowing fee, and live stock.
- Edit title, author, category, book type, price, and quantity.
- Delete a catalog entry after admin credential confirmation.

To edit a catalog title:

1. Open `Book Catalog`.
2. Find the book.
3. Click `Edit`.
4. Change the fields.
5. Click `Save`.

To delete a catalog title:

1. Open `Book Catalog`.
2. Click `Delete`.
3. Enter admin email and password.
4. Confirm deletion.

### 5.3 Borrow Book

Use `Borrow Book` to issue a physical book or dispatch a digital book.

The form loads:

- Book catalog titles.
- Students.
- Staff.
- General users.
- Currently borrowed physical books.

To issue a physical book:

1. Open `Borrow Book`.
2. Search for and select a book title.
3. Search for and select a borrower, or type a new borrower name.
4. Enter or generate a borrower ID.
5. Select category and sub-category.
6. Enter contact information if available.
7. Set the issue date.
8. Set the expected return date.
9. Adjust the issuance price if needed.
10. Click `Confirm Physical Issuance`.

Important rules:

- A physical borrower should return the previous physical book before borrowing another.
- Return date must be after borrowed date.
- Stock availability is calculated from catalog quantity minus active borrowed records.

To dispatch a digital book:

1. Open `Borrow Book`.
2. Select a catalog item that has a PDF.
3. Enter/select borrower information.
4. Enter a valid email address as contact.
5. Adjust the price if needed.
6. Click `Dispatch PDF via Email`.

Notes:

- Digital books do not require a return date.
- Email dispatch requires valid email settings in the backend `.env`.

### 5.4 Active Books

Use `Active Books` to manage physical books that are currently out.

Features:

- Search by borrower ID, borrower name, or title.
- View borrowed date and due date.
- Mark a book as returned.
- Delete a borrowed record with admin credential confirmation.
- Export active books as a PDF.
- Email the active-books report.
- Filter reports by date range.

To mark a book as returned:

1. Open `Active Books`.
2. Find the record.
3. Click `Return`.
4. Confirm.

To export active books:

1. Optionally choose From and To dates.
2. Click `PDF`.
3. Save the generated report.

To email active-books report:

1. Optionally choose From and To dates.
2. Click `Email`.
3. Enter recipient email.
4. Click `Send`.

### 5.5 Archived Books

Use `Archived Books` to view books that have been returned or digital books that have been dispatched.

Features:

- Search by title, borrower, or borrower ID.
- View return/access information.
- Delete archived records with admin credential confirmation.

Use deletion carefully. It permanently removes the archive record.

## 6. Overdue Books

Use `Overdue Books` to follow up on physical books past their due date.

Features:

- View overdue records.
- Search by title, borrower, or borrower ID.
- Filter by due-date range.
- Export overdue report as PDF.
- Email the full overdue report.
- Send an email reminder to a borrower.
- Start a phone call if the contact is a phone number.
- View total outstanding value.

To send a reminder:

1. Open `Overdue Books`.
2. Find the borrower.
3. Click the contact action button.
4. If the contact is an email, the app sends a reminder.
5. If the contact is a phone number, the app opens the dialer.

To export overdue report:

1. Optionally set From and To date filters.
2. Click `PDF`.

To email overdue report:

1. Click `Email`.
2. Enter recipient email.
3. Click `Send`.

## 7. People Management

### 7.1 Students List

Use `Students List` to manage student records.

Views:

- View All
- Bulk Import
- Promote
- Graduate

To bulk import students:

1. Open `Students List`.
2. Click `Bulk Import`.
3. Paste names separated by new lines or commas.
4. Select category.
5. Select class/sub-category.
6. Click `Start Import`.

To edit a student:

1. Open `View All`.
2. Search for the student.
3. Click `Edit`.
4. Change the name.
5. Click `Save`.

To delete a student:

1. Open `View All`.
2. Click `Delete`.
3. Confirm the modal.

To promote a class:

1. Click `Promote`.
2. Select the current class.
3. Select the destination class.
4. Click `Execute Promotion`.
5. Confirm.

To graduate/archive a class:

1. Click `Graduate`.
2. Select the final class.
3. Click `Confirm Graduation`.
4. Confirm.

### 7.2 Staff List

Use `Staff List` to manage staff directory records.

To bulk add staff:

1. Open `Staff List`.
2. Click `Bulk Add Staff`.
3. Enter names separated by lines or commas.
4. Click `Register Staff Members`.

To edit staff:

1. Search or locate the staff member.
2. Click `Edit`.
3. Change the name.
4. Click `Save`.

To delete staff:

1. Click `Delete`.
2. Confirm removal.

### 7.3 General Users

Use `General Users` for community members, parents, visitors, alumni, and other non-student/non-staff borrowers.

To bulk add general users:

1. Open `General Users`.
2. Click `Bulk Add Users`.
3. Choose a category such as Community Member, Parent, Alumni, or Visitor.
4. Enter names separated by lines or commas.
5. Click `Register Users`.

To edit or delete:

1. Use the search box to find the user.
2. Click `Edit` or `Delete`.
3. Save or confirm as needed.

## 8. Statistics

Use `Statistics` to view library activity summaries.

Metrics include:

- Total borrowed/transactions.
- Books currently out.
- Digital books dispatched.
- Returned/archive count.
- Weekly, monthly, and yearly activity.
- Category breakdown.
- Financial totals for superadmin users.

Regular admins may see only non-restricted statistics.

## 9. Superadmin Features

### 9.1 Admin Management

Only superadmins can access this page.

Use it to:

- Register new admin accounts.
- View all admin accounts.
- Suspend active admins.
- Reactivate suspended admins.
- Delete admin accounts.
- View activity logs.

To register an admin:

1. Open `Admin Management`.
2. Enter the admin email.
3. Enter a temporary password.
4. Click `Confirm Registration`.

To suspend/reactivate:

1. Find the admin row.
2. Click the status action button.

To delete:

1. Find the admin row.
2. Click the delete button.
3. Confirm.

The superadmin account cannot be suspended or deleted.

### 9.2 Security Logs

Only superadmins can access this page.

Use `Security Logs` to inspect system activity:

- Logins.
- Admin registration.
- Status changes.
- Book issue/return/delete events.
- User imports and edits.
- Report/reminder actions.

You can filter by admin email or action and refresh logs.

### 9.3 Financial Vault

Only superadmins can access this page.

Use `Financial Vault` to review borrowing fees and digital dispatch revenue.

Features:

- Total revenue.
- Physical revenue.
- Digital revenue.
- Search by borrower name, book title, or borrower ID.
- View issue date, amount, book type, and issuing admin.

## 10. Reports and Email

The app can generate PDF reports for:

- Active borrowed books.
- Overdue books.

The app can email:

- Active-books reports.
- Overdue-books reports.
- Individual overdue reminders.
- Digital book PDFs.

Email functions require the backend email settings to be configured:

- `EMAIL_USER`
- `EMAIL_PASS`

If email fails but other actions work, check the email credentials and Gmail/app-password settings.

## 11. Data Storage

The production app stores database files in the Windows app data folder:

`C:\Users\<YourUser>\AppData\Roaming\msalem-library\database`

Common database files:

- `admins.db`
- `book_catalog.db`
- `books.db`
- `students.db`
- `staff.db`
- `general_users.db`
- `logs.db`
- `financial_records.db`

Uploaded digital book PDFs are stored under:

`C:\Users\<YourUser>\AppData\Roaming\msalem-library\database\uploads\pdfs`

Do not manually edit database files unless you have a backup.

## 12. Recommended Daily Workflow

1. Log in.
2. Check the overdue badge on the dashboard.
3. Add new catalog titles if needed.
4. Issue books through `Borrow Book`.
5. Use `Active Books` to mark returns.
6. Use `Overdue Books` for follow-ups.
7. Update student/staff/general-user lists as needed.
8. Export or email reports at the end of the day/week.
9. Log out.

## 13. Troubleshooting

### Login works but actions fail

- Confirm the installed app was rebuilt and reinstalled after updates.
- Log out and log in again.
- Check that the backend server is running.

### Add book fails

- Confirm the title is not an exact duplicate.
- For digital books, confirm the file is a PDF.
- Restart the app and retry.

### Staff/student import says failed

- Confirm you are logged in.
- Confirm names are separated by lines or commas.
- Avoid blank rows.

### User does not show in directory

- Clear the search box.
- Refresh by leaving and returning to the page.
- Confirm the user was imported into the correct directory.

### Email does not send

- Confirm recipient email is valid.
- Confirm `EMAIL_USER` and `EMAIL_PASS` are configured.
- For Gmail, use an app password where required.

### PDF does not open

- Wait a few seconds for report generation.
- Try a smaller date range.
- Confirm a PDF viewer is installed.

### Session expired

- Log in again.
- This is expected after inactivity.

## 14. Good Practices

- Add catalog titles before issuing books.
- Use consistent borrower names and IDs.
- Keep student classes updated after promotions/graduations.
- Mark returns immediately when books are returned.
- Export regular reports for record keeping.
- Restrict superadmin access to trusted users only.
- Back up the database folder regularly.

