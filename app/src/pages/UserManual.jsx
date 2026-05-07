import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import BackButton from "../components/BackButton"; // Import added

const UserManual = () => {

  const manualRef = useRef(null);

  const handleDownloadPDF = async () => {

    try {

      const element = manualRef.current;

      if (!element) {
        alert("Manual content not found.");
        return;
      }

      const options = {
        margin: 0.5,
        filename: "MSalem-Library-User-Manual.pdf",

        image: {
          type: "jpeg",
          quality: 1,
        },

        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
        },

        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
        },

        pagebreak: {
          mode: ["avoid-all", "css", "legacy"],
        },
      };

      await html2pdf()
        .set(options)
        .from(element)
        .save();

    } catch (error) {

      console.error("PDF GENERATION ERROR:", error);

      alert("Failed to generate PDF. Open DevTools console for details.");
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen" style={{ backgroundColor: "#fefce8" }}>
      
      {/* Back Button added outside the paper container */}
      <div className="max-w-5xl mx-auto mb-6">
         <BackButton label="⬅ Return to Dashboard" className="shadow-md" />
      </div>

      <div
        ref={manualRef}
        className="max-w-5xl mx-auto shadow-2xl rounded-3xl overflow-hidden border-2"
        style={{ borderColor: "#fef08a", backgroundColor: "#ffffff" }}
      >

        {/* Header Section */}
        <div 
          className="p-6 md:p-8 flex justify-between items-center border-b-4" 
          style={{ backgroundColor: "#15803d", color: "#ffffff", borderColor: "#facc15" }}
        >

          <div>
            <h1 className="text-2xl md:text-3xl font-black italic">
              M'Salem Library System
            </h1>

            <p className="font-bold uppercase tracking-widest text-xs md:text-sm" style={{ color: "#fde047" }}>
              User Manual v1.0 • May 5, 2026
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="px-4 md:px-6 py-2 md:py-3 rounded-2xl font-black hover:bg-yellow-300 transition-all shadow-lg active:scale-95"
            style={{ backgroundColor: "#facc15", color: "#14532d" }}
          >
            📄 Download PDF
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-12 leading-relaxed overflow-visible" style={{ color: "#1f2937" }}>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              1. Overview
            </h2>

            <p className="mb-4">
              M'Salem School Library Management System is a professional
              desktop-based library administration platform designed to help
              schools and educational institutions manage daily library
              operations efficiently and securely. The system centralizes
              physical book circulation, digital learning material distribution,
              borrower management, overdue tracking, reporting, and financial
              monitoring into one unified environment.
            </p>

            <p className="mb-4">
              The platform supports both traditional library workflows and
              modern digital resource management. Librarians and administrators
              can issue physical books, distribute PDF learning materials
              through email, monitor overdue records, manage users, export
              reports, and maintain historical archives for accountability and
              auditing purposes.
            </p>

            <p className="mb-4">
              The system is built for schools, colleges, academic institutions,
              training centers, and community libraries that require organized
              catalog management, secure data storage, accurate reporting, and
              streamlined borrower tracking.
            </p>

            <p className="mb-4">
              M'Salem Library System improves operational efficiency by reducing
              manual paperwork, minimizing lost records, simplifying book
              searches, and enhancing overall visibility into library
              activities. The platform also helps institutions maintain accurate
              records for educational reporting and administrative oversight.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              2. User Roles
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Admin */}
              <div className="p-5 rounded-2xl border" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                <h3 className="font-bold text-lg mb-3" style={{ color: "#14532d" }}>
                  Admin
                </h3>

                <p className="text-sm mb-3">
                  Administrators are responsible for the daily operational
                  management of the library system. This role is typically
                  assigned to librarians, ICT staff, or authorized school
                  personnel who manage circulation and borrower activities.
                </p>

                <ul className="list-disc ml-5 text-sm space-y-2">
                  <li>Securely log into the library system</li>
                  <li>Issue and receive physical books</li>
                  <li>Dispatch PDF materials through email</li>
                  <li>Manage library catalog information</li>
                  <li>Create and update user records</li>
                  <li>Monitor overdue borrowing activities</li>
                  <li>Generate PDF and printable reports</li>
                  <li>Track active and archived circulation records</li>
                  <li>Maintain accurate borrowing history</li>
                </ul>
              </div>

              {/* Superadmin */}
              <div className="p-5 rounded-2xl border" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                <h3 className="font-bold text-lg mb-3" style={{ color: "#1e3a8a" }}>
                  Superadmin
                </h3>

                <p className="text-sm mb-3">
                  Superadministrators possess full system-level authority and
                  are responsible for platform oversight, administrative
                  control, financial monitoring, and security management.
                </p>

                <ul className="list-disc ml-5 text-sm space-y-2">
                  <li>Access all administrator-level features</li>
                  <li>Create, suspend, and reactivate admin accounts</li>
                  <li>Review security and audit logs</li>
                  <li>Monitor sensitive system activities</li>
                  <li>Access Financial Vault information</li>
                  <li>Review exports, deletions, and login activity</li>
                  <li>Maintain institutional accountability</li>
                  <li>Monitor operational and borrowing statistics</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              3. Login & Session Management
            </h2>

            <p className="mb-4">
              To start the application, open the M'Salem Library System from
              the desktop shortcut or installed application launcher. During
              startup, the system initializes the local backend services and
              loads the database environment. Please wait for the application to
              fully load before attempting to log in.
            </p>

            <p className="mb-4">
              Users must enter valid administrator or superadministrator
              credentials to access the platform. Login credentials are case
              sensitive and should be stored securely to prevent unauthorized
              access.
            </p>

            <p className="mb-4">
              For security purposes, the system automatically logs users out
              after 5 minutes of inactivity. This helps protect sensitive
              institutional data from unauthorized access when a workstation is
              left unattended.
            </p>

            <p className="mb-4">
              Users are strongly encouraged to manually log out after completing
              their work, especially on shared computers within school
              environments.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              4. Dashboard
            </h2>

            <p className="mb-4">
              The Dashboard serves as the central control panel of the library
              system. It provides quick access to all major operational
              sections, monitoring tools, and management features.
            </p>

            <p className="mb-4">
              The left sidebar organizes the system into functional categories
              including:
            </p>

            <ul className="list-disc ml-5 space-y-2 text-sm mb-4">
              <li>Superadmin Controls</li>
              <li>Book Management</li>
              <li>User Management</li>
              <li>Overdue Monitoring</li>
              <li>Reports & Exports</li>
              <li>Financial Tracking</li>
              <li>Security & Audit Logs</li>
            </ul>

            <p className="mb-4">
              Notification badges displayed beside sections such as
              <strong> "Overdue Books"</strong> help administrators quickly
              identify pending tasks and urgent borrower actions requiring
              attention.
            </p>

            <p className="mb-4">
              Dashboard statistics and monitoring cards provide administrators
              with an overview of current library operations including active
              borrowings, overdue records, and system activities.
            </p>
          </section>
{/* Section 4.5 - Statistics & Analytics */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              4.5 Statistics & Real-Time Analytics
            </h2>

            <p className="mb-4">
              The M'Salem Library System features a robust analytics engine that transforms raw circulation data into actionable insights. These metrics are visible on the primary dashboard and within specialized reporting modules to help administrators monitor library health at a glance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border bg-gray-50">
                <p className="font-bold text-sm mb-1 uppercase" style={{ color: "#15803d" }}>Circulation Metrics</p>
                <p className="text-xs">
                  Tracks total books currently in possession of borrowers, daily return rates, and the ratio of physical versus digital resource utilization.
                </p>
              </div>
              <div className="p-4 rounded-xl border bg-gray-50">
                <p className="font-bold text-sm mb-1 uppercase" style={{ color: "#b91c1c" }}>Risk Assessment</p>
                <p className="text-xs">
                  Automatically calculates the percentage of overdue items against total active borrowings, highlighting potential loss risks for the institution.
                </p>
              </div>
            </div>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              Visual Data Cards
            </h3>
            <p className="mb-4 text-sm">
              The system uses high-visibility "Stat Cards" to represent key performance indicators (KPIs). These include total registered students, total book titles in the catalog, and cumulative financial revenue. These cards update in real-time as transactions occur.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              Trend Analysis
            </h3>
            <p className="mb-4 text-sm">
              By monitoring statistics over time, Superadmins can identify peak borrowing periods (such as exam weeks), popular book categories, and most active borrower demographics. This data is essential for making informed decisions regarding future book purchases and resource allocation.
            </p>

            <p className="p-4 rounded-lg bg-yellow-100 border-l-4 border-yellow-500 text-xs italic">
              <strong>Note:</strong> Statistical accuracy depends entirely on consistent record-keeping. Ensure all books are officially "Returned" in the system to maintain the integrity of circulation analytics.
            </p>
          </section>
          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              5. Book Management
            </h2>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              5.1 Add Book Title
            </h3>

            <p className="mb-4 text-sm">
              Administrators can register new books into the library catalog by
              providing the required information including title, category,
              quantity, author information, and format type.
            </p>

            <p className="mb-4 text-sm">
              Physical books require available stock quantity information,
              while digital books require a valid PDF upload for electronic
              dispatch.
            </p>

            <p className="mb-4 text-sm">
              Proper catalog organization improves search efficiency and allows
              users to quickly identify available resources within the library
              system.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              5.2 Edit & Update Books
            </h3>

            <p className="mb-4 text-sm">
              Existing book records may be updated when quantities change,
              titles are corrected, or additional metadata becomes available.
              Administrators should ensure catalog information remains accurate
              to avoid circulation errors.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              5.3 Borrow Book
            </h3>

            <p className="mb-4 text-sm">
              To issue a book, select the desired title and choose the borrower
              from the available user database. The system supports students,
              staff, and general community users.
            </p>

            <p className="mb-4 text-sm">
              For physical books, administrators must define the expected return
              date before completing the borrowing transaction. This allows the
              system to monitor overdue activity automatically.
            </p>

            <p className="mb-4 text-sm">
              For digital resources, click
              <strong> "Dispatch PDF via Email"</strong> to securely deliver
              electronic materials directly to the borrower's registered email
              address.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              5.4 Active vs Archived Records
            </h3>

            <p className="mb-4 text-sm">
              Active records represent books that are currently borrowed and
              have not yet been returned. These records remain visible in active
              circulation monitoring areas until completed.
            </p>

            <p className="mb-4 text-sm">
              Once a book is returned, administrators should click the
              <strong> "Return"</strong> button to complete the transaction.
              The system automatically transfers the record into the Archived
              Books section for long-term historical reference.
            </p>

            <p className="mb-4 text-sm">
              Archived records help institutions maintain borrowing history,
              accountability, and reporting consistency.
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              6. Overdue Books
            </h2>

            <p className="mb-4">
              The Overdue Books section helps administrators identify borrowers
              who have exceeded their assigned return deadlines.
            </p>

            <p className="mb-4">
              Users can search overdue records using borrower names, book
              titles, or borrowing dates to quickly locate outstanding items.
            </p>

            <p className="mb-4">
              The system allows administrators to send reminder emails directly
              from the overdue monitoring interface. Where contact numbers are
              available, the platform also supports direct phone call
              initiation.
            </p>

            <p className="mb-4">
              Regular overdue monitoring improves accountability, increases book
              recovery rates, and ensures fair circulation of educational
              resources.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              7. People Management
            </h2>

            <p className="mb-4">
              The People Management section centralizes borrower registration
              and directory management for students, staff, and public users.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              Students
            </h3>

            <p className="mb-4 text-sm">
              Student records can be added individually or imported in bulk for
              large institutions. The system supports class promotion,
              graduation handling, and historical tracking for educational
              continuity.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              Staff
            </h3>

            <p className="mb-4 text-sm">
              Staff management allows schools to maintain employee directories
              for teachers, librarians, and institutional personnel who access
              library resources.
            </p>

            <h3 className="font-bold mt-6 mb-2" style={{ color: "#15803d" }}>
              General Users
            </h3>

            <p className="mb-4 text-sm">
              Community members, external researchers, and visitors may also be
              registered as general users depending on institutional policies.
            </p>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              8. Reports & Exports
            </h2>

            <p className="mb-4">
              The reporting system enables administrators to generate detailed
              library activity reports for monitoring, auditing, and
              institutional record keeping.
            </p>

            <p className="mb-4">
              Reports may include borrowing summaries, overdue statistics,
              financial activity, borrower history, and circulation records.
            </p>

            <p className="mb-4">
              Generated reports can be printed, exported as PDF files, or sent
              through email depending on administrative requirements.
            </p>

            <p className="mb-4">
              Institutions are encouraged to maintain periodic backups of
              exported reports for long-term archival and compliance purposes.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mb-10 p-6 rounded-2xl border-2 border-dashed print:bg-white" style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}>
            <h2 className="text-2xl font-black mb-4 uppercase" style={{ color: "#1e40af" }}>
              9. Superadmin Features
            </h2>

            <div className="space-y-5 text-sm">

              <div>
                <p className="font-bold mb-2">Admin Management</p>

                <p>
                  Superadministrators can create, suspend, reactivate, and
                  monitor administrator accounts. This ensures that only
                  authorized personnel gain access to sensitive system
                  operations.
                </p>
              </div>

              <div>
                <p className="font-bold mb-2">Security Logs</p>

                <p>
                  The system records critical activities including logins,
                  exports, deletions, borrowing actions, and administrative
                  modifications. Audit logs improve accountability and support
                  institutional investigations where necessary.
                </p>
              </div>

              <div>
                <p className="font-bold mb-2">Financial Vault</p>

                <p>
                  The Financial Vault provides oversight into revenue generated
                  through physical borrowing charges, digital dispatch fees, or
                  other configured institutional payments.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              10. Security Guidelines
            </h2>

            <ul className="list-disc ml-5 text-sm space-y-3">
              <li>Never share administrator passwords with unauthorized users.</li>
              <li>Always log out after completing administrative tasks.</li>
              <li>Use strong passwords containing letters, numbers, and symbols.</li>
              <li>Restrict physical access to computers running the system.</li>
              <li>Regularly monitor audit logs for suspicious activities.</li>
              <li>Perform routine backups of institutional records.</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              11. Data Storage
            </h2>

            <p className="mb-4">
              The application stores operational database files locally within
              the system application directory.
            </p>

            <p className="font-bold mt-4 uppercase text-xs" style={{ color: "#dc2626" }}>
              ⚠️ Do not manually edit database files.
            </p>

            <p className="mt-4 text-sm">
              Manual modification of internal database files may corrupt records
              and lead to irreversible data loss. All data changes should be
              performed through the official application interface.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              12. Backup Recommendations
            </h2>

            <p className="mb-4">
              Institutions are strongly encouraged to create regular backups of
              library records and exported reports to prevent accidental data
              loss caused by hardware failure or system corruption.
            </p>

            <p className="mb-4">
              Backup copies should be stored securely on external drives,
              network storage, or approved cloud storage solutions according to
              institutional ICT policies.
            </p>

            <p className="mb-4">
              It is recommended that backups be performed weekly or daily in
              high-activity library environments.
            </p>
          </section>

          {/* Section 13 */}
          <section className="mb-10">
            <h2 className="text-2xl font-black border-b-2 mb-4 uppercase" style={{ color: "#166534", borderColor: "#dcfce7" }}>
              13. Troubleshooting
            </h2>

            <ul className="list-disc ml-5 text-sm space-y-4">

              <li>
                <strong>Email fails:</strong> Verify that EMAIL_USER and
                EMAIL_PASS values are correctly configured inside the .env file.
                Also ensure internet access is available.
              </li>

              <li>
                <strong>Login fails:</strong> Ensure the backend server is
                running properly and confirm that credentials are entered
                correctly with proper capitalization.
              </li>

              <li>
                <strong>PDF not opening:</strong> Ensure a compatible PDF viewer
                such as Adobe Acrobat Reader is installed on the computer.
              </li>

              <li>
                <strong>Application not starting:</strong> Restart the computer
                and verify that the installation files have not been deleted or
                quarantined by antivirus software.
              </li>

              <li>
                <strong>Slow performance:</strong> Close unnecessary programs
                running on the computer and ensure sufficient storage space is
                available.
              </li>
            </ul>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t-2 text-center text-xs uppercase tracking-widest" style={{ borderColor: "#f3f4f6", color: "#9ca3af" }}>
            © 2026 M'Salem Library Management System • Strictly Confidential
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;