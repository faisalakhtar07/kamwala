import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  Bot,
  Search,
  ShieldCheck,
  MessageSquare,
  Wallet,
  Repeat,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Phone,
  Tag,
  Clock,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Footer from '../components/Footer';
import HeroCarousel from '../components/HeroCarousel';
import Reveal from '../components/Reveal';
import FloatingAIWidget from '../components/FloatingAIWidget';
import InstallPrompt from '../components/InstallPrompt';
import { Button } from '../components/Form';
import { getCategories, getServices } from '../api/misc';

const HOW_IT_WORKS = [
  {
    icon: Bot,
    title: "Tell Us What You Need",
    desc: "Describe the work you need and choose the service that fits your requirement.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: ClipboardList,
    title: "Choose Your KamWala",
    desc: "Find available workers near you and choose the one that suits your needs.",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Clock,
    title: "Work Gets Started",
    desc: "Your selected worker reaches your location and starts the requested work.",
    image:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: CheckCircle2,
    title: "Work Completed",
    desc: "Once the work is completed, review the service and finish your booking.",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
  },
];


const TRUST_POINTS = [
  { icon: ShieldCheck, text: 'Managed booking — not just a phone number handed over' },
  { icon: MessageSquare, text: 'Chat with KamWala anytime about your request' },
  { icon: Wallet, text: 'Transparent pricing before you confirm anything' },
  { icon: Repeat, text: '"Book Again" for the work you need regularly' },
];

