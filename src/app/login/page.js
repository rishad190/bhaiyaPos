"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import logger from "@/utils/logger";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { loginSchema } from "@/lib/schemas";

import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data) => {
    try {
      if (loginAttempts >= 5) {
        setError("root", { 
          message: "Too many failed attempts. Please try again later." 
        });
        return;
      }

      const result = await login(data.password);
      
      if (result.success) {
        setIsLoading(true); // Transition state
        await router.push("/");
      } else {
        setLoginAttempts((prev) => prev + 1);
        setError("root", {
           message: `Invalid password. ${5 - (loginAttempts + 1)} attempts remaining.`
        });
        setError("password", { message: "Invalid password" });
      }
    } catch (error) {
      logger.error("Login error:", error);
      setError("root", { message: "An error occurred during login" });
    }
  };

  if (isLoading && !isSubmitting) { // Show initial loader or transition loader
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="space-y-4">
          <div className="flex justify-center">
            <Image
              src="/download.png"
              alt="Sky Fabric Logo"
              width={80}
              height={80}
              className="rounded-lg shadow-sm"
              priority
            />
          </div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sky Fabric's
          </h2>
          <p className="text-center text-sm text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {errors.root && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-600 text-sm text-center">{errors.root.message}</p>
            </div>
          )}

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              {...register("password")}
              className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
             <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
            disabled={isSubmitting || loginAttempts >= 5 || isLoading}
          >
            {isSubmitting || isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Sky Fabric's. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
