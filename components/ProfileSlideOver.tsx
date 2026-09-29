"use client";

import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";

import {
  BulletBlock,
  LabelledLinks,
  Linkify,
  SourceLinks,
  extractWhatsApp,
} from "@/components/ProfileRichText";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-stone-100 text-stone-700 border-stone-200",
  RUNNING: "bg-accent-50 text-accent-700 border-accent-200",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

interface ProfileSlideOverProps {
  contactId: string | null;
  open: boolean;
  onClose: () => void;
}

type ProfileData = {
  contact: {
    id: string;
    fullName: string | null;
    jobTitle: string | null;
    company: string | null;
    mobileNumbers: string[];
    telephoneNumbers: string[];
    emails: string[];
    website: string | null;
    address: string | null;
    companyLocation: string | null;
    linkedin: string | null;
    rawNotes: string | null;
    enrichment: {
      status: string | null;
      avatar_url: string | null;
      linkedin_url: string | null;
      facebook_url: string | null;
      twitter_url: string | null;
      instagram_url: string | null;
      other_profiles: string | null;
      company_details: string | null;
      company_core_business: string | null;
      official_site: string | null;
      sources: string | null;
      location: string | null;
      career_background: string | null;
      summary: string | null;
      enriched_at: string | null;
    } | null;
  } | null;
};

export function initials(name: string | null): string {
  return (name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-t border-stone-100 py-3 first:border-t-0 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <p className="text-xs font-medium text-stone-400 sm:pt-0.5">
        {label}
      </p>
      <div className="min-w-0 break-words text-sm text-ink">{children}</div>
    </div>
  );
}

