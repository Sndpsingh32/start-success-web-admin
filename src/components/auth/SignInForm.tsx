import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import { api } from "../../lib/api";
import { clearAdminSession, setAuthTokens } from "../../lib/auth-session";

export default function SignInForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email.trim(), password);
      if (!res.access_token) {
        throw new Error("No access token returned");
      }
      setAuthTokens(res.access_token, res.refresh_token);
      const me = await api.auth.me();
      if (me.role !== "admin") {
        clearAdminSession();
        throw new Error("This account is not an administrator. Use the seeded admin user.");
      }
      try {
        localStorage.setItem("adminUser", JSON.stringify(me));
      } catch {
        /* ignore */
      }
      const from = (location.state as { from?: string } | null)?.from;
      const target =
        from && from !== "/signin" && from.startsWith("/") && !from.startsWith("//") ? from : "/admin/courses";
      navigate(target, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Sign in failed";
      if (msg === "Unauthorized" || msg.includes("401")) {
        setError(
          "Invalid email or password, or the API/database is unavailable. " +
            "Admin login: admin@edupath.local / Admin123! — Demo users (alex@demo.local) use the Explorer app, not this portal.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 px-4">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-6">
        <div>
          <div className="mb-4 text-center">
            <Link to="/" className="inline-block mb-4">
              <img src="/images/star-success.png" alt="StartSuccess" className="h-12 w-auto mx-auto" />
            </Link>
            <h1 className="mb-1 font-display font-bold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Admin Portal
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Welcome to <span className="text-brand-500 font-bold">StartSuccess</span> Control Center.
            </p>
          </div>
          <div>
            {error ? (
              <div className="mb-4">
                <Alert variant="error" title="Sign in failed" message={error} />
              </div>
            ) : null}
            
            <div className="mb-4 rounded-lg border border-brand-500/20 bg-brand-500/5 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
              <p className="font-semibold text-brand-600 dark:text-brand-400">Admin only</p>
              <p className="mt-1">
                <span className="font-medium">admin@edupath.local</span> / <span className="font-medium">Admin123!</span>
              </p>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Demo users (e.g. alex@demo.local) sign in on the Explorer app at{" "}
                <span className="font-mono">localhost:5173</span>, not here.
              </p>
            </div>
            <div className="relative py-2 sm:py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-1 text-gray-400 bg-white dark:bg-gray-900 sm:px-4 sm:py-1 italic text-[10px] uppercase tracking-widest">Credentials</span>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-xs dark:text-gray-400">Keep me logged in</span>
                  </div>
                  <Link to="/reset-password" className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={loading} onClick={() => void handleSignIn()}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link to="/signup" className="text-brand-500 font-bold hover:text-brand-600 dark:text-brand-400">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
