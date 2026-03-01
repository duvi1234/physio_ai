import React from "react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 p-6">
      <div className="rounded-2xl border border-white/20 bg-white/20 p-8 text-center shadow-xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Unauthorized Access</h1>
        <p className="mt-2 text-sm text-slate-600">Your role does not have permission to access this route.</p>
      </div>
    </div>
  );
}
