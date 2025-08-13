import React, { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { FaUserCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import "./EmployeePayroll.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";

const EmployeePayroll = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseDateDMY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
    if (parts.length !== 3) return null;
    const [dd, mm, yyyy] = parts;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  };

  const formatDateDMY = (date) => {
    if (!(date instanceof Date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, "users"), where("badgeId", "==", id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setUser({ uid: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
          setLoading(false);
          return;
        }

        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ uid: docSnap.id, ...docSnap.data() });
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  useEffect(() => {
    const fetchPayroll = async () => {
      setLoading(true);
      setError(null);

      try {
        const payrollDocRef = doc(db, "payslips", user?.uid || id);
        const payrollDocSnap = await getDoc(payrollDocRef);

        if (!payrollDocSnap.exists()) {
          setPayrollData([]);
          setError("No payroll records found");
          setLoading(false);
          return;
        }

        const payrollDocData = payrollDocSnap.data();

        if (!Array.isArray(payrollDocData.slips)) {
          setPayrollData([]);
          setError("No payroll slips data found");
          setLoading(false);
          return;
        }

        const slips = payrollDocData.slips.map((slip, index) => ({
          id: `${payrollDocSnap.id}_${index}`,
          ...slip,
          netSalary:
            slip.netSalary !== undefined
              ? slip.netSalary
              : Number(slip.basicSalary || 0) + Number(slip.allowances || 0) - Number(slip.deductions || 0),
          date: slip.date?.toDate ? slip.date.toDate() : parseDateDMY(slip.date),
        }));

        setPayrollData(slips);
      } catch (err) {
        console.error("Error fetching payroll data:", err);
        setError("Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid || id) {
      fetchPayroll();
    }
  }, [user, id]);

  const InfoItem = ({ Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="info-item">
        <div className="info-label">
          <Icon className="info-icon" />
          <span>{label}</span>
        </div>
        <div className="info-value">{value}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="employee-payroll-loading">
        <div className="spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-payroll-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <NavbarTopbar />
      <div className="employee-payroll-container mt-5">
        <div className="employee-profile-header">
          <div className="employee-profile-left">
            <FaUserCircle className="employee-avatar-icon" />
            <div>
              <h2 className="employee-profile-name">
                {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown User"}
              </h2>
              <div className="employee-profile-id">
                Badge ID: <span>{user?.badgeId || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="employee-profile-right">
            <div className="employee-contact-column">
              <InfoItem Icon={FaEnvelope} label="Work Email" value={user?.workEmail} />
              <InfoItem Icon={FaEnvelope} label="Personal Email" value={user?.email} />
            </div>
            <div className="employee-contact-column">
              <InfoItem Icon={FaPhone} label="Work Phone" value={user?.workPhone} />
              <InfoItem Icon={FaPhone} label="Personal Phone" value={user?.phone} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs-container">
          <nav className="profile-tabs">
            {["/about", "/attendance", "/leave", "/employeepayroll", "/employeedashboard"].map(
              (path) => (
                <NavLink
                  key={path}
                  to={`${path}/${user?.badgeId || user?.uid || id}`}
                  className={({ isActive }) => `profile-tab ${isActive ? "active" : ""}`}
                >
                  {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
                </NavLink>
              )
            )}
          </nav>
        </div>

        {/* Payroll Table */}
        <h2 className="employee-payroll-title">Employee Payroll</h2>
        <div className="employee-payroll-table-wrapper">
          {payrollData.length === 0 ? (
            <p className="employee-payroll-empty">
              No payslips found for {user?.firstName ? `${user.firstName}'s` : "this"} account
            </p>
          ) : (
            <table className="employee-payroll-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Pay Date</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Bank</th>
                  <th>Account</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payslip, index) => (
                  <tr key={payslip.id}>
                    <td>{index + 1}</td>
                    <td>{formatDateDMY(payslip.date)}</td>
                    <td>₹{Number(payslip.basicSalary).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.allowances).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.deductions).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.netSalary).toLocaleString("en-IN")}</td>
                    <td>{payslip.bankName || "N/A"}</td>
                    <td>{payslip.ifsc || "N/A"}</td>
                    <td className={`status-${payslip.status?.toLowerCase() || "pending"}`}>
                      {payslip.status || "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeePayroll;
