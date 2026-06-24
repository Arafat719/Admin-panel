import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout({ title, children }) {
  return (
    <>
      <Sidebar />
      <Header title={title} />
      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          paddingTop: "var(--header-height)",
          minHeight: "100vh",
          background: "var(--bg-primary)",
          transition: "margin-left var(--transition)",
        }}
      >
        {children}
      </main>
    </>
  );
}