export default function ProfileSlideOver({
  contactId,
  open,
  onClose,
}: ProfileSlideOverProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contactId) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${contactId}`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch profile.");
        }
        const json = await res.json();
        if (cancelled) return;
        setData(json);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch profile."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    fetchProfile();

    const poll = () => {
      const status = data?.contact?.enrichment?.status;
      if (status === "PENDING" || status === "RUNNING") {
        pollTimer = setTimeout(() => {
          fetchProfile();
          poll();
        }, 5000);
      }
    };
    poll();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contactId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const contact = data?.contact;
  const enrichment = contact?.enrichment ?? null;
  const status = enrichment?.status ?? "PENDING";

  const socialLinks = [
    { label: "LinkedIn", url: enrichment?.linkedin_url },
    { label: "Facebook", url: enrichment?.facebook_url },
    { label: "Twitter", url: enrichment?.twitter_url },
    { label: "Instagram", url: enrichment?.instagram_url },
  ].filter((s) => s.url);

  const whatsapp = extractWhatsApp(enrichment?.other_profiles);
  const otherProfiles = whatsapp?.remaining ?? enrichment?.other_profiles;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Contact profile">
      {/* overlay left side to close */}
      <div
        className="flex-1 animate-[fade_0.25s_ease-out_both] bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-over panel on right */}
      <aside className="w-full animate-[slide-in_0.4s_cubic-bezier(0.2,0.8,0.2,1)_both] bg-paper shadow-pop sm:max-w-xl lg:max-w-[50vw]">
        <div className="flex h-full flex-col overflow-y-auto text-ink">
          {/* Header */}
          {contact && (
            <div className="bg-accent-800 p-6 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-4">
                  {enrichment?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={enrichment.avatar_url}
                      alt={contact.fullName ?? "Contact"}
                      className="h-16 w-16 rounded-2xl object-cover ring-4 ring-white/15"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 font-display text-2xl font-medium ring-4 ring-white/10">
                      {initials(contact.fullName) || "?"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-2xl font-medium tracking-tight">
                        {contact.fullName ?? "Unknown"}
                      </h2>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[status] ?? STATUS_STYLES.PENDING
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-accent-100">
                      {contact.jobTitle}
                      {contact.jobTitle && contact.company ? " · " : ""}
                      {contact.company}
                    </p>
                    {contact.companyLocation && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-accent-100">
                        <MapPin className="h-3 w-3" />
                        {contact.companyLocation}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 p-6 sm:p-8">
            {loading && !contact && (
              <div role="status" aria-label="Loading profile" className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="skeleton h-16 w-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-5 w-1/2" />
                    <div className="skeleton h-3 w-1/3" />
                  </div>
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-4" style={{ width: `${90 - i * 8}%` }} />
                ))}
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {contact && !loading && (
              <div className="space-y-6">
                {/* Card details */}
                <section>
                  <h3 className="mb-1 font-display text-lg font-medium text-ink">
                    From the card
                  </h3>

                  <Field label="Mobile">
                    {contact.mobileNumbers.length > 0 ? (
                      contact.mobileNumbers.map((n, i) => (
                        <p key={`m-${i}`}>{n}</p>
                      ))
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>

                  <Field label="Telephone">
                    {contact.telephoneNumbers.length > 0 ? (
                      contact.telephoneNumbers.map((n, i) => (
                        <p key={`t-${i}`}>{n}</p>
                      ))
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>

                  <Field label="Email">
                    {contact.emails.length > 0 ? (
                      contact.emails.map((e, i) => (
                        <a
                          key={`e-${i}`}
                          href={`mailto:${e}`}
                          className="block text-accent-600 hover:text-accent-800"
                        >
                          {e}
                        </a>
                      ))
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>

                  <Field label="Website">
                    {contact.website ? (
                      <Linkify text={contact.website} />
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>

                  <Field label="LinkedIn (card)">
                    {contact.linkedin ? (
                      <Linkify text={contact.linkedin} />
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>

                  <Field label="Address">
                    {contact.address ? (
                      contact.address
                    ) : (
                      <span className="text-stone-500">-</span>
                    )}
                  </Field>
                </section>

                {/* Enriched profile */}
                <section>
                  <h3 className="mb-1 font-display text-lg font-medium text-ink">
                    Enriched profile
                  </h3>

                  <Field label="Summary">
                    {enrichment?.summary ? (
                      <p className="whitespace-pre-wrap">{enrichment.summary}</p>
                    ) : (
                      <span className="text-stone-500">Not available</span>
                    )}
                  </Field>

                  <Field label="Location">
                    {enrichment?.location ? (
                      enrichment.location
                    ) : (
                      <span className="text-stone-500">Not available</span>
                    )}
                  </Field>

                  {socialLinks.length > 0 && (
                    <Field label="Social profiles">
                      <ul className="space-y-1">
                        {socialLinks.map((s) => (
                          <li key={s.label}>
                            <Linkify text={`${s.label}: ${s.url}`} />
                          </li>
                        ))}
                      </ul>
                    </Field>
                  )}

                  {whatsapp && (
                    <Field label="WhatsApp">
                      <Linkify text={whatsapp.url} />
                    </Field>
                  )}

                  {otherProfiles && (
                    <Field label="Other profiles">
                      <LabelledLinks text={otherProfiles} />
                    </Field>
                  )}

                  <Field label="Company core business">
                    {enrichment?.company_core_business ? (
                      <BulletBlock text={enrichment.company_core_business} />
                    ) : (
                      <span className="text-stone-500">Not available</span>
                    )}
                  </Field>

                  <Field label="Company details">
                    {enrichment?.company_details ? (
                      <p className="whitespace-pre-wrap">
                        {enrichment.company_details}
                      </p>
                    ) : (
                      <span className="text-stone-500">Not available</span>
                    )}
                  </Field>

                  <Field label="Career background">
                    {enrichment?.career_background ? (
                      <BulletBlock text={enrichment.career_background} />
                    ) : (
                      <span className="text-stone-500">Not available</span>
                    )}
                  </Field>

                  {enrichment?.sources && (
                    <Field label="Sources">
                      <SourceLinks text={enrichment.sources} />
                    </Field>
                  )}

                  {!enrichment && (
                    <div className="mt-2 rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
                      No enrichment yet.
                    </div>
                  )}
                </section>
              </div>
            )}

            {!contact && !loading && !error && (
              <div className="rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
                Contact not found.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
