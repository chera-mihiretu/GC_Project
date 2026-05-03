"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { organization, useSession } from "@/lib/auth-client";
import { FiCheckCircle, FiXCircle, FiLoader } from "react-icons/fi";

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [fetchingInvite, setFetchingInvite] = useState(true);

  useEffect(() => {
    if (!id) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${apiBase}/api/v1/auth/invitation/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.email) setInviteEmail(data.email);
        if (data.organizationName) setOrgName(data.organizationName);
      })
      .catch(() => {})
      .finally(() => setFetchingInvite(false));
  }, [id]);

  useEffect(() => {
    if (!id || isPending || fetchingInvite) return;

    async function acceptInvitation() {
      try {
        await organization.acceptInvitation({ invitationId: id });
        setStatus("success");
        setMessage("You have successfully joined the team!");
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Failed to accept invitation";
        setMessage(msg);
      }
    }

    if (session?.user) {
      acceptInvitation();
    }
  }, [id, session, isPending, fetchingInvite]);

  if (!session?.user) {
    if (fetchingInvite || isPending) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
            <FiLoader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading invitation details...</p>
          </div>
        </div>
      );
    }

    const registerParams = new URLSearchParams({
      redirect: `/accept-invitation/${id}`,
      invitation: "1",
      role: "vendor",
    });
    if (inviteEmail) registerParams.set("email", inviteEmail);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Team Invitation
          </h1>
          {orgName && (
            <p className="text-sm text-blue-600 font-medium mb-2">{orgName}</p>
          )}
          <p className="text-sm text-gray-500 mb-1">
            {inviteEmail
              ? <>You&apos;ve been invited as <strong>{inviteEmail}</strong></>
              : "You've been invited to join a team"}
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Log in or create an account to accept.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push(`/login?redirect=/accept-invitation/${id}${inviteEmail ? `&email=${encodeURIComponent(inviteEmail)}` : ""}`)}
              className="cursor-pointer w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => router.push(`/register?${registerParams.toString()}`)}
              className="cursor-pointer w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <FiLoader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Accepting Invitation...
            </h1>
            <p className="text-sm text-gray-500">Please wait while we add you to the team.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Welcome to the Team!
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => router.push("/vendor/dashboard")}
              className="cursor-pointer px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FiXCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Failed
            </h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => router.push("/")}
              className="cursor-pointer px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
