import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../Firebase/Firebase";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { FaTrash } from "react-icons/fa";
import "./ManagerPayroll.css";

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

const ManagerPayroll = () => {
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [myPayrollRows, setMyPayrollRows] = useState([]);
  const [employeePayrollRows, setEmployeePayrollRows] = useState([]);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("my");

  const [currentPageMy, setCurrentPageMy] = useState(1);
  const [currentPageEmp, setCurrentPageEmp] = useState(1);
  const rowsPerPage = 10;

  // Date filters for each table
  const [filterDateMy, setFilterDateMy] = useState("");
  const [filterDateEmp, setFilterDateEmp] = useState("");

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
        const managerSnap = await getDoc(doc(db, "users", authUser.uid));
        if (!managerSnap.exists()) throw new Error("Manager data not found");

        const { firstName, badgeId, jobRole } = managerSnap.data();
        const managerString = `${firstName} (${badgeId})`;

        const usersSnap = await getDocs(collection(db, "users"));
        let myProfile = null;
        let team = [];

        usersSnap.forEach((userDoc) => {
          const data = userDoc.data();
          if (data.badgeId === badgeId && data.jobRole === jobRole) {
            myProfile = { uid: userDoc.id, ...data };
          } else if (
            data.jobRole === "Employee" &&
            data.reportingManager === managerString
          ) {
            team.push({ uid: userDoc.id, ...data });
          }
        });

        const fetchPayrollData = async (person) => {
          const payslipDoc = await getDoc(doc(db, "payslips", person.uid));
          if (!payslipDoc.exists()) return [];
          const { slips = [] } = payslipDoc.data();

          return slips.map((slip, idx) => {
            const date = toDateSafe(slip.date);
            const basic = Number(slip.basicSalary || 0);
            const allow = Number(slip.allowances || 0);
            const ded = Number(slip.deductions || 0);
            const net =
              slip.netSalary !== undefined
                ? Number(slip.netSalary)
                : basic + allow - ded;

            return {
              id: `${payslipDoc.id}_${idx}`,
              uid: person.uid,
              slipIndex: idx,
              employeeName: `${person.firstName || ""} ${person.lastName || ""}`.trim(),
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
            };
          });
        };

        let myRows = myProfile ? await fetchPayrollData(myProfile) : [];
        let empRows = [];
        for (const emp of team) {
          const empData = await fetchPayrollData(emp);
          empRows.push(...empData);
        }

        myRows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
        empRows.sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

        setMyPayrollRows(myRows);
        setEmployeePayrollRows(empRows);

        if (myRows.length === 0 && empRows.length === 0) {
          setError("No payslips found.");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading payroll");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [authUser]);

  const handleDelete = async (uid, slipIndex, type) => {
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
      slips.splice(slipIndex, 1);

      await updateDoc(payslipRef, { slips });

      if (type === "my") {
        setMyPayrollRows((prev) =>
          prev.filter((row) => !(row.uid === uid && row.slipIndex === slipIndex))
        );
      } else {
        setEmployeePayrollRows((prev) =>
          prev.filter((row) => !(row.uid === uid && row.slipIndex === slipIndex))
        );
      }

      alert("Payslip deleted successfully!");
    } catch (err) {
      console.error("Error deleting payslip:", err);
      alert("Failed to delete payslip.");
    }
  };

  const renderTable = (rows, type, currentPage, setCurrentPage, totalPages, filterDate, setFilterDate) => {
    const filteredRows = filterDate
      ? rows.filter((r) => formatDateDMY(r.date) === formatDateDMY(new Date(filterDate)))
      : rows;

    const totalFilteredPages = Math.ceil(filteredRows.length / rowsPerPage);
    const currentRows = filteredRows.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

    return (
      <>
        <div className="table-header">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="date-filter-managerpayroll"
          />
        </div>

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
                <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                <td>{r.employeeName}</td>
                <td>{r.badgeId}</td>
                <td>{formatDateDMY(r.date)}</td>
                <td>{currencyIN(r.basic)}</td>
                <td>{currencyIN(r.allow)}</td>
                <td>{currencyIN(r.ded)}</td>
                <td>{currencyIN(r.net)}</td>
                <td>{r.bankName}</td>
                <td>{r.ifsc}</td>
                <td className={`status-${r.status.toLowerCase()}`}>{r.status}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(r.uid, r.slipIndex, type)}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="managerpayroll-pagination">
          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
            &lt; Prev
          </button>
          <span>Page {currentPage} of {totalFilteredPages}</span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage === totalFilteredPages}
          >
            Next &gt;
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      <NavbarTopbar />
      <div className="managerpayroll-container">
        <h2 className="managerpayroll-title">Payroll</h2>

        <div className="managerpayroll-tabs">
          <button
            className={viewType === "my" ? "active-tab" : ""}
            onClick={() => setViewType("my")}
          >
            My Payroll
          </button>
          <button
            className={viewType === "employee" ? "active-tab" : ""}
            onClick={() => setViewType("employee")}
          >
            Employee Payroll
          </button>
        </div>

        <div className="managerpayroll-table-wrapper">
          {loading ? (
            <p>Loading payroll...</p>
          ) : error ? (
            <p>{error}</p>
          ) : viewType === "my" ? (
            myPayrollRows.length === 0 ? (
              <p>No payslips to display.</p>
            ) : (
              renderTable(myPayrollRows, "my", currentPageMy, setCurrentPageMy, Math.ceil(myPayrollRows.length / rowsPerPage), filterDateMy, setFilterDateMy)
            )
          ) : employeePayrollRows.length === 0 ? (
            <p>No payslips to display.</p>
          ) : (
            renderTable(employeePayrollRows, "employee", currentPageEmp, setCurrentPageEmp, Math.ceil(employeePayrollRows.length / rowsPerPage), filterDateEmp, setFilterDateEmp)
          )}
        </div>
      </div>
    </>
  );
};

export default ManagerPayroll;
