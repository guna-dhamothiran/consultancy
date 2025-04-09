import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap integration
import "./Production.css"; // Custom CSS for styling

const departments = [
  "MIXING",
  "BR_CDG",
  "PREDRG",
  "LH15",
  "COMBER",
  "DRG",
  "SMX",
  "SPG",
  "ACWDG",
  "PACKBAGS",
];

const Production = () => {
  const [leftDate, setLeftDate] = useState("");
  const [rightDate, setRightDate] = useState("");
  const [leftGraphData, setLeftGraphData] = useState([]);
  const [rightGraphData, setRightGraphData] = useState([]);
  const [data, setData] = useState({});
  const [cumulative, setCumulative] = useState({});

  // Initialize data structure for the form
  useEffect(() => {
    const initialData = departments.reduce((acc, dept) => {
      acc[dept] = { ondate_prod: 0, ondate_hands: 0 };
      return acc;
    }, {});
    setData(initialData);
  }, []);

  // Fetch production data for left date
  useEffect(() => {
    if (leftDate) {
      fetch(`http://localhost:5000/production/selected-date/${leftDate}`)
        .then((res) => res.json())
        .then((data) => {
          setLeftGraphData(
            departments.map((dept) => ({
              name: dept,
              Production: data[dept]?.ondate_prod || 0,
              Hands: data[dept]?.ondate_hands || 0,
            }))
          );
        })
        .catch((err) => console.error("Error fetching left date data:", err));
    }
  }, [leftDate]);

  // Fetch production data for right date
  useEffect(() => {
    if (rightDate) {
      fetch(`http://localhost:5000/production/selected-date/${rightDate}`)
        .then((res) => res.json())
        .then((data) => {
          setRightGraphData(
            departments.map((dept) => ({
              name: dept,
              Production: data[dept]?.ondate_prod || 0,
              Hands: data[dept]?.ondate_hands || 0,
            }))
          );
        })
        .catch((err) => console.error("Error fetching right date data:", err));
    }
  }, [rightDate]);

  // Fetch cumulative data for the month corresponding to rightDate
  useEffect(() => {
    if (rightDate) {
      const month = rightDate.slice(0, 7); // Extract the YYYY-MM format
      fetch(`http://localhost:5000/cumulative/production/${month}`)

        .then((res) => res.json())
        .then((data) => setCumulative(data))
        .catch((err) => console.error("Error fetching cumulative data:", err));
    }
  }, [rightDate]);

  // Handle form input change
  const handleChange = (dept, field, value) => {
    setData((prev) => ({
      ...prev,
      [dept]: { ...prev[dept], [field]: Math.max(0, Number(value)) },
    }));
  };

  // Submit form data
  const handleSubmit = (e) => {
    e.preventDefault();
    const newData = { date: leftDate, ...data };

    fetch("http://localhost:5000/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        setLeftDate(""); // Clear the date after submission
      })
      .catch((err) => console.error("Error submitting data:", err));
  };

  return (
    <div className="container-fluid p-5">
      <div className="row mb-5">
        {/* Line Chart Section (Top) */}
        <div className="col-md-6 mb-4">
          <h3 className="text-primary font-weight-bold mb-3">Production Data - {leftDate || "Selected Date"}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={leftGraphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Production" stroke="#4e73df" strokeWidth={3} />
              <Line type="monotone" dataKey="Hands" stroke="#1cc88a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="col-md-6 mb-4">
          <h3 className="text-primary font-weight-bold mb-3">Production Data - {rightDate || "Selected Date"}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={rightGraphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Production" stroke="#e74a3b" strokeWidth={3} />
              <Line type="monotone" dataKey="Hands" stroke="#36b9cc" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="row">
        {/* Left Section (Form) */}
        <div className="col-md-6">
          <h2 className="text-primary font-weight-bold mb-4">Production Entry</h2>
          <form className="bg-light p-4 rounded shadow-lg" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Select Date:</label>
              <input
                type="date"
                value={leftDate}
                onChange={(e) => setLeftDate(e.target.value)}
                className="form-control shadow-sm"
                required
              />
            </div>
            <h3 className="text-secondary mb-3">Departments</h3>
            {departments.map((dept) => (
              <div key={dept} className="card mb-3 p-3 border-0 shadow-sm rounded">
                <h5 className="text-success font-weight-bold">{dept}</h5>
                <div className="mb-3">
                  <label className="form-label">On Date (PRODN):</label>
                  <input
                    type="number"
                    value={data[dept]?.ondate_prod || 0}
                    onChange={(e) => handleChange(dept, "ondate_prod", e.target.value)}
                    className="form-control shadow-sm"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">On Date (HANDS):</label>
                  <input
                    type="number"
                    value={data[dept]?.ondate_hands || 0}
                    onChange={(e) => handleChange(dept, "ondate_hands", e.target.value)}
                    className="form-control shadow-sm"
                    required
                  />
                </div>
              </div>
            ))}
            <button type="submit" className="btn btn-primary btn-block py-2 mt-4 shadow-sm">Submit</button>
          </form>
        </div>

        {/* Right Section (Cumulative Data) */}
        <div className="col-md-6">
          <h2 className="text-primary font-weight-bold mb-4">Cumulative Data</h2>
          <div className="mb-4">
            <label className="form-label">Select Date:</label>
            <input
              type="date"
              value={rightDate}
              onChange={(e) => setRightDate(e.target.value)}
              className="form-control shadow-sm"
            />
          </div>

          <h3 className="mt-4 text-secondary">Cumulative Data for {rightDate.slice(0, 7) || "Selected Month"}</h3>
          <table className="table table-bordered mt-3 rounded shadow-sm">
            <thead className="table-dark">
              <tr>
                <th>Department</th>
                <th>PRODN</th>
                <th>HANDS</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept}>
                  <td>{dept}</td>
                  <td>{cumulative[dept]?.prod || 0}</td>
                  <td>{cumulative[dept]?.hands || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Production;