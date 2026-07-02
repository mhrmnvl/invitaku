import { Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Pricing() {
  const plans = [
    {
      name: "Free Plan",
      price: "Rp 0",
      period: "selamanya",
      description: "Sempurna untuk mencoba dan menyelenggarakan acara kecil non-komersial.",
      features: [
        "1 Acara Aktif",
        "Maksimal 50 Tamu Terdaftar",
        "Form RSVP Online Standar",
        "Buku Tamu Digital",
        "Pilihan Templat Dasar",
        "Dengan Watermark Invitaku",
      ],
      buttonText: "Mulai Gratis",
      buttonLink: "/login",
      featured: false,
    },
    {
      name: "Premium Event Pass",
      price: "Rp 99.000",
      period: "sekali bayar per acara",
      description: "Akses penuh tanpa batas ke semua fitur premium untuk satu acara khusus.",
      features: [
        "Bebas Batas Tamu (Unlimited Guests)",
        "Semua Pilihan Templat & Tata Letak",
        "Buku Tamu, Doa Restu & Galeri Foto",
        "Tiket QR Code & Scan Check-in Mandiri",
        "AI Writer Assistant (Bantuan Teks Kecerdasan Buatan)",
        'Hilangkan Watermark "Powered by Invitaku"',
        "Musik Latar Belakang & Countdown Timer",
        "Dukungan Prioritas (CSM via WhatsApp & Email)",
      ],
      buttonText: "Pilih Premium",
      buttonLink: "/login",
      featured: true,
    },
  ];

  return (
    <section
      id="pricing"
      className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32 bg-slate-50/50 border-t border-rule"
    >
      <div className="mb-16 text-center max-w-2xl mx-auto">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.24em] text-primary font-bold">
          Paket Layanan
        </div>
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Skema harga sederhana & transparan.
        </h2>
        <p className="mt-4 text-sm text-ink-soft">
          Tanpa biaya bulanan atau langganan tersembunyi. Bayar hanya untuk acara yang Anda
          butuhkan, atau gunakan paket gratis selamanya.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col justify-between rounded-2xl border p-8 bg-white transition-all duration-300 ${
              plan.featured
                ? "border-primary ring-1 ring-primary shadow-lg"
                : "border-rule/80 shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-lg font-bold text-ink">{plan.name}</h3>
                {plan.featured && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary font-sans">
                    Populer
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-ink-soft leading-relaxed min-h-[36px]">
                {plan.description}
              </p>
              <div className="mt-6 flex items-baseline">
                <span className="font-sans text-4xl font-black tracking-tight text-ink">
                  {plan.price}
                </span>
                <span className="ml-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
                  / {plan.period}
                </span>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-xs text-ink">
                    <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4">
              <Link
                to={plan.buttonLink}
                className={`flex w-full items-center justify-center rounded-xl py-3 px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  plan.featured
                    ? "bg-primary text-white hover:bg-primary/95 shadow-sm hover:shadow"
                    : "border border-rule hover:border-ink text-ink bg-white hover:bg-slate-50"
                }`}
              >
                {plan.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
