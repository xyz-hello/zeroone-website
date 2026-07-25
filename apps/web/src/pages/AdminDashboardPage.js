import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const emptyConfig = {
  tenantId: '',
  clientId: '',
  clientSecret: '',
  senderEmail: '',
  recipientEmail: '',
  secretExpiresAt: '',
  hasClientSecret: false
};
const entraClientSecretUrl =
  'https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Credentials/appId/f8c08f17-5427-4722-a943-fa6ed8a912f1/isMSAApp~/false';

function getSecretExpiryStatus(secretExpiresAt) {
  if (!secretExpiresAt) {
    return {
      type: 'warning',
      message: 'No client secret expiration date is saved. Add the date from Microsoft Entra so admins know when to rotate it.'
    };
  }

  const today = new Date();
  const expiryDate = new Date(`${secretExpiresAt}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (daysUntilExpiry < 0) {
    return {
      type: 'error',
      message: `Client secret expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago. Create a new secret in Microsoft Entra and save it here.`
    };
  }

  if (daysUntilExpiry === 0) {
    return {
      type: 'error',
      message: 'Client secret expires today. Create a new secret in Microsoft Entra and save it here.'
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      type: 'warning',
      message: `Client secret expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Create a new secret soon to avoid contact form downtime.`
    };
  }

  return {
    type: 'success',
    message: `Client secret is valid until ${new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(expiryDate)}.`
  };
}

function AdminDashboardPage() {
  const [config, setConfig] = useState(emptyConfig);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [status, setStatus] = useState({
    type: 'idle',
    message: ''
  });
  const [toast, setToast] = useState({
    type: 'info',
    message: ''
  });

  const token = window.localStorage.getItem('zerooneAdminToken') || '';
  const storedUser = JSON.parse(window.localStorage.getItem('zerooneAdminUser') || 'null');
  const adminName = storedUser?.name || storedUser?.email || 'Admin';
  const adminEmail = storedUser?.email || 'zeroone-admin';
  const adminInitial = adminName.charAt(0).toUpperCase();
  const expiryStatus = getSecretExpiryStatus(config.secretExpiresAt);

  useEffect(() => {
    if (!token) {
      window.history.pushState({}, '', '/admin/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    async function loadConfig() {
      setStatus({
        type: 'loading',
        message: ''
      });

      try {
        const response = await fetch(`${apiBaseUrl}/api/admin/mail-config`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load mail configuration.');
        }

        setConfig({
          ...emptyConfig,
          ...payload.config,
          clientSecret: ''
        });
        setStatus({
          type: 'idle',
          message: ''
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load mail configuration.';
        setStatus({
          type: 'error',
          message: ''
        });
        setToast({
          type: 'error',
          message
        });
      }
    }

    loadConfig();
  }, [token]);

  function handleChange(event) {
    const { name, value } = event.target;

    setConfig((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({
      type: 'loading',
      message: ''
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/admin/mail-config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to save mail configuration.');
      }

      setConfig({
        ...emptyConfig,
        ...payload.config,
        clientSecret: ''
      });
      setStatus({
        type: 'success',
        message: ''
      });
      setToast({
        type: 'success',
        message: payload.message || 'Mail configuration saved.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save mail configuration.';
      setStatus({
        type: 'error',
        message: ''
      });
      setToast({
        type: 'error',
        message
      });
    }
  }

  function handleLogout() {
    window.localStorage.removeItem('zerooneAdminToken');
    window.localStorage.removeItem('zerooneAdminUser');
    window.history.pushState({}, '', '/admin/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[16.5rem_1fr]">
        <aside className="flex min-h-screen flex-col border-r border-slate-900/10 bg-[#07152b] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen">
          <a className="flex items-center gap-4" href="/">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-sm font-black text-[#07152b] shadow-lg shadow-black/20">
              01
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">ZeroOne IT Inc.</span>
              <span className="block text-sm font-semibold text-blue-200/70">Admin Workspace</span>
            </span>
          </a>

          <nav className="mt-10 grid gap-8" aria-label="Admin navigation">
            <section className="grid gap-3">
              <p className="px-3 text-xs font-black uppercase tracking-[0.24em] text-blue-200/55">Main</p>
              <a
                className="flex items-center gap-4 rounded-lg border border-blue-200/15 bg-blue-500/10 px-4 py-3 text-sm font-black text-white shadow-lg shadow-black/10"
                href="/admin/mail-config"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-300/15 text-blue-100" aria-hidden="true">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="m6 8 6 4.5L18 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </span>
                Mail Config
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-200" aria-hidden="true" />
              </a>
            </section>
          </nav>

          <div className="relative mt-auto pt-6">
            {isProfileMenuOpen ? (
              <div className="absolute bottom-[4.9rem] left-0 right-0 rounded-lg border border-slate-200 bg-white p-4 text-slate-800 shadow-2xl shadow-black/30">
                <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-sm font-black text-slate-700">
                    {adminInitial}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{adminName}</span>
                    <span className="block truncate text-xs font-semibold text-slate-500">{adminEmail}</span>
                  </span>
                </div>
                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition hover:bg-slate-100"
                  type="button"
                >
                  Profile
                  <span aria-hidden="true">›</span>
                </button>
                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                >
                  Logout
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            ) : null}

            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-white/10"
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-white text-sm font-black text-[#07152b]">
                {adminInitial}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{adminName}</span>
                <span className="block truncate text-xs font-semibold text-blue-200/70">
                  {storedUser?.roleName || 'Admin'}
                </span>
              </span>
              <span className="ml-auto text-blue-200/70" aria-hidden="true">
                {isProfileMenuOpen ? '⌄' : '⌃'}
              </span>
            </button>
          </div>
        </aside>

        <section className="px-5 py-8 sm:px-8 lg:px-10">
          <div className="max-w-5xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Microsoft Graph</p>
            <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950">Mail Configuration</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Save the Microsoft credentials used by the website contact form. The client secret value is write-only:
              leave it blank to keep the current saved secret.
            </p>

            <div
              className={`mt-6 rounded-lg border px-4 py-3 text-sm font-semibold ${
                expiryStatus.type === 'error'
                  ? 'border-rose-300 bg-rose-50 text-rose-900'
                  : expiryStatus.type === 'warning'
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
              role="status"
            >
              <span>{expiryStatus.message}</span>
              <a
                className="ml-2 inline-flex font-black text-blue-800 underline underline-offset-4 transition hover:text-blue-950"
                href={entraClientSecretUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Microsoft Entra
              </a>
            </div>

            <form
              className="mt-8 grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/80 sm:p-6"
              onSubmit={handleSubmit}
            >
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-800">Tenant ID</span>
                <input
                  className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                  name="tenantId"
                  value={config.tenantId}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-800">Client ID</span>
                <input
                  className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                  name="clientId"
                  value={config.clientId}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-800">
                  Client Secret {config.hasClientSecret ? '(leave blank to keep saved secret)' : ''}
                </span>
                <input
                  className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                  name="clientSecret"
                  value={config.clientSecret}
                  onChange={handleChange}
                  type="password"
                  autoComplete="new-password"
                  required={!config.hasClientSecret}
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-800">Sender Email</span>
                  <input
                    className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                    name="senderEmail"
                    value={config.senderEmail}
                    onChange={handleChange}
                    type="email"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-800">Recipient Email</span>
                  <input
                    className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                    name="recipientEmail"
                    value={config.recipientEmail}
                    onChange={handleChange}
                    type="email"
                    required
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-800">Client Secret Expiration Date</span>
                <input
                  className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                  name="secretExpiresAt"
                  value={config.secretExpiresAt}
                  onChange={handleChange}
                  type="date"
                />
              </label>

              <button
                className="h-12 rounded-md bg-[#07152b] px-5 text-sm font-black text-white shadow-lg shadow-slate-300/80 transition hover:bg-blue-950 disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={status.type === 'loading'}
              >
                {status.type === 'loading' ? 'Saving...' : 'Save Mail Config'}
              </button>

            </form>
          </div>
        </section>
      </div>
      <Toast
        type={toast.type}
        message={toast.message}
        onClose={() =>
          setToast({
            type: 'info',
            message: ''
          })
        }
      />
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Sign Out?"
        message="You will need to sign in again before changing admin settings."
        cancelLabel="Stay Signed In"
        confirmLabel="Sign Out"
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
      />
    </main>
  );
}

export default AdminDashboardPage;
