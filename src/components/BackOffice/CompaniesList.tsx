import { useState } from 'react';
import { MOCK_COMPANIES, STATUS_BADGE } from './mockCompanies';
import type { MockCompany } from './mockCompanies';
import styles from './CompaniesList.module.css';

function StatusBadge({ status }: { status: MockCompany['status'] }) {
  const s = STATUS_BADGE[status];
  return (
    <span
      className={styles.badge}
      style={{ background: s.bg, borderColor: s.border, color: s.textColor }}
    >
      <span className={styles.badgeDot} style={{ background: s.dotColor }} />
      {status}
    </span>
  );
}

interface CompaniesListProps {
  onOpenCompany: (id: string) => void;
  onAddCompany: () => void;
}

export function CompaniesList({ onOpenCompany, onAddCompany }: CompaniesListProps) {
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleImgError = (id: string) => {
    setImgErrors((prev) => new Set(prev).add(id));
  };

  return (
    <div>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Company List</h2>
            <p className={styles.subtitle}>
              View the list of all registered companies and their key contacts
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.addBtn} onClick={onAddCompany}>
              Add Company
            </button>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Search"
              readOnly
              title="Mock"
            />
          </div>
        </div>
        <div className={styles.divider} />

        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colCompany}>Company</th>
              <th>Status</th>
              <th className={styles.colContact}>Contact person</th>
              <th>Projects #</th>
              <th>User #</th>
              <th>Registration date</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_COMPANIES.map((c) => (
              <tr key={c.id} onClick={() => onOpenCompany(c.id)}>
                <td className={styles.colCompany}>
                  <div className={styles.companyCell}>
                    {!imgErrors.has(c.id) ? (
                      <img
                        className={styles.avatar}
                        src={c.avatarUrl}
                        alt=""
                        onError={() => handleImgError(c.id)}
                      />
                    ) : (
                      <div
                        className={styles.avatarFallback}
                        style={{ background: '#6b7280' }}
                      >
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className={styles.companyText}>
                      <span className={styles.companyName}>{c.name}</span>
                      <span className={styles.companyDomain}>{c.domain}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
                <td className={styles.colContact}>
                  <div>
                    <div className={styles.contactName}>{c.contactName}</div>
                    <div className={styles.contactEmail}>{c.contactEmail}</div>
                  </div>
                </td>
                <td>{c.projectCount}</td>
                <td>{c.userCount}</td>
                <td>{c.registrationDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.pagBtnWrap}>
            <button type="button" className={`${styles.pagBtn} ${styles.pagBtnDisabled}`}>
              Previous
            </button>
          </div>
          <div className={styles.pageNumbers}>
            <button type="button" className={`${styles.pageNum} ${styles.pageNumActive}`}>1</button>
            <button type="button" className={styles.pageNum}>2</button>
            <button type="button" className={styles.pageNum}>3</button>
            <button type="button" className={styles.pageNum}>…</button>
            <button type="button" className={styles.pageNum}>8</button>
            <button type="button" className={styles.pageNum}>9</button>
            <button type="button" className={styles.pageNum}>10</button>
          </div>
          <div className={`${styles.pagBtnWrap} ${styles.pagBtnWrapEnd}`}>
            <button type="button" className={styles.pagBtn}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
