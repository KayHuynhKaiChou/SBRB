import React from 'react';

// TODO: Implement onboarding page (SRS 4.1.2)
// - 2 options: "Tạo Business mới" (Owner) or "Tôi có link mời" (Staff/Viewer)
// - Owner path → create Business → redirect to dashboard
// - Invited path → enter invite code or click email link → join Business
export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">SBRB</h1>
        <p className="text-neutral-500 mt-2">Onboarding page — to be implemented</p>
      </div>
    </div>
  );
}
