import { memo, useEffect, useState } from "react";
import logo2 from "../assets/landing/logo2.png";
import birLogo from "../assets/landing/BIR.png";
import secLogo from "../assets/landing/sec.jpg";
import zeroOneLogo from "../assets/landing/zeroone-logo.png";
import ChatWidget from "../components/ChatWidget";
import Header from "../components/Header";
import Seo, { defaultSiteUrl, toAbsoluteUrl } from "../components/Seo";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

const companyProfileAboutUrl = "/about-us";
const companyProfileServicesUrl = "/about-us#services";
const companyProfileHomeUrl = "/";
const apiBaseUrl = getApiBaseUrl();
const contactCooldownStorageKey = "zerooneContactCooldownUntil";
const contactCooldownMs = 5 * 60 * 1000;
const landingBrand = {
  name: "ZeroOne IT Inc.",
};
const landingNavigation = [
  { id: "home", label: "Home", href: "/" },
  { id: "contact", label: "Contact Us", href: "/#contact" },
  { id: "about", label: "About Us", href: "/about-us" },
];
const homeTitle = "ZeroOne IT Inc. | Custom Software, Web Platforms and AI Automation";
const homeDescription =
  "ZeroOne IT Inc. builds custom software, modern websites, web platforms, mobile apps, internal systems, and AI automation for growing businesses in the Philippines.";
const homeStructuredData = [
  {
    "@type": "Organization",
    "@id": `${defaultSiteUrl}/#organization`,
    name: "ZeroOne IT Inc.",
    legalName: "ZeroOne Information Technology Inc.",
    url: defaultSiteUrl,
    logo: toAbsoluteUrl("/android-chrome-512x512.png"),
    foundingDate: "2026-05",
    email: "info@zerooneitinc.com",
    telephone: "+63 919 079 7137",
    areaServed: ["Philippines", "Worldwide"],
    sameAs: [
      "https://www.facebook.com/zeroone.it.inc",
      "https://www.instagram.com/zerooneit.inc/",
      "https://www.linkedin.com/company/112718341/"
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "info@zerooneitinc.com",
        telephone: "+63 919 079 7137",
        areaServed: "PH",
        availableLanguage: ["English", "Filipino"]
      }
    ]
  },
  {
    "@type": "WebSite",
    "@id": `${defaultSiteUrl}/#website`,
    name: "ZeroOne IT Inc.",
    url: defaultSiteUrl,
    publisher: {
      "@id": `${defaultSiteUrl}/#organization`
    }
  },
  {
    "@type": "ProfessionalService",
    "@id": `${defaultSiteUrl}/#professional-service`,
    name: "ZeroOne IT Inc.",
    url: defaultSiteUrl,
    image: toAbsoluteUrl("/android-chrome-512x512.png"),
    email: "info@zerooneitinc.com",
    telephone: "+63 919 079 7137",
    address: {
      "@type": "PostalAddress",
      addressCountry: "PH"
    },
    areaServed: {
      "@type": "Country",
      name: "Philippines"
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Software development services",
      itemListElement: [
        "Custom software development",
        "AI automation",
        "Internal systems",
        "Web platforms",
        "Mobile apps",
        "Business workflow solutions"
      ].map((name) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name
        }
      }))
    }
  }
];

const binaryPatterns = [
  "0101011010010110",
  "1010010101101001",
  "0011010110101101",
  "1100101001011010",
  "0101101001100101",
  "1010110010101011",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
  "0110010101101001",
  "1001011010010110",
  "0100101101011001",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
  "1011010010101100",
  "1011010010101100",
  "0110100101101010",
  "1001101010010101",
  "1001101010010101",
  "1001101010010101",
  "1001101010010101",
  "1001101010010101",
  "1001101010010101",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
  "<1<1<1<1<1<1<1<1",
];

const binaryColumns = Array.from({ length: 24 }, (_, index) => ({
  pattern: binaryPatterns[index % binaryPatterns.length],
  duration: 10 + (index % 5) * 1.8,
  delay: index * 0.65,
  segments: Array.from({ length: 9 }, (_, segmentIndex) => ({
    text: binaryPatterns[(index + segmentIndex) % binaryPatterns.length].slice(
      0,
      5 + ((index + segmentIndex) % 8),
    ),
    active:
      segmentIndex === 1 ||
      segmentIndex === 4 ||
      (index + segmentIndex) % 5 === 0,
    gap: 18 + ((index * 7 + segmentIndex * 11) % 34),
  })),
}));

