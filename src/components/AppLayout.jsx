import Navbar from './Navbar';
import MobileNav from './MobileNav';

export default function AppLayout({ children, noPadding }) {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className={noPadding ? 'pb-16 md:pb-0' : 'px-4 md:px-8 py-6 pb-24 md:pb-10 max-w-5xl mx-auto'}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
