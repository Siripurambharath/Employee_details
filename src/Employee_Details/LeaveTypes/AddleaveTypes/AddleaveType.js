import React, { useState } from "react";
import { db } from "../../Firebase/Firebase"; 
import { collection, addDoc } from "firebase/firestore";
import "./AddleaveType.css";
import NavbarTopbar from "../../Navbar/NavbarTopbar";
import { useNavigate } from "react-router-dom";

const AddleaveType = () => {
    const navigate = useNavigate(); 
  const [leaveName, setLeaveName] = useState("");
  const [leaveIcon, setLeaveIcon] = useState("");
  const [leaveType, setLeaveType] = useState("Paid");
  const [totalDays, setTotalDays] = useState("");

  const handleNameChange = (e) => {
    const name = e.target.value;
    setLeaveName(name);

    // Generate Icon automatically (take first letters of each word)
    const icon = name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");
    setLeaveIcon(icon);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveName || !totalDays) {
      alert("Please fill all fields");
      return;
    }
    try {
      await addDoc(collection(db, "leavetypes"), {
        name: leaveName,
        icon: leaveIcon,
        type: leaveType,
        totalDays: Number(totalDays),
        createdAt: new Date(),
      });
      alert("Leave type added successfully!");
      setLeaveName("");
      setLeaveIcon("");
      setLeaveType("Paid");
      setTotalDays("");
        navigate("/leavetypes"); 
    } catch (error) {
      console.error("Error adding leave type:", error);
    }
  };

  return (
    <>
    <NavbarTopbar />
    <div className="add-leave-type-container">
     
      <form className="add-leave-form" onSubmit={handleSubmit}>
        
       <h2 className="add-leave-textalign-center">Add Leave Type</h2>
        <div className="form-group">
          <input
            type="text"
            value={leaveName}
            onChange={handleNameChange}
            placeholder="Leave Name"
            required
            className="form-input"
          />
        </div>

        {/* Show generated icon (read-only) */}
        {leaveIcon && (
          <div className="form-group">
            <input
              type="text"
              value={leaveIcon}
              readOnly
              className="form-input"
              style={{ background: "#f0f0f0", fontWeight: "bold" }}
            />
          </div>
        )}

        {/* Paid/Unpaid Dropdown */}
        <div className="form-group">
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            required
          >
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>

        {/* Total Days */}
        <div className="form-group">
          <input
            type="number"
            value={totalDays}
            onChange={(e) => setTotalDays(e.target.value)}
            placeholder=" Days"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
    </>
  );
};

export default AddleaveType;
