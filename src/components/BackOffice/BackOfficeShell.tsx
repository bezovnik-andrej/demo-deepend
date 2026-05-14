import { type ReactNode } from 'react';
import styles from './BackOfficeShell.module.css';

export type BackOfficeNav = 'companies' | 'projects';

interface BackOfficeShellProps {
  activeNav: BackOfficeNav;
  pageTitle: string;
  onNavigate: (path: string) => void;
  onCreateNew: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  children: ReactNode;
}

export function BackOfficeShell({
  activeNav,
  pageTitle,
  onNavigate,
  onCreateNew,
  theme,
  onToggleTheme,
  children,
}: BackOfficeShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon} aria-hidden>
            N
          </div>
          <span className={styles.logoText}>The Deep End</span>
        </div>

        <div className={styles.sidebarPanel}>
          <div className={styles.panelTop}>
            <button type="button" className={styles.createBtn} onClick={onCreateNew}>
              Add new…
            </button>
          </div>

          <div className={styles.panelDivider} />

          <nav className={styles.panelNav} aria-label="Main">
            <button
              type="button"
              className={`${styles.navLink} ${activeNav === 'companies' ? styles.navLinkActive : ''}`}
              onClick={() => onNavigate('#/backoffice/companies')}
            >
              Companies
            </button>
            <button
              type="button"
              className={`${styles.navLink} ${activeNav === 'projects' ? styles.navLinkActive : ''}`}
              onClick={() => onNavigate('#/backoffice/projects')}
            >
              Projects
            </button>
            <button type="button" className={styles.navLink} title="Mock">
              Billing
            </button>
            <button type="button" className={styles.navLink} title="Mock">
              Engineers
            </button>
            <button type="button" className={styles.navLink} title="Mock">
              Settings
            </button>
          </nav>

          <div className={styles.sidebarDivider2} />
          <div className={styles.sidebarSpacer} />
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.topBarActions}>
            <button type="button" className={styles.textLinkBtn} title="Help">
              Help
            </button>
            <button
              type="button"
              className={styles.textLinkBtn}
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button type="button" className={styles.textLinkBtn} title="Notifications">
              Alerts
              <span className={styles.alertCount}>9+</span>
            </button>
            <button type="button" className={styles.profileBtn} title="Profile">
              <div className={styles.profileAvatarFallback}>NA</div>
              <span className={styles.profileName}>The Deep End Admin</span>
            </button>
          </div>
        </header>

        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
        </div>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
