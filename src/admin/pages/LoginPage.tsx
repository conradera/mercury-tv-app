import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, EyeOff, Monitor, ShieldCheck } from "lucide-react";
import { authService } from "../services/authService";
const schema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});
export function LoginPage() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: false },
  });
  return (
    <div className="admin-app admin-login">
      <section className="login-story">
        <a href="/" className="admin-brand">
          <img
            className="admin-mercury-logo"
            src="/mercury-logo.png"
            alt="Mercury Computers"
          />
          <span>
            mercury<small>SIGNAGE CONTROL</small>
          </span>
        </a>
        <div>
          <span className="admin-eyebrow">ONE WORKSPACE. EVERY SCREEN.</span>
          <h1>
            Your network.
            <br />
            Your content.
            <br />
            <em>In perfect sync.</em>
          </h1>
          <p>The control center for Mercury’s digital showroom experience.</p>
          <div className="login-screen-art">
            <Monitor />
            <span>
              <i />
              MERCURY DISPLAY NETWORK
            </span>
            <strong>
              Big ideas.
              <br />
              <em>Powerful possibilities.</em>
            </strong>
            <div className="art-blocks">
              <b />
              <b />
              <b />
            </div>
          </div>
        </div>
        <small>Mercury Computers Limited · Digital Signage</small>
      </section>
      <section className="login-form-wrap">
        <div className="login-form">
          <span className="small-kicker">WELCOME BACK</span>
          <h2>Sign in to your workspace</h2>
          <p>Manage your content. Connect every screen.</p>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              setError("");
              try {
                const user = await authService.login(
                  values.email,
                  values.password,
                  values.remember,
                );
                client.setQueryData(["auth"], user);
                navigate("/admin");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to sign in.");
              }
            })}
          >
            <label>
              Email address
              <input
                autoComplete="username"
                type="email"
                placeholder="you@mercury.local"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <small className="field-error">
                  {form.formState.errors.email.message}
                </small>
              )}
            </label>
            <label>
              Password
              <div className="password-field">
                <input
                  autoComplete="current-password"
                  type={show ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {form.formState.errors.password && (
                <small className="field-error">
                  {form.formState.errors.password.message}
                </small>
              )}
            </label>
            <div className="login-options">
              <label>
                <input type="checkbox" {...form.register("remember")} />
                Remember me
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setForgot(true)}
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {forgot && (
              <div className="form-hint">
                Password recovery is not connected in this frontend demo. Use
                the development credentials below.
              </div>
            )}
            <button
              className="btn primary login-submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="demo-credentials">
            <ShieldCheck size={20} />
            <div>
              <b>Development workspace</b>
              <span>
                admin@mercury.local <i> / </i> admin123
              </span>
              <small>Mock authentication · not for production security</small>
            </div>
          </div>
        </div>
        <small className="login-footnote">
          Technology. Business. Connected.
        </small>
      </section>
    </div>
  );
}
