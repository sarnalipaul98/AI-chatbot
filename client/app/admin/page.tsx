
"use client";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminDashboard() {
    const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("chatbot_token");

        const response = await fetch(`${API_URL}/api/admin/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
  localStorage.removeItem("chatbot_token");
  router.replace("/");
  return;
}

if (!response.ok || !data.success) {
  throw new Error(data.message || "Failed to load analytics");
}
        setAnalytics(data.analytics);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gray-950 p-10 text-white">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-950 p-10 text-red-400">{error}</div>;
  }
  if (!analytics) {
  return null;
}

  const stats = [
    { title: "Total Users", value: analytics.totalUsers },
    { title: "Conversations", value: analytics.totalConversations },
    { title: "Total Messages", value: analytics.totalMessages },
    { title: "User Messages", value: analytics.totalUserMessages },
    { title: "AI Responses", value: analytics.totalAIResponses },
    { title: "Active Users", value: analytics.activeUsers },
    { title: "Average Rating", value: `${analytics.averageRating} / 5` },
  ];

  return (
    <main className="min-h-screen bg-gray-950 p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl">
        
<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
  <div>
    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
    <p className="mt-2 text-gray-400">
      Monitor chatbot users, conversations and performance.
    </p>
  </div>

  <div className="flex gap-3">
    <button
      onClick={() => (window.location.href = "/")}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Back to Chat
    </button>

    <button
      onClick={() => {
        localStorage.removeItem("chatbot_token");
        window.location.href = "/";
      }}
      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Logout
    </button>
  </div>
</div>


        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-gray-800 bg-gray-900 p-6"
            >
              <p className="text-sm text-gray-400">{stat.title}</p>
              <h2 className="mt-3 text-3xl font-bold">{stat.value}</h2>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h2 className="mb-5 text-xl font-semibold">Daily Messages</h2>

          <div className="space-y-4">
            {analytics.dailyMessages.map((day: any) => {
              const maximum = Math.max(
                ...analytics.dailyMessages.map((item: any) => item.count),
                1
              );

              return (
                <div key={day._id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-300">{day._id}</span>
                    <span className="text-gray-400">{day.count} messages</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(day.count / maximum) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        


      </div>
    </main>
  );
}
