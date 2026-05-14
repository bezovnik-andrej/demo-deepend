import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Lock, Mail, ShieldCheck, Sparkles, Waves } from 'lucide-react';
import { BrandMark } from '../TitleBar/NarveoLogo';
import { setDemoAuthed } from '../../demoAuth';
import styles from './Login.module.css';

function getStoredTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('norveo-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* ignore */
  }
  return 'dark';
}

export function Login() {
  const [email, setEmail] = useState('demo@thedeepend.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getStoredTheme());
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Enter any email and password to continue the demo.');
      return;
    }
    setDemoAuthed();
    window.location.hash = '#/app';
  };

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="login-title">
        <div className={styles.hero}>
          <div className={styles.brand}>
            <BrandMark size={24} />
            <span className={styles.demoBadge}>UAT demo</span>
          </div>

          <div className={styles.copy}>
            <p className={styles.eyebrow}>
              <Sparkles size={13} aria-hidden="true" />
              AI pool workspace
            </p>
            <h1 id="login-title" className={styles.title}>
              Configure, engineer, and procure from one project workspace.
            </h1>
            <p className={styles.subtitle}>
              Sign in to continue The Deep End demo path: project intake, AI-assisted configuration,
              engineering review, procurement, and purchase order tracking.
            </p>
          </div>

          <div className={styles.featureGrid} aria-label="Demo highlights">
            <div className={styles.featureCard}>
              <Waves size={16} aria-hidden="true" />
              <span>Pool configurator</span>
            </div>
            <div className={styles.featureCard}>
              <ClipboardList size={16} aria-hidden="true" />
              <span>Project Financials queue</span>
            </div>
            <div className={styles.featureCard}>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>UAT safe mode</span>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <p className={styles.panelKicker}>Welcome back</p>
            <h2 className={styles.panelTitle}>Sign in to The Deep End</h2>
            <p className={styles.panelSubtitle}>Use the demo email and any password to enter the workspace.</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="login-email">Email</label>
              <div className={styles.inputWrap}>
                <Mail size={14} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  placeholder="demo@thedeepend.app"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="login-password">Password</label>
              <div className={styles.inputWrap}>
                <Lock size={14} aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  placeholder="Any password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.submit}>
              Enter demo workspace
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </form>

          <div className={styles.demoNote}>
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Mock authentication only. No real credentials are required for UAT.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
