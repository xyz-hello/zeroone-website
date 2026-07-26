import { useState } from 'react';
import Seo from '../components/Seo';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const apiBaseUrl = getApiBaseUrl();

function AdminLoginPage() {
  const [formState, setFormState] = useState({
    email: '',
    password: ''
  });
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    message: ''
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState({
      status: 'submitting',
      message: 'Signing in...'
    });

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formState)
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to sign in.');
      }

      window.localStorage.setItem('zerooneAdminToken', payload.token);
      window.localStorage.setItem('zerooneAdminUser', JSON.stringify(payload.user));
      window.history.pushState({}, '', '/admin/content');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setSubmitState({
        status: 'success',
        message: 'Signed in successfully.'
      });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unable to sign in.'
      });
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050816] text-white">
      <Seo
        title="Admin Login | ZeroOne IT Inc."
        description="Private ZeroOne IT Inc. administrator login."
        canonicalPath="/admin/login"
        noindex
      />
      <section className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-[-14rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />
        </div>

        <div className="hidden lg:block">
          <div className="inline-flex h-12 items-center gap-3 rounded-full border border-blue-200/15 bg-white/[0.04] px-4 text-sm font-semibold text-blue-100 shadow-2xl shadow-blue-950/20 backdrop-blur">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-500 text-xs font-black">
              01
            </span>
            ZeroOne IT Inc.
          </div>

          <h1 className="mt-8 max-w-xl text-6xl font-bold leading-[0.95] tracking-normal text-white">
            Admin Login
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Access the internal dashboard for managing inquiries, website content, and operational tools.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4">
            {['Secure access', 'Role based', 'JWT sessions', 'MySQL users'].map((item) => (
              <div
                className="rounded-lg border border-blue-200/10 bg-white/[0.035] p-4 text-sm font-semibold text-slate-200 backdrop-blur"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[29rem]">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <a className="text-sm font-bold text-blue-100" href="/">
              ZeroOne
            </a>
            <span className="rounded-full border border-blue-200/15 px-3 py-1 text-xs font-semibold text-slate-300">
              Admin
            </span>
          </div>

          <form
            className="relative overflow-hidden rounded-lg border border-blue-200/15 bg-slate-950/75 p-6 shadow-[0_32px_100px_rgba(2,8,23,0.55)] backdrop-blur-xl sm:p-8"
            onSubmit={handleSubmit}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-500" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                  Secure Portal
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
                  Welcome Back
                </h2>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-blue-200/15 bg-blue-500/10 text-sm font-black text-blue-100">
                01
              </div>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">Email</span>
                <input
                  className="h-[52px] w-full rounded-lg border border-blue-200/15 bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/15"
                  type="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="admin@zeroone.local"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-200">Password</span>
                <input
                  className="h-[52px] w-full rounded-lg border border-blue-200/15 bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white/[0.09] focus:ring-4 focus:ring-blue-500/15"
                  type="password"
                  name="password"
                  value={formState.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
              </label>
            </div>

            <button
              className="mt-7 flex h-[52px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 font-bold text-slate-950 shadow-lg shadow-blue-950/40 transition hover:-translate-y-0.5 hover:from-blue-400 hover:to-cyan-300 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-70"
              type="submit"
              disabled={submitState.status === 'submitting'}
            >
              {submitState.status === 'submitting' ? 'Signing In...' : 'Sign In'}
            </button>

            <p
              className={`mt-5 min-h-5 rounded-lg border px-4 py-3 text-sm ${
                submitState.status === 'error'
                  ? 'border-rose-300/20 bg-rose-500/10 text-rose-200'
                  : submitState.status === 'success'
                    ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-200'
                    : 'border-transparent bg-transparent text-slate-400'
              } ${submitState.message ? 'block' : 'hidden'}`}
              role="status"
            >
              {submitState.message}
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

export default AdminLoginPage;
