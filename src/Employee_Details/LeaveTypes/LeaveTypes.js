import React, { useState, useEffect } from "react";
import NavbarTopbar from "../Navbar/NavbarTopbar";
import { FaEllipsisV, FaPlus, FaTimes } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { db } from "../../Employee_Details/Firebase/Firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import "./LeaveTypes.css";

const LeaveTypes = () => {
    const [search, setSearch] = useState("");
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null); // popup
    const navigate = useNavigate();

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        const snapshot = await getDocs(collection(db, "leavetypes"));
        const leaves = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        setLeaveTypes(leaves);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this leave type?")) {
            await deleteDoc(doc(db, "leavetypes", id));
            setLeaveTypes(leaveTypes.filter((leave) => leave.id !== id));
        }
    };

    const toggleMenu = (index) => {
        setOpenMenuIndex(openMenuIndex === index ? null : index);
    };

    const filteredLeaves = leaveTypes.filter((leave) =>
        leave.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <NavbarTopbar />

            <div className="leaves-types-container">
                <h2 className="leave-types-headername">Leave Types</h2>
                <div className="leaves-types-header">
                    <div className="leaves-types-search">
                        <input
                            type="text"
                            placeholder="Search Leave..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <NavLink to="/addleavetypes" className="leaves-types-create">
                        <FaPlus /> Create
                    </NavLink>
                </div>

                {/* Cards Section */}
                <div className="leaves-types-cards">
                    {filteredLeaves.map((leave, index) => (
                        <div
                            className={`leave-card ${leave.type === "Paid" ? "paid-border" : "unpaid-border"
                                }`}
                            key={leave.id}
                            onClick={() => setSelectedCard(leave)} // mobile popup
                        >
                            <div className="leave-card-header">
                                <h4>{leave.name}</h4>
                                <div
                                    className="leave-card-menu"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <FaEllipsisV onClick={() => toggleMenu(index)} />
                                    {openMenuIndex === index && (
                                        <div className="leave-card-dropdown">
                                            <button onClick={() => navigate(`/edit-leavetype/${leave.id}`)}>
                                                Edit
                                            </button>
                                            <button onClick={() => handleDelete(leave.id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="leave-card-footer">
                                
                            <div className="leave-card-icon">
                                {leave.icon}
                            </div>
                                <div className="footer-section">
                                    
                                    <p className="footer-label">Payment</p>
                                    <p className="footer-value">{leave.type}</p>
                                </div>
                                <div className="footer-section">
                                    <p className="footer-label">Total Days</p>
                                    <p className="footer-value">{leave.totalDays}</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>


        </>
    );
};

export default LeaveTypes;
