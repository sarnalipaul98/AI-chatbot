
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "register" : "login";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          )
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Authentication failed");
      }

      if (isRegister) {
        setIsRegister(false);
        setPassword("");
        setError("Registration successful! Please log in.");
      } else {
        localStorage.setItem("chatbot_token", data.token);

if (data.user?.role === "admin") {
  router.push("/admin");
} else {
  router.push("/");
}
      }

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">🤖</div>

          <h1 className="text-3xl font-bold text-gray-900">
            AI Chatbot
          </h1>

          <p className="mt-2 text-gray-500">
            {isRegister
              ? "Create your account"
              : "Welcome back! Please log in"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {isRegister && (
            <input
  type="text"
  placeholder="Full name"
  value={name}
  onChange={(e) => {
    const value = e.target.value;

    if (/^[a-zA-Z\s]*$/.test(value)) {
      setName(value);
    }
  }}
  required
  className="w-full rounded-lg border p-3 text-gray-900 outline-none focus:border-blue-500"
/>
          )}

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border p-3 text-gray-900 outline-none focus:border-blue-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border p-3 text-gray-900 outline-none focus:border-blue-500"
          />

          {error && (
            <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setPassword("");
            }}
            className="ml-2 font-semibold text-blue-600 hover:underline"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

      </div>
    </main>
  );
}