const heroCards = [
  {
    title: "Build smarter digital systems for your business.",
    subtitle: "",
    className: "landing-hero-card-centered landing-hero-card-message",
  },
  {
    title: "We design and build custom software and SaaS platforms that grow with your business.",
    subtitle: "",
    className: "landing-hero-card-centered landing-hero-card-message",
  },
  {
    title: "Don’t adapt your business to software. Build software that adapts to you.",
    subtitle: "",
    className: "landing-hero-card-centered landing-hero-card-message",
  },
];

const footerCapabilities = [
  { label: "Custom Software", href: companyProfileServicesUrl },
  { label: "AI Automation", href: companyProfileServicesUrl },
  { label: "Internal Systems", href: companyProfileServicesUrl },
  { label: "Web Platforms", href: companyProfileServicesUrl },
  { label: "Mobile Apps", href: companyProfileServicesUrl },
];

const footerLinks = [
  { label: "Home", href: companyProfileHomeUrl },
  { label: "About", href: companyProfileAboutUrl },
  { label: "Services", href: companyProfileServicesUrl },
  { label: "Contact", href: "/#contact" },
  { label: "Facebook", href: "https://www.facebook.com/zeroone.it.inc" },
];

const registrationBadges = [
  { label: "SEC Registered", logo: secLogo, alt: "SEC logo" },
  { label: "BIR Registered", logo: birLogo, alt: "BIR logo" },
];

const contactMethods = [
  {
    title: "Email us",
    value: "info@zerooneitinc.com",
    href: "mailto:info@zerooneitinc.com",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <path d="m5.5 7 6.5 5 6.5-5" />
      </svg>
    ),
  },
  {
    title: "Call us",
    value: "+63 919 079 7137",
    href: "tel:+639190797137",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 4.8c.5-.5 1.4-.5 1.9 0l1.7 1.7c.5.5.5 1.2.1 1.8l-1.4 1.8a13.6 13.6 0 0 0 4.4 4.4l1.8-1.4c.5-.4 1.3-.4 1.8.1l1.7 1.7c.5.5.5 1.4 0 1.9l-1.2 1.2c-.8.8-2 1.1-3.1.7A18.3 18.3 0 0 1 4.5 8.9c-.4-1.1-.1-2.3.7-3.1z" />
        <path d="M14.5 5.5a5 5 0 0 1 4 4" />
        <path d="M14.5 2.5a8 8 0 0 1 7 7" />
      </svg>
    ),
  },
  {
    title: "Our location",
    value: "Philippines",
    href: "https://maps.google.com/?q=Philippines",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z" />
        <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    ),
  },
];

