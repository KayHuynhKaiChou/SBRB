import React from 'react';

// TODO: Implement main dashboard page (SRS 4.4)
// - AppLayout: Header (logo, business switcher, notifications, avatar)
// - Sidebar: Tab list with drag-sort
// - Main area: Free-form canvas with react-rnd widgets
// - Canvas controls: zoom (50/75/100/125%), snap toggle, mini-map
export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col bg-neutral-50">
      <div className="text-center mt-20">
        <h1 className="text-2xl font-semibold text-neutral-900">SBRB Dashboard</h1>
        <p className="text-neutral-500 mt-2">Dashboard page — to be implemented</p>
      </div>
    </div>
  );
}
