import Link from "next/link";
import Image from "next/image";

function InstagramIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const navCols = [
  {
    label: "Platform",
    links: [
      { label: "Programs", href: "#programs" },
      { label: "Results", href: "#transformations" },
      { label: "The Neo Method", href: "#neomethod" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    label: "Account",
    links: [
      { label: "Client Login", href: "/login" },
      { label: "Apply for Coaching", href: "/apply" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 text-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/images/logo1.png"
                alt="NeoCoaching"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="font-black text-lg">
                <span className="text-[#D4AF37]">Neo</span>Coaching
              </span>
            </Link>
            <p className="text-white/35 text-sm leading-relaxed max-w-xs">
              Elite online coaching for people serious about transforming their
              body and building lasting habits.
            </p>
            <div className="flex gap-3 mt-5">
              {[
                {
                  icon: <InstagramIcon />,
                  href: "https://www.instagram.com/fit.neomilano_rsa?igsh=YTIxM244dXNmMzIz&utm_source=qr",
                  label: "Instagram",
                },
                {
                  icon: <YoutubeIcon />,
                  href: "https://www.youtube.com/@fit.neomilano",
                  label: "YouTube",
                },
                {
                  icon: <FacebookIcon />,
                  href: "https://www.facebook.com/share/18CyRLTrFM/?mibextid=wwXIfr",
                  label: "Facebook",
                },
                {
                  icon: <TikTokIcon />,
                  href: "https://tiktok.com/@neo.coaches",
                  label: "TikTok",
                },
              ].map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/4 border border-white/6 flex items-center justify-center text-white/40 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {navCols.map((col) => (
            <div key={col.label}>
              <p className="text-xs font-bold text-white/25 uppercase tracking-widest mb-4">
                {col.label}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/45 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider-gold" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} NeoCoaching. All rights reserved.
          </p>
          <p className="text-white/15 text-xs">
            Built for serious people. Results require commitment.
          </p>
        </div>
      </div>
    </footer>
  );
}
