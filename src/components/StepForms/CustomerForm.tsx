import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../store';
import { TextInput } from '../ui/TextInput';
import { InfoHint } from '../ui/InfoHint';
import styles from './forms.module.css';

function formatSiteAddress(d: {
  projectAddress: string;
  projectCity: string;
  projectState: string;
  projectZip: string;
}): string {
  const parts = [d.projectAddress, d.projectCity, d.projectState, d.projectZip].filter((p) => p.trim());
  return parts.join(', ');
}

export function CustomerForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const update = useCallback(
    (payload: Record<string, string>) => dispatch({ type: 'UPDATE_DATA', payload }),
    [dispatch],
  );

  const [sameAsCustomer, setSameAsCustomer] = useState(false);

  const syncOwnerFromCustomer = useCallback(() => {
    const site = formatSiteAddress(d);
    update({
      ownerName: d.clientCompanyName.trim() || d.clientContactName.trim(),
      ownerAddress: site || d.ownerAddress,
    });
  }, [d, update]);

  useEffect(() => {
    if (sameAsCustomer && !disabled) {
      syncOwnerFromCustomer();
    }
  }, [sameAsCustomer, disabled, syncOwnerFromCustomer, d.clientCompanyName, d.clientContactName, d.projectAddress, d.projectCity, d.projectState, d.projectZip]);

  const handleSameToggle = (checked: boolean) => {
    setSameAsCustomer(checked);
    if (checked) {
      syncOwnerFromCustomer();
    }
  };

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Customer &amp; owner</h2>
        <InfoHint
          contextLabel="Customer and owner"
          text="Customer is who we contract and invoice. Owner is the legal entity shown on permit packages — often the same, but not always."
        />
      </div>

      <h3 className={styles.blockTitle}>Customer (billing / contact)</h3>
      <TextInput
        label="Company or client name"
        value={d.clientCompanyName}
        onChange={(v) => update({ clientCompanyName: v })}
        placeholder="e.g. AquaBuild Co."
        disabled={disabled}
        required
      />
      <div className={styles.row}>
        <TextInput
          label="Primary contact name"
          value={d.clientContactName}
          onChange={(v) => update({ clientContactName: v })}
          placeholder="Full name"
          disabled={disabled}
          required
        />
        <TextInput
          label="Contact email"
          value={d.clientContactEmail}
          onChange={(v) => update({ clientContactEmail: v })}
          placeholder="name@company.com"
          disabled={disabled}
          required
          type="email"
          autoComplete="email"
        />
      </div>
      <TextInput
        label="CRM link (optional)"
        value={d.ownerCrmLink}
        onChange={(v) => update({ ownerCrmLink: v })}
        placeholder="URL or internal record ID"
        disabled={disabled}
      />

      <div className={styles.blockTitleRow}>
        <h3 className={styles.blockTitle}>Owner (permits / legal)</h3>
        <InfoHint
          contextLabel="Owner (permits / legal)"
          text="AHJs expect the owner block to match the property deed or HOA agreement. Double-check spelling before filing — especially when ISPSC, MAHC, or state pool codes are selected."
        />
      </div>
      <label className={styles.sameAsCard}>
        <input
          type="checkbox"
          checked={sameAsCustomer}
          onChange={(e) => handleSameToggle(e.target.checked)}
          disabled={disabled}
          aria-label="Same as customer — use company name and project site for the owner block"
        />
        <span className={styles.sameAsCardText}>
          <span className={styles.sameAsLead}>Same as customer</span>
          <span className={styles.sameAsDetail}>
            {' '}
            — use company name and project site for the owner block
          </span>
        </span>
      </label>
      <TextInput
        label="Owner legal name"
        value={d.ownerName}
        onChange={(v) => update({ ownerName: v })}
        placeholder="Entity or person on permit applications"
        disabled={disabled || sameAsCustomer}
        required
      />
      <TextInput
        label="Owner mailing / legal address"
        value={d.ownerAddress}
        onChange={(v) => update({ ownerAddress: v })}
        placeholder="If different from pool site — otherwise use toggle above"
        disabled={disabled || sameAsCustomer}
        required
      />
      {sameAsCustomer && (
        <p className={styles.formHint}>
          Owner address defaults to the project site from <strong>Project Location</strong> when available. Edit location first if it should appear here.
        </p>
      )}
    </div>
  );
}
