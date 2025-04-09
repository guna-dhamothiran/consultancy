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
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import "./Electrical.css";

const sections = ["TOP_APRON", "MIDDLE_APRON", "BOTTOM_APRON"];

const ElectricalMaintenance = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [cumulativeData, setCumulativeData] = useState([]);
  const [formData, setFormData] = useState(
    sections.reduce((acc, section) => {
      acc[section] = { type: "", date: "" };
      return acc;
    }, {})
  );

  // ✅ Automatically Calculate Life in Days, Months & Next Schedule
  const calculateLife = (date) => {
    if (!date) return { days: 0, months: 0, nextSchedule: "-" };

    const currentDate = new Date();
    const inputDate = new Date(date);
    const diffTime = Math.abs(currentDate - inputDate);
    const lifeInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const lifeInMonths = (lifeInDays / 30.44).toFixed(2);

    const nextSchedule = new Date(inputDate);
    nextSchedule.setFullYear(nextSchedule.getFullYear() + 2);
    const formattedNext = nextSchedule.toISOString().split("T")[0];

    return {
      days: lifeInDays,
      months: lifeInMonths,
      nextSchedule: formattedNext,
    };
  };

  // ✅ Fetch All Cumulative Data from Backend
  const fetchCumulativeData = async () => {
    try {
      const response = await fetch("http://localhost:5000/electrical-all");
      const data = await response.json();

      if (response.ok) {
        const formattedData = data.flatMap((record) =>
          Object.entries(record.sections).map(([section, details]) => ({
            date: record.date,
            section,
            type: details.type,
            lifeInDays: details.lifeInDays,
            lifeInMonths: details.lifeInMonths,
            nextSchedule: details.nextSchedule,
          }))
        );

        setCumulativeData(formattedData);
      } else {
        console.error("Failed to fetch data:", data.message);
      }
    } catch (error) {
      console.error("Error fetching cumulative data:", error);
    }
  };

  useEffect(() => {
    fetchCumulativeData();
  }, []);

  // ✅ Handle Form Changes
  const handleChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  // ✅ Handle Form Submission with Cumulative Adding
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedSections = sections.reduce((acc, section) => {
      const { type, date } = formData[section];
      const { days, months, nextSchedule } = calculateLife(date);

      acc[section] = {
        type,
        date,
        lifeInDays: days,
        lifeInMonths: months,
        nextSchedule,
      };

      return acc;
    }, {});

    try {
      const response = await fetch("http://localhost:5000/add-electrical", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          sections: formattedSections,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: result.message,
          icon: "success",
          timer: 2000,
        });

        // ✅ Add the new entry to the cumulative table without re-fetching all data
        const newData = Object.entries(formattedSections).map(
          ([section, details]) => ({
            date: selectedDate,
            section,
            type: details.type,
            lifeInDays: details.lifeInDays,
            lifeInMonths: details.lifeInMonths,
            nextSchedule: details.nextSchedule,
          })
        );

        // ✅ Append new data to the existing cumulativeData
        setCumulativeData((prevData) => [...prevData, ...newData]);

      } else {
        Swal.fire({
          title: "Error!",
          text: result.message,
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to submit data",
        icon: "error",
        timer: 2000,
      });
    }
  };

  return (
    <div className="container-fluid p-5">
      
      {/* ✅ Form Section */}
      <div className="row">
        <div className="col-md-6">
          <h3 className="text-primary mb-4">Enter Maintenance Data</h3>
          <form className="bg-light p-4 rounded shadow-lg" onSubmit={handleSubmit}>
            
            <div className="mb-4">
              <label className="form-label">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control"
                required
              />
            </div>

            {sections.map((section) => (
              <div key={section} className="card mb-3 p-3 shadow-sm">
                <h5 className="text-success">{section}</h5>
                
                <div className="mb-3">
                  <label className="form-label">Type:</label>
                  <input
                    type="text"
                    value={formData[section]?.type || ""}
                    onChange={(e) => handleChange(section, "type", e.target.value)}
                    className="form-control"
                    placeholder="Enter machine type (LR, JEETS, etc.)"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Date:</label>
                  <input
                    type="date"
                    value={formData[section]?.date || ""}
                    onChange={(e) => handleChange(section, "date", e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary w-100 mt-4">
              Submit
            </button>
          </form>
        </div>

        {/* ✅ Cumulative Data Table */}
        <div className="col-md-6">
          <h3 className="text-primary mb-4">Cumulative Data</h3>

          {cumulativeData.length > 0 ? (
            <table className="table table-bordered table-striped rounded shadow-lg">
              <thead className="table-dark">
                <tr>
                  <th>Date</th>
                  <th>Section</th>
                  <th>Type</th>
                  <th>Days</th>
                  <th>Months</th>
                  <th>Next Schedule</th>
                </tr>
              </thead>
              <tbody>
                {cumulativeData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{item.section}</td>
                    <td>{item.type}</td>
                    <td>{item.lifeInDays}</td>
                    <td>{item.lifeInMonths}</td>
                    <td>{item.nextSchedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="alert alert-warning">
              No cumulative data available. Enter details first.
            </div>
          )}
        </div>
      </div>

      {/* ✅ Graph Visualization */}
      <div className="row mt-5">
        <div className="col-12">
          <h3 className="text-primary text-center">Graph Visualization</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lifeInDays" stroke="#8884d8" name="Days" />
              <Line type="monotone" dataKey="lifeInMonths" stroke="#82ca9d" name="Months" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ElectricalMaintenance;
