import React, { useEffect, useState, useContext } from "react";
import { useParams, NavLink } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { FaUserCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import "./EmployeePayroll.css";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { AuthContext } from "../Contextapi/Authcontext";

const EmployeePayroll = () => {
  const { id } = useParams(); // badgeId from URL
  const [user, setUser] = useState(null);
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user details based on badgeId or document ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // First try to find user by badgeId
        const q = query(collection(db, "users"), where("badgeId", "==", id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setUser({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
          return;
        }

        // If not found by badgeId, try as document ID
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, [id]);

  // Fetch payroll data based on the badgeId from URL params
  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the badgeId to use for query
        const badgeIdToQuery = user?.badgeId || id;

        if (!badgeIdToQuery) {
          setError("No badge ID available for payroll query");
          return;
        }

        // Query payslips using the badgeId
        const q = query(
          collection(db, "payslips"),
          where("badgeId", "==", badgeIdToQuery)
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          return {
            id: doc.id,
            ...docData,
            // Calculate net salary if not present
            netSalary: docData.netSalary || 
              (Number(docData.basicSalary || 0) + 
               Number(docData.allowances || 0) - 
               Number(docData.deductions || 0)),
            // Format date if needed
            date: docData.date?.toDate ? docData.date.toDate() : new Date(docData.date)
          };
        });

        setPayrollData(data);
        if (data.length === 0) {
          setError("No payroll records found");
        }
      } catch (err) {
        console.error("Error fetching payroll data:", err);
        setError("Failed to load payroll data");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch payroll if we have user data or a direct badgeId
    if (user || id) {
      fetchPayroll();
    }
  }, [id, user]);

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
      <div className="employee-payroll-container">
        {/* Employee Payroll Profile Header */}
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
            {["/about", "/attendance", "/leave", "/employeepayroll", "/employeedashboard"].map((path) => (
              <NavLink
                key={path}
                to={`${path}/${user?.badgeId || user?.id || id}`}
                className={({ isActive }) => `profile-tab ${isActive ? "active" : ""}`}
              >
                {path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
              </NavLink>
            ))}
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
                  <th>Comment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map((payslip, index) => (
                  <tr key={payslip.id}>
                    <td>{index + 1}</td>
                    <td>
                      {payslip.date?.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td>₹{Number(payslip.basicSalary).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.allowances).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.deductions).toLocaleString("en-IN")}</td>
                    <td>₹{Number(payslip.netSalary).toLocaleString("en-IN")}</td>
                    <td>{payslip.bankName || "N/A"}</td>
                    <td>{payslip.ifsc || "N/A"}</td>
                    <td>{payslip.comment || "-"}</td>
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