const FAQS = [
  {
    q: 'How is KamWala different from just calling a local worker?',
    a: 'KamWala manages the whole booking for you — we confirm pricing upfront, keep a chat history, and you can track status end to end instead of relying on one phone call.',
  },
  {
    q: 'How do I know what a service will cost?',
    a: 'Popular services show a fixed or starting price with any discount applied. For anything custom, KamWala AI asks a few questions and confirms pricing before you book.',
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: 'Yes — you can cancel any request that has not been completed yet from the request detail page, and chat with us to reschedule.',
  },
  {
    q: 'How does KamWala pick a worker for my job?',
    a: 'Every worker on KamWala is reviewed before being added to our roster. We match your requirement to someone with the right skills and availability nearby.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cloud-200 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="font-display font-semibold text-sm md:text-base">{q}</span>
        <ChevronDown
          size={18}
          className={`text-ink-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <p className="text-sm text-ink-500 leading-relaxed overflow-hidden">{a}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [popularServices, setPopularServices] = useState([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
    getServices().then((all) => setPopularServices(all.slice(0, 6))).catch(() => setPopularServices([]));
  }, []);

  const handleAskAI = (e) => {
    e.preventDefault();
    navigate('/ai-chat', { state: { initialMessage: query } });
  };

  return (
    <AppLayout noPadding>
      {/* Hero */}
      <section className="relative">
        <HeroCarousel />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-4 md:px-8 w-full">
            <div className="max-w-xl">
              <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-white">
                Find Trusted Workers Near You
              </h1>
              <p className="text-white/85 mt-4 text-base md:text-lg leading-relaxed">
                Painter, plumber, mechanic, maid, technician ya kisi bhi kaam ke liye — apni
                requirement KamWala ko bataiye, hum poora booking manage karte hain.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-7">
                <Button size="lg" onClick={() => navigate('/ai-chat')}>
                  <Bot size={18} /> Book a Service
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="!bg-white/10 !border-white/40 !text-white hover:!bg-white/20"
                  onClick={() => navigate('/categories')}
                >
                  <Search size={18} /> Find Trusted Workers
                </Button>
              </div>
              <a
                href="#become-a-worker"
                className="inline-block mt-4 text-sm font-medium text-white/80 hover:text-white underline underline-offset-4 transition-colors"
              >
                Become a Worker →
              </a>
              <div className="mt-3">
                <InstallPrompt />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI search card, bridging hero into content */}
      <div className="max-w-3xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        <form
          onSubmit={handleAskAI}
          className="bg-white rounded-card shadow-pop border border-cloud-200 p-2.5 flex flex-col sm:flex-row gap-2.5"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5">
            <Search size={18} className="text-ink-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Mujhe shaadi ke liye 5 helper chahiye…"
              className="bg-transparent outline-none text-sm w-full placeholder:text-ink-500"
            />
          </div>
          <Button type="submit" className="shrink-0">
            <Bot size={16} /> Ask KamWala AI
          </Button>
        </form>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Categories */}
        <section className="mt-14 md:mt-20">
          <Reveal>
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase mb-1.5">Categories</p>
                <h2 className="font-display font-bold text-2xl">What work do you need done?</h2>
              </div>
              <button
                onClick={() => navigate('/categories')}
                className="hidden sm:block text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                See all →
              </button>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((c, i) => {
              const Icon = Icons[c.icon] || Icons.Wrench;
              return (
                <Reveal key={c._id} delay={i * 40}>
                  <button
                    onClick={() => navigate(`/categories/${c._id}`)}
                    className="w-full flex flex-col items-center gap-2.5 bg-white border border-cloud-200 rounded-card p-4 hover:-translate-y-1 hover:shadow-soft hover:border-brand-300 transition-all duration-300 text-center"
                  >
                    <span className="h-11 w-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                      <Icon size={19} />
                    </span>
                    <span className="text-xs font-medium leading-tight">{c.name}</span>
                  </button>
                </Reveal>
              );
            })}
          </div>

          <button
            onClick={() => navigate('/categories')}
            className="sm:hidden mt-4 text-sm font-semibold text-brand-600"
          >
            See all categories →
          </button>
        </section>

        {/* Popular services with pricing */}
        {popularServices.length > 0 && (
          <section className="mt-20 md:mt-28">
            <Reveal>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase mb-1.5 flex items-center gap-1.5">
                    <TrendingUp size={13} /> Popular right now
                  </p>
                  <h2 className="font-display font-bold text-2xl">Book a Service</h2>
                </div>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {popularServices.map((s, i) => {
                const hasDiscount = s.discountPercent > 0;
                return (
                  <Reveal key={s._id} delay={i * 60}>
                    <button
                      onClick={() => navigate(`/categories/${s.categoryId?._id || s.categoryId}`)}
                      className="w-full text-left bg-white border border-cloud-200 rounded-card p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display font-semibold text-sm">{s.name}</p>
                        {hasDiscount && (
                          <span className="shrink-0 flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-pill">
                            <Tag size={10} /> {s.discountPercent}% OFF
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2 mt-3">
                        <span className="font-display font-bold text-lg text-brand-600">₹{s.finalPrice}</span>
                        {hasDiscount && <span className="text-xs text-ink-500 line-through">₹{s.price}</span>}
                      </div>
                      {s.estimatedTime && (
                        <p className="text-xs text-ink-500 flex items-center gap-1 mt-1.5">
                          <Clock size={11} /> {s.estimatedTime}
                        </p>
                      )}
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

       {/* How KamWala Works */}
<section
  id="how-it-works"
  className="mt-24 md:mt-32 scroll-mt-20"
>
  <Reveal>
    <div className="text-center px-4 mb-14 md:mb-20">
      <p className="text-xs font-semibold tracking-[0.2em] text-brand-600 uppercase mb-2">
        Process
      </p>

      <h2 className="font-display font-bold text-3xl md:text-5xl text-ink-900">
        How KamWala Works
      </h2>

      <p className="text-ink-500 max-w-xl mx-auto mt-4 text-sm md:text-base leading-relaxed">
        Four simple steps between "I need help with this" and the work
        getting done.
      </p>
    </div>
  </Reveal>

  {/* Stacked cards */}
  <div className="relative max-w-6xl mx-auto px-4 pb-24">
    {HOW_IT_WORKS.map((step, i) => (
      <div
        key={step.title}
        className="sticky"
        style={{
          top: `${85 + i * 22}px`,
          zIndex: i + 1,
        }}
      >
        <div
          className="
            relative
            mb-8
            min-h-[430px]
            md:min-h-[500px]
            rounded-[28px]
            md:rounded-[36px]
            overflow-hidden
            bg-white
            border border-cloud-200
            shadow-[0_20px_60px_rgba(0,0,0,0.10)]
          "
        >
          {/* Image */}
          <div className="absolute inset-0">
            <img
              src={step.image}
              alt={step.title}
              className="w-full h-full object-cover"
            />

            {/* White gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Step number */}
          <div className="absolute top-6 left-6 md:top-8 md:left-8 z-10">
            <div className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-brand-500 text-white flex items-center justify-center font-display font-bold text-lg md:text-xl shadow-lg">
              {String(i + 1).padStart(2, "0")}
            </div>
          </div>

          {/* Large background number */}
          <div
            className="
              absolute
              right-5
              top-2
              md:right-10
              md:top-0
              text-[110px]
              md:text-[180px]
              font-display
              font-bold
              text-white/10
              leading-none
              select-none
              pointer-events-none
            "
          >
            {i + 1}
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-end min-h-[430px] md:min-h-[500px] p-7 md:p-12">
            <div className="max-w-2xl text-white">
              <p className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-white/75 mb-3">
                Step {i + 1}
              </p>

              <h3 className="font-display font-bold text-3xl md:text-5xl leading-tight">
                {step.title}
              </h3>

              <p className="mt-4 text-sm md:text-lg text-white/85 leading-relaxed max-w-xl">
                {step.desc}
              </p>

              {/* Progress */}
              <div className="mt-7 flex items-center gap-3">
                <div className="h-1.5 w-32 md:w-48 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{
                      width: `${((i + 1) / HOW_IT_WORKS.length) * 100}%`,
                    }}
                  />
                </div>

                <span className="text-xs text-white/70">
                  {i + 1} / {HOW_IT_WORKS.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
</section>

        {/* Why choose KamWala */}
        <section id="why-kamwala" className="mt-20 md:mt-28 scroll-mt-20">
          <Reveal>
            <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase mb-1.5 text-center">Trust</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-10">Why Choose KamWala</h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {TRUST_POINTS.map(({ icon: Icon, text }, i) => (
              <Reveal key={text} delay={i * 80}>
                <div className="flex items-center gap-4 bg-white border border-cloud-200 rounded-card p-5 hover:border-mint-500/40 transition-colors duration-300">
                  <span className="h-11 w-11 rounded-lg bg-mint-50 text-mint-600 flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>
                  <p className="text-sm text-ink-700 leading-relaxed">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Become a Worker */}
        <section id="become-a-worker" className="mt-20 md:mt-28 scroll-mt-20">
          <Reveal>
            <div className="grid md:grid-cols-2 gap-0 rounded-card overflow-hidden border border-cloud-200">
              <div className="h-56 md:h-auto">
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80"
                  alt="A tradesperson at work"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-mint-50 p-8 md:p-10 flex flex-col justify-center">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mint-600 uppercase tracking-wide mb-3">
                  <Sparkles size={13} /> For professionals
                </span>
                <h2 className="font-display font-bold text-2xl">Turn Your Skills Into Earnings</h2>
                <p className="text-sm text-ink-700 mt-3 leading-relaxed">
                  Join KamWala and connect with customers looking for trusted professionals near
                  them. No cold calls, no chasing leads — requests come to you through KamWala.
                </p>
                <ul className="mt-4 space-y-2">
                  {['Steady stream of nearby work requests', 'KamWala handles pricing conversations', 'Get paid for the work you already do well'].map(
                    (b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-ink-700">
                        <CheckCircle2 size={15} className="text-mint-600 mt-0.5 shrink-0" /> {b}
                      </li>
                    )
                  )}
                </ul>
                <Button className="mt-6 w-fit" onClick={() => navigate('/register?type=worker')}>
                  Become a Worker
                </Button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* FAQ */}
        <section className="mt-20 md:mt-28 max-w-2xl mx-auto">
          <Reveal>
            <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase mb-1.5 text-center">FAQ</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-center mb-8">Common questions</h2>
          </Reveal>
          <Reveal>
            <div>
              {FAQS.map((f) => (
                <FAQItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </Reveal>
        </section>

        {/* CTA banner */}
        <section className="mt-20 md:mt-28 scroll-mt-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 px-6 py-12 md:px-14 md:py-16 text-center">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
              <div className="absolute -left-10 -bottom-16 h-48 w-48 rounded-full bg-white/10" />

              <div className="relative">
                <h2 className="font-display font-bold text-2xl md:text-3xl text-white max-w-xl mx-auto">
                  Kaam hai? KamWala ko batayein — hum sambhal lenge.
                </h2>
                <p className="text-white/85 mt-3 max-w-md mx-auto">
                  Painter se lekar wedding helpers tak, ek hi jagah se book karein.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
                  <Button
                    size="lg"
                    className="!bg-white !text-brand-600 hover:!bg-cloud-50"
                    onClick={() => navigate('/ai-chat')}
                  >
                    <Bot size={18} /> Book a Service
                  </Button>
                  <a
                    href="tel:+91 9472681608"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white border border-white/50 rounded-pill px-5 py-3 hover:bg-white/10 transition-colors"
                  >
                    <Phone size={16} /> Want to work with us? Call +91 9472681608
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Large clickable section before footer */}
        <section className="mt-20 md:mt-28 mb-20 md:mb-28">
          <Reveal>
            <button
              onClick={() => navigate('/categories')}
              className="group relative w-full text-left rounded-card overflow-hidden h-72 md:h-80"
            >
              <img
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1800&q=80"
                alt="A professional ready to help with your work"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-ink-900/10" />
              <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
                <h2 className="font-display font-bold text-2xl md:text-3xl text-white max-w-lg">
                  Need Help? Find the Right Professional for Your Work.
                </h2>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white mt-4">
                  Browse all categories <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </button>
          </Reveal>
        </section>
      </div>

      <Footer />
      <FloatingAIWidget />
    </AppLayout>
  );
}
