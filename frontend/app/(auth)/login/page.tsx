"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Lock, X } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { login, googleAuth } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await login(data);
      setAuth(response.user, response.tokens);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await googleAuth(credentialResponse.credential);
      setAuth(response.user, response.tokens);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-500 bg-opacity-50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-red-900 to-red-800 rounded-2xl shadow-2xl p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          Login
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg text-white text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Input */}
          <div>
            <div className="relative">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600"
                size={20}
              />
              <input
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                className="w-full pl-12 pr-4 py-3.5 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-300">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Input */}
          <div>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                className="w-full pl-12 pr-12 py-3.5 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-300">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-red-300 hover:text-red-200 text-sm font-semibold"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login Now"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white opacity-30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-red-900 text-white">Or continue with</span>
          </div>
        </div>

        {/* Google Sign-In - Full Width Container */}
        <div className="w-full flex justify-center">
          <div className="w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Sign-In failed")}
              useOneTap
              shape="rectangular"
              size="large"
              text="signin_with"
              // theme="filled_blue"
              width="384"
            />
          </div>
        </div>

        {/* Signup Link */}
        <p className="text-center text-white mt-6">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-red-300 hover:text-red-200 font-semibold underline"
          >
            Signup
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}
