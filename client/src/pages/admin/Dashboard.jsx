import React, { useState, useEffect } from "react";
import RecentReservations from "./RecentReservations";
import EditRole from "./EditRole";
import StatCard from "./StatCard";
import axios from "axios";
const Dashboard = () => {
  const [stats, setStats] = useState([
    { icon: "🏠", count: 0, label: "Tipos de cuartos" },
    { icon: "📘", count: 0, label: "Reservaciones" },
    { icon: "👍", count: 0, label: "Confirmadas" },
    { icon: "👥", count: 0, label: "Eventos" },
  ]);

  useEffect(() => {
    axios
      .get("https://dreamapi.azurewebsites.net/reservaciones/stats")
      .then((response) => {
        setStats(response.data.iconStats);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
      });
  }, []);

  return (
    <div className="min-h-screen bg-darkWhite">
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <StatCard
            key={index}
            icon={item.icon}
            count={item.count}
            label={item.label}
          />
        ))}
      </div>
      <EditRole />
      <RecentReservations />
    </div>
  );
};

export default Dashboard;