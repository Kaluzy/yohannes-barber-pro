"use client";

export default function PayDepositButton({ appointmentId }: { appointmentId: string }) {
  async function payDeposit() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert(data.error ?? "Unable to open Stripe checkout");
  }

  return (
    <button onClick={payDeposit} className="mt-3 rounded-xl bg-gold px-4 py-2 font-bold text-black">
      Pay Deposit
    </button>
  );
}
