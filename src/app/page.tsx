"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const sessionToken = localStorage.getItem("session_token");
    const user = localStorage.getItem("user");
    
    if (!sessionToken && !user) {
      // Redirect to login if not authenticated
      router.push("/ticket");
    } else {
      // Redirect to analytics/dashboard if authenticated
      router.push("/analytics");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}