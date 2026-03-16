import Link from "next/link";
import { brand, faqs, testimonials } from "@/lib/content";

export default function HomePage() {
  return (
    <main>
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-ink/90 backdrop-blur">
        <div className="container-shell flex items-center justify-between py-3">
          <p className="text-lg font-extrabold tracking-wide">YOH CUTS STUDIO</p>
          <nav className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <a href="#services" className="hover:text-gold">Services</a>
            <a href="#gallery" className="hover:text-gold">Gallery</a>
            <a href="#about" className="hover:text-gold">About</a>
            <a href="#faq" className="hover:text-gold">FAQ</a>
            <Link href="/book" className="hover:text-gold">Book</Link>
          </nav>
          <Link href="/book" className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black">
            Book Appointment
          </Link>
        </div>
      </header>

      <section className="container-shell grid gap-8 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold">PREMIUM BROOKLYN BARBER EXPERIENCE</p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Sharp cuts. Clean service. Zero booking friction.</h1>
          <p className="mt-4 max-w-xl text-zinc-300">
            Built by Yohannes for clients who value consistency. Book in under a minute, show up, and leave camera-ready.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/book" className="rounded-xl bg-gold px-5 py-3 font-bold text-black">Reserve Slot</Link>
            <a href={`tel:${brand.phone.replace(/[^+\d]/g, "")}`} className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold">Call Now</a>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80"
          alt="Barber styling a customer"
          className="h-[380px] w-full rounded-3xl object-cover md:h-[480px]"
        />
      </section>

      <section id="services" className="container-shell py-12">
        <h2 className="section-title">Services that convert first-time visitors into regulars</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Haircut", "$40", "45 min"],
            ["Beard Trim", "$25", "25 min"],
            ["Haircut + Beard", "$60", "60 min"],
            ["Kids Cut", "$30", "30 min"],
            ["Line Up", "$20", "20 min"],
            ["Premium Package", "$80", "75 min"]
          ].map(([name, price, dur]) => (
            <article key={name} className="card p-5">
              <p className="text-lg font-bold">{name}</p>
              <p className="text-zinc-400">{dur}</p>
              <p className="mt-3 text-xl font-extrabold text-gold">{price}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="container-shell py-12">
        <div className="card grid gap-6 p-6 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="section-title">About Yohannes</h2>
            <p className="mt-3 text-zinc-300">
              Yohannes built YOH Cuts Studio around one thing: reliable results. Every service starts on time, ends clean, and is tailored to your style and growth pattern.
            </p>
            <p className="mt-3 text-zinc-300">Address: {brand.address}</p>
            <p className="text-zinc-300">Hours: Mon-Sat 9:00 AM - 7:00 PM</p>
          </div>
          <div className="grid gap-3">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                “{t.quote}”
                <footer className="mt-2 text-sm text-zinc-400">— {t.name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="gallery" className="container-shell py-12">
        <h2 className="section-title">Gallery</h2>
        <p className="mt-2 text-zinc-400">Fades, lineups, beard sculpting, and clean finish work.</p>

        <div className="gallery-marquee mt-6">
          <div className="gallery-track">
            {[
              "/gallery/cut-08.jpg",
              "/gallery/cut-03.jpg",
              "/gallery/cut-07.jpg",
              "/gallery/cut-01.jpg",
              "/gallery/cut-09.jpg",
              "/gallery/cut-05.jpg",
              "/gallery/cut-02.jpg",
              "/gallery/cut-06.jpg",
              "/gallery/cut-04.jpg"
            ]
              .concat([
                "/gallery/cut-05.jpg",
                "/gallery/cut-09.jpg",
                "/gallery/cut-02.jpg",
                "/gallery/cut-07.jpg",
                "/gallery/cut-04.jpg",
                "/gallery/cut-01.jpg",
                "/gallery/cut-08.jpg",
                "/gallery/cut-03.jpg",
                "/gallery/cut-06.jpg"
              ])
              .map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  className="h-64 w-[300px] shrink-0 rounded-2xl object-cover"
                  alt="Barber cut result"
                  loading="lazy"
                                  />
              ))}
          </div>
        </div>
      </section>

      <section id="faq" className="container-shell py-12">
        <h2 className="section-title">FAQs + Policy</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card p-4">
              <summary className="cursor-pointer font-semibold">{f.q}</summary>
              <p className="mt-2 text-zinc-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-10">
        <div className="container-shell grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-bold">YOH Cuts Studio</p>
            <p className="text-sm text-zinc-400">{brand.address}</p>
            <p className="text-sm text-zinc-400">{brand.phone}</p>
            <Link href="/admin/login" className="mt-2 inline-block text-xs text-zinc-500 hover:text-zinc-300">Owner Login</Link>
          </div>
          <div className="flex items-start gap-3 md:justify-end">
            <a href={brand.map} target="_blank" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Open Map</a>
            <a href={brand.instagram} target="_blank" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm">Instagram</a>
          </div>
        </div>
      </footer>

      <Link
        href="/book"
        className="fixed bottom-4 right-4 rounded-full bg-gold px-5 py-3 text-sm font-extrabold text-black shadow-xl md:hidden"
      >
        Book Now
      </Link>
    </main>
  );
}
