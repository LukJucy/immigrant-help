/** Help — grouped helpline cards with click-to-call. Calm, reassuring tone. */
import { IconHelp } from "../components/icons";

interface HelpItem {
  name: string;
  phone?: string;
  text?: string;
  note: string;
}
interface HelpGroup {
  title: string;
  tone: "danger" | "info" | "primary";
  items: HelpItem[];
}

// Sourced from content/04-reference/support-and-helplines.txt + key-phone-numbers.txt.
const GROUPS: HelpGroup[] = [
  {
    title: "Emergency",
    tone: "danger",
    items: [{ name: "Emergency services", phone: "112", note: "Garda, ambulance, fire — 112 or 999." }],
  },
  {
    title: "Wellbeing",
    tone: "primary",
    items: [
      { name: "Samaritans", phone: "116123", note: "Free, 24/7, any worry — you don't have to be suicidal." },
      { name: "Text 50808", text: "50808", note: "Free 24/7 crisis support by text." },
      { name: "Aware", phone: "1800804848", note: "Depression and anxiety support line." },
    ],
  },
  {
    title: "Rights & immigration",
    tone: "info",
    items: [
      { name: "Immigrant Council of Ireland", phone: "013316232", note: "Information and advice for migrants." },
      { name: "FLAC (free legal advice)", phone: "1890350250", note: "Free, confidential basic legal information." },
      { name: "NASC", phone: "0214503462", note: "Migrant and refugee rights support." },
    ],
  },
  {
    title: "Housing",
    tone: "primary",
    items: [{ name: "Threshold", phone: "1800454454", note: "Free advice on tenancies and deposits." }],
  },
];

function pretty(phone: string): string {
  if (phone === "112" || phone === "50808") return phone;
  return phone.replace(/(\d{2,4})(\d{3})(\d{3,4})/, "$1 $2 $3");
}

export function Help() {
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <IconHelp className="h-7 w-7 text-primary" />
        <h1 className="text-[28px] font-bold text-ink">Help &amp; support</h1>
      </header>
      <p className="text-muted">
        If you're struggling, these services are here for you. Many are free and confidential.
      </p>

      {GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
            {group.title}
          </h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <a
                key={item.name}
                href={item.text ? `sms:${item.text}` : `tel:${item.phone}`}
                className="block rounded-card border border-border bg-surface p-4 hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{item.name}</span>
                  <span className="font-semibold text-primary">
                    {item.text ? `Text ${item.text}` : pretty(item.phone!)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{item.note}</p>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
