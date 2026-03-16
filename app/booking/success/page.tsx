import Link from "next/link";
import PayDepositButton from "@/components/PayDepositButton";

export default async function BookingSuccess({
  searchParams
}: {
  searchParams: Promise<{ id?: string; deposit?: string; paid?: string }>;
}) {
  const sp = await searchParams;
  const id = sp.id ?? "(created)";
  const deposit = Number(sp.deposit ?? 0);
  const paid = sp.paid;

  return (
    <main className="container-shell py-16">
      <p className="mb-3 text-center text-xs text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">Home</Link> <span className="mx-1">→</span>
        <Link href="/book" className="hover:text-zinc-300">Book</Link> <span className="mx-1">→</span> Confirmed
      </p>
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-gold">BOOKING CONFIRMED</p>
        <h1 className="mt-2 text-3xl font-black">You’re locked in.</h1>
        <p className="mt-3 text-zinc-300">
          Appointment ID: <span className="font-mono">{id}</span>
        </p>

        {paid === "1" ? <p className="mt-3 text-emerald-400">Deposit paid successfully ✅</p> : null}

        {deposit > 0 && paid !== "1" ? (
          <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-4">
            <p className="text-zinc-300">This service requires a ${deposit.toFixed(2)} deposit.</p>
            <PayDepositButton appointmentId={id} />
          </div>
        ) : null}

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/book" className="rounded-xl border border-zinc-700 px-4 py-2">
            Book Another
          </Link>
          <Link href="/" className="rounded-xl bg-gold px-4 py-2 font-bold text-black">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
