"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import Link from "next/link";

const Signup = () => {
  const router = useRouter();
  const setEmail = useUserStore((s) => s.setEmail);

  const API_URL = "/api/signup";

  const generateCaptcha = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, result: a + b };
  }, []);

  const [captcha, setCaptcha] = useState(null);
  const [inputCaptcha, setInputCaptcha] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referral: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [valid, setValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCaptcha(generateCaptcha());
  }, [generateCaptcha]);

  const gmailRegex = useMemo(() => /^[\w.%+-]+@gmail\.com$/i, []);

  const validate = useCallback(() => {
    const newErrors = {};

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name) newErrors.name = "Name is required";
    else if (name.length < 3) newErrors.name = "Minimum 3 characters";
    else if (name.length > 18) newErrors.name = "Maximum 18 characters";

    if (!email) newErrors.email = "Email is required";
    else if (!gmailRegex.test(email))
      newErrors.email = "Only Gmail addresses allowed";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "At least 6 characters";
    else if (password.length > 18) newErrors.password = "Maximum 18 characters";

    if (!confirmPassword) newErrors.confirmPassword = "Confirm your password";
    else if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!inputCaptcha.trim()) newErrors.captcha = "Captcha is required";
    else if (captcha && parseInt(inputCaptcha, 10) !== captcha.result)
      newErrors.captcha = "Incorrect captcha";

    setErrors(newErrors);
    setValid(Object.keys(newErrors).length === 0);
  }, [form, inputCaptcha, captcha, gmailRegex]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    validate();
    if (!valid || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        referral: form.referral?.trim() || undefined,
      };

      const res = await axios.post(API_URL, payload, { timeout: 15000 });
      const ok = res?.data?.success;

      if (ok) {
        toast.success(res?.data?.message || "Signup successful ✅", {
          position: "top-center",
        });
        setEmail(form.email.trim());

        setCaptcha(generateCaptcha());
        setInputCaptcha("");
        setForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          referral: "",
        });
        setTouched({});

        setTimeout(() => {
          router.push("/users/send-otp");
        }, 2000);
      } else {
        toast.error(
          res?.data?.message || "Something went wrong. Please try again.",
          {
            position: "top-center",
          }
        );
        setIsSubmitting(false);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not connect to the server. Please try again later.";
      toast.error(msg, { position: "top-center" });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleBlur = (e) =>
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));

  const renderFeedback = (field) => {
    if (!touched[field]) return null;
    if (errors[field]) {
      return (
        <div className="flex items-center gap-1 text-rose-400 text-[11px] mt-1">
          <XCircle size={12} /> {errors[field]}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-emerald-400 text-[11px] mt-1">
        <CheckCircle2 size={12} /> Done
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-3 text-white bg-[radial-gradient(80%_60%_at_20%_10%,#3b0764_0%,#0b1220_60%,#030712_100%)] overflow-hidden">
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: "linear-gradient(135deg, #3b0764, #1e1b4b, #0f172a)",
          color: "#f1f5f9",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
        progressStyle={{
          background: "linear-gradient(90deg, #ec4899, #8b5cf6, #06b6d4)",
          height: "3px",
          borderRadius: "10px",
        }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-52 w-52 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br from-fuchsia-500/40 via-violet-500/40 to-sky-500/40 shadow-[0_0_40px_-10px_rgba(99,102,241,0.45)]">
        <div className="rounded-2xl sm:rounded-3xl bg-slate-950/80 backdrop-blur-xl p-4 sm:p-6 ring-1 ring-white/10">
          <h1 className="text-xl sm:text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300">
            Create Account
          </h1>
          <p className="mt-1 text-center text-white/60 text-xs sm:text-sm">
            Sign up to get started
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-3 space-y-3 text-xs sm:text-sm"
          >
            {/* Name */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="name"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="John Doe"
                disabled={isSubmitting}
                autoComplete="name"
                aria-invalid={!!errors.name}
                className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                  ${
                    touched.name && errors.name
                      ? "ring-rose-500 focus:ring-rose-400"
                      : touched.name && !errors.name
                      ? "ring-emerald-500 focus:ring-emerald-400"
                      : "ring-white/10"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              />
              {renderFeedback("name")}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@gmail.com"
                disabled={isSubmitting}
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                  ${
                    touched.email && errors.email
                      ? "ring-rose-500 focus:ring-rose-400"
                      : touched.email && !errors.email
                      ? "ring-emerald-500 focus:ring-emerald-400"
                      : "ring-white/10"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              />
              {renderFeedback("email")}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                    ${
                      touched.password && errors.password
                        ? "ring-rose-500 focus:ring-rose-400"
                        : touched.password && !errors.password
                        ? "ring-emerald-500 focus:ring-emerald-400"
                        : "ring-white/10"
                    } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white disabled:opacity-40"
                >
                  {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
              {renderFeedback("password")}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="••••••"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 pr-7 sm:pr-8 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                    ${
                      touched.confirmPassword && errors.confirmPassword
                        ? "ring-rose-500 focus:ring-rose-400"
                        : touched.confirmPassword && !errors.confirmPassword
                        ? "ring-emerald-500 focus:ring-emerald-400"
                        : "ring-white/10"
                    } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isSubmitting}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white disabled:opacity-40"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={12} />
                  ) : (
                    <Eye size={12} />
                  )}
                </button>
              </div>
              {renderFeedback("confirmPassword")}
            </div>

            {/* Referral Code */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="referral"
              >
                Referral Code
              </label>
              <input
                id="referral"
                type="text"
                name="referral"
                value={form.referral}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Optional"
                autoComplete="off"
                className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              />
            </div>

            {/* Captcha (50/50 layout) */}
            <div>
              <label
                className="block text-[11px] text-white/70 mb-1"
                htmlFor="captcha"
              >
                Verify Captcha
              </label>
              <div className="grid grid-cols-2 gap-2 items-stretch">
                <div className="col-span-1">
                  <input
                    id="captcha"
                    type="number"
                    name="captcha"
                    value={inputCaptcha}
                    onChange={(e) => setInputCaptcha(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Enter"
                    disabled={isSubmitting}
                    inputMode="numeric"
                    aria-invalid={!!errors.captcha}
                    className={`w-full rounded-lg bg-slate-900/70 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm ring-1 focus:outline-none focus:ring-2 transition
                      ${
                        touched.captcha && errors.captcha
                          ? "ring-rose-500 focus:ring-rose-400"
                          : touched.captcha && !errors.captcha
                          ? "ring-emerald-500 focus:ring-emerald-400"
                          : "ring-white/10"
                      } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                  />
                  {renderFeedback("captcha")}
                </div>

                {captcha && (
                  <div className="col-span-1 flex items-center justify-center rounded-lg font-mono text-sm sm:text-base font-bold ring-1 ring-white/10 bg-slate-800">
                    {captcha.a} + {captcha.b}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!valid || isSubmitting}
              aria-disabled={!valid || isSubmitting}
              className={`w-full mt-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold text-white ring-1 ring-white/10 shadow-md transition flex items-center justify-center gap-2
                ${
                  !valid || isSubmitting
                    ? "bg-slate-800 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 hover:opacity-90"
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Processing...
                </>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* Signin link */}
            <p className="mt-4 text-center text-xs sm:text-sm text-white/70">
              Already have an account{" "}
              <Link
                href="/page/signin"
                className="font-semibold bg-gradient-to-r from-fuchsia-400 via-violet-300 to-sky-400 bg-clip-text text-transparent hover:opacity-80"
              >
                Sign in here
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
