"use client";

import AuthGuard from "@/components/auth-guard";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function CoupleDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <AuthGuard allowedRoles={["couple"]}>
      <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 24 }}>Wedding Dashboard</h1>
          <button
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
            style={{
              padding: "8px 16px",
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Sign out
          </button>
        </div>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Welcome, {session?.user?.name}! Start planning your perfect day.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {["Budget", "Checklist", "Guest List", "Vendor Bookings"].map(
            (item) => (
              <div
                key={item}
                style={{
                  padding: 24,
                  border: "1px solid #eee",
                  borderRadius: 12,
                  background: "#fafafa",
                }}
              >
                <h3 style={{ marginBottom: 8 }}>{item}</h3>
                <p style={{ color: "#999", fontSize: 14 }}>Coming soon</p>
              </div>
            ),
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