const BinaryRain = memo(function BinaryRain() {
  return (
    <div className="landing-binary-rain" aria-hidden="true">
      {binaryColumns.map((column, index) => (
        <div
          className="landing-binary-column"
          key={`${column.pattern}-${index}`}
          style={{
            "--column-duration": `${column.duration}s`,
            "--column-delay": `-${column.delay}s`,
          }}
        >
          {column.segments.map((segment, segmentIndex) => (
            <span
              className={segment.active ? "landing-binary-segment landing-is-active" : "landing-binary-segment"}
              key={`${index}-${segmentIndex}`}
              style={{ marginBottom: `${segment.gap}px` }}
            >
              {segment.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
});

export default function App() {
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  });
  const isContactCoolingDown = cooldownRemainingMs > 0;
  const cooldownTotalSeconds = Math.ceil(cooldownRemainingMs / 1000);
  const cooldownMinutes = Math.floor(cooldownTotalSeconds / 60);
  const cooldownSeconds = cooldownTotalSeconds % 60;
  const cooldownLabel = `${cooldownMinutes}:${String(cooldownSeconds).padStart(2, "0")}`;

  useEffect(() => {
    function syncCooldown() {
      const cooldownUntil = Number(window.localStorage.getItem(contactCooldownStorageKey) || 0);
      const nextRemainingMs = Math.max(0, cooldownUntil - Date.now());

      setCooldownRemainingMs(nextRemainingMs);

      if (nextRemainingMs === 0 && cooldownUntil) {
        window.localStorage.removeItem(contactCooldownStorageKey);
        setSubmitState((current) =>
          current.status === "error" && current.message.includes("Please wait 5 minutes")
            ? {
                status: "idle",
                message: "",
              }
            : current,
        );
      }
    }

    syncCooldown();
    const intervalId = window.setInterval(syncCooldown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);
  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
  });

  function scrollToContact(event) {
    event.preventDefault();

    const contactSection = document.getElementById("contact");
    if (!contactSection) {
      return;
    }

    const topbar = document.querySelector(".landing-topbar");
    const topbarHeight = topbar?.getBoundingClientRect().height || 72;
    const scrollTop = Math.max(
      0,
      contactSection.getBoundingClientRect().top + window.scrollY - topbarHeight - 12,
    );

    window.history.pushState(null, "", "/#contact");
    window.scrollTo({
      top: scrollTop,
      behavior: "smooth",
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isContactCoolingDown) {
      setSubmitState({
        status: "error",
        message: `Please wait ${cooldownLabel} before sending another message.`,
      });
      return;
    }

    setSubmitState({
      status: "submitting",
      message: "Sending your message...",
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          message: formState.message,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);

        if (response.status === 429) {
          const retryAfterSeconds = Number(response.headers.get("Retry-After") || 300);
          const cooldownUntil = Date.now() + retryAfterSeconds * 1000;
          window.localStorage.setItem(contactCooldownStorageKey, String(cooldownUntil));
          setCooldownRemainingMs(cooldownUntil - Date.now());
        }

        throw new Error(errorPayload?.message || "Unable to submit form");
      }

      const payload = await response.json().catch(() => null);
      const cooldownUntil = Date.now() + Number(payload?.cooldownSeconds || contactCooldownMs / 1000) * 1000;
      window.localStorage.setItem(contactCooldownStorageKey, String(cooldownUntil));
      setCooldownRemainingMs(cooldownUntil - Date.now());

      setSubmitState({
        status: "success",
        message: "Thanks. Your message has been sent.",
      });
      setFormState({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please email us directly at info@zerooneitinc.com.",
      });
    }
  }

  return (
    <div className="landing-page-shell">
      <Seo
        title={homeTitle}
        description={homeDescription}
        canonicalPath="/"
        structuredData={homeStructuredData}
      />
      <Header
        brand={landingBrand}
        className="landing-topbar"
        navigation={landingNavigation.map((item) =>
          item.id === "contact"
            ? {
                ...item,
                onClick: scrollToContact,
              }
            : item,
        )}
      />
      <div className="landing-ambient landing-ambient-left" />
      <div className="landing-ambient landing-ambient-right" />
      <BinaryRain />

      <main className="landing-hero-shell">
        <section className="landing-hero-copy">
          <div className="landing-hero-header">
            <div className="landing-hero-heading-block">
              <p className="landing-hero-eyebrow">
                <span>ZeroOne</span>
                <span className="landing-hero-eyebrow-separator" aria-hidden="true" />
                <span>Information Technology Inc.</span>
              </p>
              <h1 className="landing-hero-title">
                <span className="landing-hero-title-line">Build. Transform.</span>
                <span className="landing-hero-title-line">
                  Scale with <span className="landing-hero-title-accent">Confidence.</span>
                </span>
              </h1>
              <p className="landing-hero-lead">
                <span className="landing-hero-lead-line">We build custom software, SaaS platforms, and AI-powered</span>
                <span className="landing-hero-lead-line">solutions that help organizations streamline operations,</span>
                <span className="landing-hero-lead-line">delight users, and accelerate growth.</span>
              </p>
            </div>

            <div className="landing-hero-brand-panel">
              <img className="landing-hero-copy-logo" src={logo2} alt="ZeroOne logo" />
            </div>
          </div>

          <div className="landing-hero-card-grid">
            {heroCards.map((card, index) => (
              <article
                className={card.className ? `landing-hero-card ${card.className}` : "landing-hero-card"}
                key={card.title}
              >
                <h2 className="landing-hero-card-title">{card.title}</h2>
                {card.subtitle ? <p className="landing-hero-card-subtitle">{card.subtitle}</p> : null}
              </article>
            ))}
          </div>

          <div className="landing-hero-actions">
            <a
              className="landing-hero-button landing-hero-button-primary"
              href="/#contact"
              onClick={scrollToContact}
            >
              Schedule a Consultation
            </a>
            <a className="landing-hero-button landing-hero-button-secondary" href="/" onClick={(event) => event.preventDefault()}>
              View Our Work
            </a>
          </div>
        </section>
      </main>

      <section className="landing-contact-shell" id="contact">
        <div className="landing-contact-section">
          <div className="landing-contact-grid">
            <div className="landing-contact-copy">
              <div className="landing-contact-chip">
                <span className="landing-contact-chip-icon">
                  <img src={zeroOneLogo} alt="ZeroOne logo" className="landing-contact-chip-logo" />
                </span>
                <span>Start a Project</span>
              </div>

              <p className="landing-footer-kicker">ZeroOne IT Inc.</p>
              <h2 className="landing-contact-title">Contact Us</h2>
              <p className="landing-contact-copy-text">
                Have questions or ready to transform your business with AI automation,
                custom software, or internal systems?
              </p>

              <div className="landing-contact-card-list">
                {contactMethods.map((item) => (
                  <a
                    className="landing-contact-card"
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    <span className="landing-contact-card-icon">{item.icon}</span>
                    <span className="landing-contact-card-body">
                      <span className="landing-contact-card-title">{item.title}</span>
                      <span className="landing-contact-card-value">{item.value}</span>
                    </span>
                    <span className="landing-contact-card-arrow" aria-hidden="true">
                      ↗
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="landing-contact-form-column">
              <div className="landing-contact-form-copy">
                <p className="landing-contact-form-heading">
                  Build software that fits the way your business works.
                </p>
              </div>

              <form className="landing-contact-form-panel" onSubmit={handleSubmit}>
                <label className="landing-contact-field">
                  <span className="landing-sr-only">Name</span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="landing-contact-field">
                  <span className="landing-sr-only">Email</span>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="landing-contact-field landing-contact-field-textarea">
                  <span className="landing-sr-only">Message</span>
                  <textarea
                    name="message"
                    placeholder="Message"
                    rows="8"
                    value={formState.message}
                    onChange={handleChange}
                    required
                  />
                </label>
                <button
                  className="landing-contact-submit"
                  type="submit"
                  disabled={submitState.status === "submitting" || isContactCoolingDown}
                >
                  {submitState.status === "submitting"
                    ? "Sending..."
                    : isContactCoolingDown
                      ? `Send again in ${cooldownLabel}`
                      : "Submit"}
                </button>
                <p
                  className={
                    submitState.status === "error"
                      ? "landing-contact-submit-message landing-is-error"
                      : "landing-contact-submit-message"
                  }
                  role="status"
                >
                  {submitState.message}
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-site-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-main">
            <div className="landing-footer-brand">
              <a className="landing-footer-wordmark" href={companyProfileHomeUrl} aria-label="ZeroOne home">
                <span className="landing-footer-wordmark-primary">Zero One IT Inc.</span>
              </a>
              <p className="landing-footer-description">
                Scaling operations requires software that works for operators. ZeroOne
                builds precision IT solutions for modern businesses in the Philippines.
              </p>
              <div className="landing-footer-direct">
                <p className="landing-footer-label">Direct Contact</p>
                <a className="landing-footer-direct-link" href="mailto:info@zerooneitinc.com">
                  info@zerooneitinc.com
                </a>
                <a className="landing-footer-direct-link" href="tel:+639190797137">
                  +63 919 079 7137
                </a>
              </div>
            </div>

            <div className="landing-footer-column">
              <p className="landing-footer-label">Capabilities</p>
              <nav className="landing-footer-list" aria-label="Capabilities">
                {footerCapabilities.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <div className="landing-footer-column">
              <p className="landing-footer-label">Navigation</p>
              <nav className="landing-footer-list" aria-label="Footer">
                {footerLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <div className="landing-footer-badges" aria-label="Registration badges">
            {registrationBadges.map((badge) => (
              <span className="landing-footer-badge" key={badge.label}>
                <img className="landing-footer-badge-logo" src={badge.logo} alt={badge.alt} />
                <span>{badge.label}</span>
              </span>
            ))}
          </div>

          <div className="landing-footer-bottom">
            <p className="landing-footer-copyright">© 2026 ZEROONE IT INC. ALL RIGHTS RESERVED.</p>
            <a className="landing-footer-cta" href="mailto:hello@zeroone-apps.com">
              Start a Project
            </a>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </div>
  );
}
