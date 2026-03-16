import type { Metadata } from "next";
import TrackPageView from "@/components/TrackPageView";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOH Cuts Studio | Premium Barber in Brooklyn",
  description:
    "Book fades, beard trims, and premium grooming at YOH Cuts Studio. Fast online booking, trusted local service, and modern barber experience.",
  openGraph: {
    title: "YOH Cuts Studio | Book Your Appointment",
    description:
      "Premium barber shop by Yohannes. Easy mobile booking, trusted results, and clean service menu.",
    type: "website"
  }
};

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "Barbershop",
  name: "YOH Cuts Studio",
  image:
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
  telephone: "+1-555-0211",
  address: {
    "@type": "PostalAddress",
    streetAddress: "221 Fulton St",
    addressLocality: "Brooklyn",
    addressRegion: "NY",
    postalCode: "11201",
    addressCountry: "US"
  },
  openingHours: "Mo-Sa 09:00-19:00",
  priceRange: "$$",
  url: "https://example.com"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />
        <TrackPageView />
        {children}
      </body>
    </html>
  );
}
