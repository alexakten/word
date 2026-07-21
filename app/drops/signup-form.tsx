"use client";

import { FormEvent, useState } from "react";
import styles from "./drops.module.css";

type FormStatus = "idle" | "submitting" | "success" | "error";

export function SignupForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          website: formData.get("website"),
        }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) throw new Error(data.message ?? "Something went wrong. Please try again.");

      setStatus("success");
      setMessage(data.message ?? "You’re on the list. Keep an eye on your inbox.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className={styles.formWrap}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="drops-email">Email address</label>
        <input
          id="drops-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="your@email.com"
          required
          disabled={status === "submitting" || status === "success"}
        />
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="drops-website">Website</label>
          <input id="drops-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" disabled={status === "submitting" || status === "success"}>
          {status === "submitting" ? "Joining…" : status === "success" ? "You’re in ✓" : "Get Drops"}
        </button>
      </form>
      <p className={styles.formNote} aria-live="polite">
        {message || "By subscribing, you agree to receive Spellsurf Drops by email."}
      </p>
    </div>
  );
}
