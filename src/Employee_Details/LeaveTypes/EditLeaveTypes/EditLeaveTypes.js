import React from 'react'

const EditLeaveTypes = () => {
  return (
    <div className='Edit-leave-types-container'>

               <h2 className="Edit-leave-textalign-center">Add Leave Type</h2>
        <div className="form-group">
          <input
            type="text"
            placeholder="Leave Name"
            required
            className="form-input"
          />
        </div>

     
          <div className="form-group">
            <input
              type="text"
              readOnly
              className="form-input"
              style={{ background: "#f0f0f0", fontWeight: "bold" }}
            />
          </div>
     
      
        <div className="form-group">
          <select
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
           
            placeholder=" Days"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Submit
        </button>
    </div>
  )
}

export default EditLeaveTypes