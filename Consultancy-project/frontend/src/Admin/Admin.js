import React, { useEffect, useState } from "react";
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
import "./Admin.css";

const Admin = () => {
  const [productionData, setProductionData] = useState([]);
  const [electricalData, setElectricalData] = useState([]);

  useEffect(() => {
    const dummyProduction = [
      { date: "2025-04-01", quantity: 100, downtime: 2 },
      { date: "2025-04-02", quantity: 120, downtime: 1.5 },
      { date: "2025-04-03", quantity: 90, downtime: 3 },
      { date: "2025-04-04", quantity: 110, downtime: 1 },
    ];

    const dummyElectrical = [
      { date: "2025-04-01", breakdowns: 2, repaired: 1 },
      { date: "2025-04-02", breakdowns: 3, repaired: 2 },
      { date: "2025-04-03", breakdowns: 1, repaired: 1 },
      { date: "2025-04-04", breakdowns: 4, repaired: 3 },
    ];

    const fetchProductionSummary = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/production-summary");
        const data = await res.json();
        setProductionData(data.length > 0 ? data : dummyProduction);
      } catch (error) {
        console.error("Error fetching production summary:", error);
        setProductionData(dummyProduction);
      }
    };

    const fetchElectricalSummary = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/electrical-summary");
        const data = await res.json();
        setElectricalData(data.length > 0 ? data : dummyElectrical);
      } catch (error) {
        console.error("Error fetching electrical summary:", error);
        setElectricalData(dummyElectrical);
      }
    };

    fetchProductionSummary();
    fetchElectricalSummary();
  }, []);

  return (
    <div className="container-fluid p-5">
      <h2 className="text-center text-primary mb-4">Admin Dashboard Summary</h2>

      {/* ✅ Production Summary Chart */}
      <div className="mb-5">
        <h4 className="text-success mb-3">Production Summary</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={productionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="quantity" stroke="#8884d8" name="Production Qty" />
            <Line type="monotone" dataKey="downtime" stroke="#FF8042" name="Downtime (Hands)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ✅ Electrical Summary Chart */}
      <div>
        <h4 className="text-success mb-3">Electrical Maintenance Summary</h4>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={electricalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="breakdowns" stroke="#82ca9d" name="Life in Days" />
            <Line type="monotone" dataKey="repaired" stroke="#8884d8" name="Life in Months" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Admin;
