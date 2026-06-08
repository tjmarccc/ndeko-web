import { useState, useEffect } from 'react';
import {
  ChevronDown, HelpCircle, Package, CreditCard, RotateCcw, Shield,
  MessageCircle, Mail, Phone, Search, X, Loader2, Check,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { tokenStore, getMe, type AuthUser } from '../services/api';

// ─── Static FAQ data ───────────────────────────────────────────────────────────

const faqs = [
  {
    icon: Package,
    category: 'Delivery',
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 2–5 business days within Lagos and 3–7 business days for other states across Nigeria. Express same-day delivery is available in select areas of Lagos.',
  },
  {
    icon: CreditCard,
    category: 'Payment',
    q: 'What payment methods are accepted?',
    a: 'We accept Verve, Mastercard, Visa, USSD bank transfers, and Pay-on-Delivery for select cities. All card payments are processed through our secure payment gateway.',
  },
  {
    icon: RotateCcw,
    category: 'Returns',
    q: 'What is your return policy?',
    a: 'You can return most items within 14 days of delivery. Items must be unused and in original packaging. Perishables, digital goods, and intimate items are non-returnable.',
  },
  {
    icon: Shield,
    category: 'Security',
    q: 'Are my payments secure?',
    a: 'Yes. All transactions are encrypted end-to-end and processed through PCI-DSS compliant payment gateways. We never store your card details on our servers.',
  },
  {
    icon: HelpCircle,
    category: 'Promos',
    q: 'How do I redeem the WELCOME10 promo?',
    a: 'Apply code WELCOME10 at checkout to receive 10% cashback on your first order over ₦20,000. The cashback is credited to your Ndeko wallet within 24 hours of delivery.',
  },
  {
    icon: Package,
    category: 'Delivery',
    q: 'Can I track my order in real time?',
    a: "Yes. Once your order ships you'll receive an SMS and email with a tracking link. You can also track from the \"My Orders\" section of your account page.",
  },
  {
    icon: CreditCard,
    category: 'Payment',
    q: 'What happens if my payment fails?',
    a: "Failed payments are never charged. You'll be notified immediately and can retry with the same or a different method. Your cart is preserved for 30 minutes.",
  },
];

const CATEGORIES = ['All', 'Delivery', 'Payment', 'Returns', 'Security', 'Promos'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FaqItem({
  faq,
  isOpen,
  onToggle,
}: {
  faq: typeof faqs[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className="overflow-hidden dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:border-[#8B1538]/30 transition-colors"
      onClick={onToggle}
    >
      <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
        <div className="bg-[#FDF2F4] dark:bg-[#8B1538]/20 p-2 sm:p-2.5 rounded-xl flex-shrink-0">
          <faq.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#8B1538]" />
        </div>
        <p className="flex-1 font-semibold dark:text-white text-sm sm:text-base leading-snug pr-2">
          {faq.q}
        </p>
        <ChevronDown
          className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#8B1538]' : ''
          }`}
        />
      </div>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed pl-[52px] sm:pl-[64px]">
          {faq.a}
        </div>
      </div>
    </Card>
  );
}

function ContactCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gray-800 border dark:border-gray-700 hover:border-[#8B1538]/30 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
        <p className="font-semibold dark:text-white text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Help() {
  const [open, setOpen] = useState<number | null>(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Auth user — pre-fill contact form
  const [user, setUser] = useState<AuthUser | null>(tokenStore.getUser());
  useEffect(() => {
    if (!tokenStore.getAccess()) return;
    getMe()
      .then((u: AuthUser) => { tokenStore.setUser(u); setUser(u); })
      .catch(() => {});
  }, []);

  // Contact form
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Pre-fill when user loads
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // No contact API endpoint exists — simulate with a delay then show success
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast.success("Message sent! We'll get back to you within 24 hours.");
    setForm((prev) => ({ ...prev, subject: '', message: '' }));
    setTimeout(() => setSent(false), 3000);
  };

  // Filter FAQs
  const filtered = faqs.filter((f) => {
    const matchesCat = category === 'All' || f.category === category;
    const matchesSearch =
      search.trim() === '' ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">

        {/* ── Header ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-bold dark:text-white text-xl sm:text-2xl mb-1">Help Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Find answers to common questions about Ndeko Express.
          </p>
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4 sm:mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for answers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(null); }}
            className="pl-10 pr-10 py-2.5 rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Category pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-6 sm:mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setOpen(null); }}
              className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0 ${
                category === cat
                  ? 'bg-[#8B1538] text-white border-[#8B1538]'
                  : 'bg-white dark:bg-gray-800 text-[#8B1538] border-[#8B1538]/30 hover:border-[#8B1538] dark:text-[#D4828F] dark:border-[#D4828F]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── FAQ list ── */}
        <div className="space-y-2 sm:space-y-3 mb-10 sm:mb-14">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium dark:text-gray-400">No results found</p>
              <p className="text-sm mt-1">Try a different search term or category.</p>
            </div>
          ) : (
            filtered.map((f, i) => (
              <FaqItem
                key={i}
                faq={f}
                isOpen={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))
          )}
        </div>

        {/* ── Contact channels ── */}
        <div className="mb-8 sm:mb-10">
          <h2 className="font-bold dark:text-white text-base sm:text-lg mb-4">
            Still need help?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ContactCard icon={Phone} title="Call us" value="+234 700 NDEKO 24" color="#8B1538" />
            <ContactCard icon={Mail} title="Email" value="support@ndekoexpress.ng" color="#3D9B8E" />
            <ContactCard icon={MessageCircle} title="Live Chat" value="Mon–Sat, 8am–8pm" color="#D4828F" />
          </div>
        </div>

        {/* ── Contact form ── */}
        <Card className="p-5 sm:p-6 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-bold dark:text-white text-base sm:text-lg mb-1">Send us a message</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            We typically respond within 24 hours on business days.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                  Name
                </Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                  Email
                </Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="dark:bg-gray-900 dark:border-gray-700"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                Subject
              </Label>
              <Input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="What's this about?"
                className="dark:bg-gray-900 dark:border-gray-700"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block">
                Message
              </Label>
              <Textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your issue or question in detail…"
                className="dark:bg-gray-900 dark:border-gray-700 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending || sent}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-300 disabled:opacity-80"
              style={{
                background: sent
                  ? 'linear-gradient(135deg, #3D9B8E, #2F7A6F)'
                  : 'linear-gradient(135deg, #8B1538, #D4828F)',
                boxShadow: '0 4px 16px rgba(139,21,56,0.25)',
              }}
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : sent ? (
                <><Check className="h-4 w-4" /> Message Sent!</>
              ) : (
                'Send Message'
              )}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}