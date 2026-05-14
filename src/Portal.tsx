import styles from './Portal.module.css';
import {
  FileText,
  Box,
  ArrowRight,
  Waves,
} from 'lucide-react';

interface LinkItem {
  label: string;
  href: string;
  description: string;
}

const docs: LinkItem[] = [
  {
    label: 'UX Audit (The Deep End)',
    href: '/docs/ux-audit.html',
    description:
      'Design-led UX audit: usability, visual design, accessibility, SEO — with findings, screenshots, and recommendations.',
  },
  {
    label: 'Engineer User Journey',
    href: '/docs/engineer-journey.html',
    description: 'End-to-end workflow for pool engineers — from project creation to deliverables.',
  },
  {
    label: 'Super Admin User Journey',
    href: '/docs/admin-journey.html',
    description: 'Back-office flow — companies, projects, and workspace. Admin = engineer for initial release.',
  },
  {
    label: 'Client Company PM Flow',
    href: '/docs/super-admin-client-company-pm-flow.html',
    description: 'Derived Super Admin flow for onboarding a client company, assigning a project manager, and creating the first project.',
  },
];

const appDemo: LinkItem[] = [
  {
    label: 'Start UAT Demo',
    href: '#/login',
    description:
      'Full clickable path: login, project setup, configurator, procurement, and purchase order placement.',
  },
  {
    label: 'Back office (mock)',
    href: '/projects',
    description:
      'Super Admin shell — projects list, project detail, Open in Workspace. Mock data; theme matches workspace.',
  },
  {
    label: 'Design (Drawing Canvas)',
    href: '#/app/design',
    description: 'CAD-style pool drawing workspace with geometry, architecture, and fixture tools.',
  },
  {
    label: 'Summary',
    href: '#/app/summary',
    description: 'Project summary with configuration overview and key decisions.',
  },
  {
    label: 'Engineering',
    href: '#/app/engineering',
    description: 'Engineering calculations, structural specs, and compliance checks.',
  },
  {
    label: 'Estimate',
    href: '#/app/estimate',
    description: 'Cost estimation with labor, materials, and margin analysis.',
  },
  {
    label: 'Project Financials',
    href: '#/app/bom',
    description: 'Full BOM with quantities, part numbers, and vendor pricing.',
  },
  {
    label: 'Deliverables',
    href: '#/app/deliverables',
    description: 'Generated documents — permits, plans, specs, and client packages.',
  },
  {
    label: 'History',
    href: '#/app/history',
    description: 'Project revision history, change log, and version timeline.',
  },
  {
    label: 'Quick Quote Mode',
    href: '/simple-mode-mock.html',
    description: 'AI-guided simplified quoting experience for fast estimates.',
  },
  {
    label: 'UI Library',
    href: '#/ui-library',
    description: 'Component showcase and design system reference.',
  },
];

function LinkCard({ item }: { item: LinkItem }) {
  const isHash = item.href.startsWith('#');
  const isPrimaryDemo = item.label === 'Start UAT Demo';
  return (
    <a
      className={`${styles.card} ${isPrimaryDemo ? styles.cardPrimary : ''}`}
      href={item.href}
      target={isHash ? undefined : '_blank'}
      rel={isHash ? undefined : 'noopener noreferrer'}
    >
      <div className={styles.cardBody}>
        <span className={styles.cardTitle}>
          {item.label}
          {isPrimaryDemo && <span className={styles.demoPill}>Demo entry</span>}
        </span>
        <span className={styles.cardDesc}>{item.description}</span>
      </div>
      <ArrowRight size={14} className={styles.cardArrow} />
    </a>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  items: LinkItem[];
}

function Section({ icon, title, subtitle, accent, items }: SectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon} style={{ background: accent }}>
          {icon}
        </div>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionSub}>{subtitle}</p>
        </div>
      </div>
      <div className={styles.grid}>
        {items.map((item) => (
          <LinkCard key={item.href} item={item} />
        ))}
      </div>
    </section>
  );
}

export function Portal() {
  return (
    <div className={styles.portal}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Box size={28} strokeWidth={1.5} />
          <span>The Deep End</span>
        </div>
        <p className={styles.tagline}>Product Navigation Hub</p>
      </header>

      <main className={styles.main}>
        <Section
          icon={<FileText size={18} />}
          title="Documentation"
          subtitle="User journeys and system documentation"
          accent="var(--accent)"
          items={docs}
        />

        <Section
          icon={<Waves size={18} />}
          title="The Deep End — Pool Configurator"
          subtitle="AI-powered pool design, engineering, and quoting"
          accent="#0e7490"
          items={appDemo}
        />
      </main>

      <footer className={styles.footer}>
        <span>&copy; {new Date().getFullYear()} The Deep End</span>
      </footer>
    </div>
  );
}
