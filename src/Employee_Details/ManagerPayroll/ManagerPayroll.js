import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../Firebase/Firebase";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import "./ManagerPayroll.css";
import { FaTrash  } from "react-icons/fa";

/* Utility functions */
const toDateSafe = (val) => {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (val?.toDate) return val.toDate();
  if (typeof val === "string") {
    const [d, m, y] = val.split(/[/-]/).map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
};

const formatDateDMY = (date) =>
  date instanceof Date && !isNaN(date)
    ? `${String(date.getDate()).padStart(2, "0")}/${String(
        date.getMonth() + 1
      ).padStart(2, "0")}/${date.getFullYear()}`
    : "";

const currencyIN = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(n || 0));

export default function EmployeePayroll() {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const [roleFilter, setRoleFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Track logged-in user
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => setAuthUser(user || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authUser?.uid) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Get manager details
        const managerSnap = await getDoc(doc(db, "users", authUser.uid));
        if (!managerSnap.exists()) throw new Error("Manager data not found");

        const { firstName, badgeId, jobRole } = managerSnap.data();
        const managerString = `${firstName} (${badgeId})`;

        // Get all users
        const usersSnap = await getDocs(collection(db, "users"));
        let team = [];

        usersSnap.forEach((userDoc) => {
          const data = userDoc.data();
          const isEmployeeUnderManager =
            data.jobRole === "Employee" &&
            data.reportingManager === managerString;

          const isManagerSelf =
            data.badgeId === badgeId && data.jobRole === jobRole;

          if (isEmployeeUnderManager || isManagerSelf) {
            team.push({ uid: userDoc.id, ...data });
          }
        });

        // Get payroll data for each
        const allRows = [];
        for (const person of team) {
          const payslipDoc = await getDoc(doc(db, "payslips", person.uid));
          if (!payslipDoc.exists()) continue;
          const { slips = [] } = payslipDoc.data();

          slips.forEach((slip, idx) => {
            const date = toDateSafe(slip.date);
            const basic = Number(slip.basicSalary || 0);
            const allow = Number(slip.allowances || 0);
            const ded = Number(slip.deductions || 0);
            const net =
              slip.netSalary !== undefined
                ? Number(slip.netSalary)
                : basic + allow - ded;

            allRows.push({
              id: `${payslipDoc.id}_${idx}`,
              uid: person.uid, // Needed for deletion
              slipIndex: idx,  // Needed for deletion
              employeeName: `${person.firstName || ""} ${
                person.lastName || ""
              }`.trim(),
              badgeId: person.badgeId || "N/A",
              date,
              basic,
              allow,
              ded,
              net,
              bankName: slip.bankName || "N/A",
              ifsc: slip.ifsc || "N/A",
              status: slip.status || "Pending",
              jobRole: person.jobRole || "",
            });
          });
        }

        // Sort by latest date
        allRows.sort(
          (a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
        );
        setRows(allRows);

        if (allRows.length === 0) setError("No payslips found.");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading payroll");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser]);

  // Delete handler
  const handleDelete = async (uid, slipIndex) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this payslip?");
    if (!confirmDelete) return;

    try {
      const payslipRef = doc(db, "payslips", uid);
      const payslipSnap = await getDoc(payslipRef);

      if (!payslipSnap.exists()) {
        alert("Payslip not found in database.");
        return;
      }

      const { slips = [] } = payslipSnap.data();
      slips.splice(slipIndex, 1); // Remove the slip from the array

      await updateDoc(payslipRef, { slips });

      // Remove from UI
      setRows((prev) =>
        prev.filter((row) => !(row.uid === uid && row.slipIndex === slipIndex))
      );

      alert("Payslip deleted successfully!");
    } catch (err) {
      console.error("Error deleting payslip:", err);
      alert("Failed to delete payslip.");
    }
  };

  // Filter rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      let ok = true;
      if (roleFilter)
        ok = ok && r.jobRole?.toLowerCase() === roleFilter.toLowerCase();
      if (dateFilter) {
        const d = new Date(dateFilter);
        ok =
          ok &&
          r.date &&
          r.date.getFullYear() === d.getFullYear() &&
          r.date.getMonth() === d.getMonth() &&
          r.date.getDate() === d.getDate();
      }
      return ok;
    });
  }, [rows, roleFilter, dateFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <>
      <NavbarTopbar />
      <div className="managerpayroll-container">
        <h2 className="managerpayroll-title">Payroll</h2>

        {/* Filters */}
        <div className="managerpayroll-filters">
          <div>
            <label>Job Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
          <div>
            <label>Pay Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="managerpayroll-table-wrapper">
          {loading ? (
            <p>Loading payroll...</p>
          ) : error ? (
            <p>{error}</p>
          ) : filteredRows.length === 0 ? (
            <p>No payslips to display.</p>
          ) : (
            <>
              <table className="managerpayroll-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Employee</th>
                    <th>Badge ID</th>
                    <th>Pay Date</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Bank</th>
                    <th>IFSC/Account</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((r, idx) => (
                    <tr key={r.id}>
                      <td>{indexOfFirstRow + idx + 1}</td>
                      <td>{r.employeeName}</td>
                      <td>{r.badgeId}</td>
                      <td>{formatDateDMY(r.date)}</td>
                      <td>{currencyIN(r.basic)}</td>
                      <td>{currencyIN(r.allow)}</td>
                      <td>{currencyIN(r.ded)}</td>
                      <td>{currencyIN(r.net)}</td>
                      <td>{r.bankName}</td>
                      <td>{r.ifsc}</td>
                      <td className={`status-${r.status.toLowerCase()}`}>
                        {r.status}
                      </td>
                      <td>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "red",
                            cursor: "pointer",
                            fontSize: "18px",
                          }}
                          onClick={() => handleDelete(r.uid, r.slipIndex)}
                        >
                           <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="managerpayroll-pagination">
                <button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  disabled={currentPage === 1}
                >
                  &lt; Prev
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next &gt;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
