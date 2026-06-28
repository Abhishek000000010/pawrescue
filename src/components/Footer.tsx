import { Globe, Heart, Mail, Compass, Star, FileText } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Platform',
      icon: Compass,
      links: [
        { label: 'Rescue Map', href: '#map' },
        { label: 'Active Missions', href: '#missions' },
        { label: 'Adopt', href: '#adopt' },
      ],
    },
    {
      title: 'Community',
      icon: Star,
      links: [
        { label: 'Become a Volunteer', href: '#community' },
        { label: 'Success Stories', href: '#stories' },
        { label: 'Top Guardians', href: '#guardians' },
      ],
    },
    {
      title: 'About',
      icon: Heart,
      links: [
        { label: 'Our Mission', href: '#mission' },
        { label: 'Our Team', href: '#team' },
        { label: 'Contact Us', href: '#contact' },
      ],
    },
    {
      title: 'Legal',
      icon: FileText,
      links: [
        { label: 'Privacy Policy', href: '#privacy' },
        { label: 'Terms of Use', href: '#terms' },
        { label: 'Cookies', href: '#cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-brand-cream dark:bg-brand-dark border-t border-slate-200/60 dark:border-brand-muted/20 py-16 text-brand-muted dark:text-brand-light/75">
      <div className="max-w-7xl mx-auto px-6 space-y-12">
        
        {/* Main top columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Logo & Info column (4/12 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <a href="#home" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-md text-white">
                <Heart className="h-4.5 w-4.5 fill-current" />
              </div>
              <span className="font-heading text-base font-extrabold text-brand-dark dark:text-brand-light">
                Paw <span className="text-brand-primary">Rescue</span>
              </span>
            </a>
            <p className="text-xs text-brand-muted dark:text-brand-light/65 leading-relaxed max-w-sm">
              Dedicated to transforming the lives of stray cats through community action, responsive volunteer networks, and local support since 2024.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {['globe', 'instagram', 'twitter', 'youtube'].map((social) => (
                <button
                  key={social}
                  className="h-8 w-8 rounded-lg border border-brand-cream dark:border-brand-muted/30 hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary hover:border-brand-primary flex items-center justify-center text-brand-muted dark:text-brand-light/70 transition-all cursor-pointer"
                  aria-label={`Visit ${social}`}
                >
                  <Globe className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Columns (8/12 cols) */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {footerLinks.map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="font-heading text-xs font-bold text-brand-dark dark:text-brand-light uppercase tracking-wider flex items-center gap-1.5">
                  <col.icon className="h-3.5 w-3.5 text-brand-primary" />
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-xs text-brand-muted dark:text-brand-light/60 hover:text-brand-primary dark:hover:text-brand-primary transition-colors block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-brand-cream/80 dark:border-brand-muted/15 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-brand-muted/80 dark:text-brand-light/45 uppercase tracking-widest font-semibold">
          <span>
            © {currentYear} PawRescue Global. Made with love for all felines.
          </span>
          <span className="flex items-center gap-1.5 font-normal capitalize">
            Active in 40+ urban divisions worldwide
          </span>
        </div>

      </div>
    </footer>
  );
}
