import React from "react";
import Sidebar from "@/components/Sidebar";
import ForcePasswordResetModal from "@/components/ForcePasswordResetModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-main)" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          minWidth: 0,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ForcePasswordResetModal />
        {children}
      </main>
    </div>
  );
}
