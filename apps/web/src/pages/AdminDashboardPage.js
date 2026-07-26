import { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import Seo from '../components/Seo';
import Toast from '../components/Toast';
import { companyProfile } from '../content/companyProfile';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const apiBaseUrl = getApiBaseUrl();

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

function stripRuntimeFields(section) {
  const { image, ...sectionContent } = section;

  if (Array.isArray(section.members)) {
    sectionContent.members = section.members.map((member) => {
      const { image: memberImage, previewImage, ...memberContent } = member;
      if (typeof memberImage === 'string' && memberImage.startsWith('/api/uploads/')) {
        memberContent.image = memberImage;
      }
      return memberContent;
    });
  }

  return sectionContent;
}

function getEditableMembers(defaultMembers = [], overrideMembers) {
  const sourceMembers = Array.isArray(overrideMembers) ? overrideMembers : defaultMembers;

  return sourceMembers.map((member, index) => {
    const defaultMember =
      defaultMembers.find((current) => current.name === member.name) ||
      defaultMembers[index] ||
      {};
    const uploadedImage = typeof member.image === 'string' && member.image.startsWith('/api/uploads/')
      ? member.image
      : '';

    return {
      ...member,
      image: uploadedImage,
      previewImage: uploadedImage || defaultMember.image || ''
    };
  });
}

function mergeEditableSection(defaultSection, overrideContent) {
  const section = {
    ...stripRuntimeFields(defaultSection),
    ...(overrideContent || {})
  };

  if (Array.isArray(defaultSection.members)) {
    section.members = getEditableMembers(defaultSection.members, overrideContent?.members);
  }

  return section;
}

function getEditableSections(overrides = []) {
  const overrideMap = new Map(overrides.map((item) => [item.sectionId, item.content]));
  const metricSections = [
    {
      id: 'stats',
      type: 'metrics',
      title: 'Hero Expertise Cards',
      items: overrideMap.get('stats')?.items || companyProfile.stats
    },
    {
      id: 'projectCounters',
      type: 'metrics',
      title: 'Hero Number Cards',
      items: overrideMap.get('projectCounters')?.items || companyProfile.projectCounters
    }
  ];

  return [
    ...metricSections,
    ...companyProfile.sections.map((section) => mergeEditableSection(section, overrideMap.get(section.id)))
  ];
}

function getDefaultContentSectionId(sections = []) {
  return sections.some((section) => section.id === 'stats') ? 'stats' : sections[0]?.id || '';
}

function linesToText(lines = []) {
  return Array.isArray(lines) ? lines.join('\n') : '';
}

function textToLines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function safeJsonParse(value, fallback) {
  if (!value.trim()) {
    return fallback;
  }

  return JSON.parse(value);
}

function getPreviewImageUrl(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (value.startsWith('/api/uploads/')) {
    return `${apiBaseUrl}${value}`;
  }

  return value;
}

function isUploadedTeamPhoto(value) {
  return typeof value === 'string' && value.startsWith('/api/uploads/team/');
}

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

function AdminDashboardPage({ page = 'mail-config' }) {
  const [config, setConfig] = useState(emptyConfig);
  const [contentSections, setContentSections] = useState(() => getEditableSections());
  const [activeSectionId, setActiveSectionId] = useState(() => getDefaultContentSectionId(getEditableSections()));
  const [advancedJson, setAdvancedJson] = useState('');
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
  const [uploadingMemberKey, setUploadingMemberKey] = useState('');
  const [brokenPreviewImages, setBrokenPreviewImages] = useState({});
  const [pendingPhotoDeletes, setPendingPhotoDeletes] = useState([]);

  const token = window.localStorage.getItem('zerooneAdminToken') || '';
  const storedUser = JSON.parse(window.localStorage.getItem('zerooneAdminUser') || 'null');
  const adminName = storedUser?.name || storedUser?.email || 'Admin';
  const adminEmail = storedUser?.email || 'zeroone-admin';
  const adminInitial = adminName.charAt(0).toUpperCase();
  const expiryStatus = getSecretExpiryStatus(config.secretExpiresAt);
  const activeSection = contentSections.find((section) => section.id === activeSectionId) || contentSections[0];

  useEffect(() => {
    if (!token) {
      window.history.replaceState({}, '', '/admin/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    if (page !== 'mail-config') {
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
  }, [page, token]);

  useEffect(() => {
    if (!token || page !== 'content') {
      return;
    }

    async function loadContent() {
      setStatus({
        type: 'loading',
        message: ''
      });

      try {
        const response = await fetch(`${apiBaseUrl}/api/about-content/admin`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message || 'Unable to load about content.');
        }

        const sections = getEditableSections(Array.isArray(payload?.sections) ? payload.sections : []);
        setContentSections(sections);
        setActiveSectionId((current) => current || getDefaultContentSectionId(sections));
        setStatus({
          type: 'idle',
          message: ''
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load about content.';
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

    loadContent();
  }, [page, token]);

  useEffect(() => {
    if (!activeSection) {
      setAdvancedJson('');
      return;
    }

    setAdvancedJson(JSON.stringify(activeSection, null, 2));
  }, [activeSection]);

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

  function updateActiveSection(updater) {
    setContentSections((currentSections) =>
      currentSections.map((section) => {
        if (section.id !== activeSectionId) {
          return section;
        }

        return typeof updater === 'function' ? updater(section) : updater;
      })
    );
  }

  function handleSectionFieldChange(event) {
    const { name, value } = event.target;

    updateActiveSection((section) => ({
      ...section,
      [name]: name === 'paragraphs' ? textToLines(value) : value
    }));
  }

  function handleCardChange(index, field, value) {
    updateActiveSection((section) => ({
      ...section,
      cards: section.cards.map((card, cardIndex) =>
        cardIndex === index
          ? {
              ...card,
              [field]: value
            }
          : card
      )
    }));
  }

  function handleMemberChange(index, field, value) {
    updateActiveSection((section) => ({
      ...section,
      members: section.members.map((member, memberIndex) =>
        memberIndex === index
          ? {
              ...member,
              [field]: value
            }
          : member
      )
    }));
  }

  function handleAddMember() {
    updateActiveSection((section) => ({
      ...section,
      members: [
        ...(Array.isArray(section.members) ? section.members : []),
        {
          name: '',
          role: '',
          image: ''
        }
      ]
    }));
  }

  function handleRemoveMember(index) {
    updateActiveSection((section) => {
      const removedMember = section.members[index];

      if (isUploadedTeamPhoto(removedMember?.image)) {
        setPendingPhotoDeletes((current) => [...new Set([...current, removedMember.image])]);
      }

      return {
        ...section,
        members: section.members.filter((member, memberIndex) => memberIndex !== index)
      };
    });
  }

  async function deleteUploadedPhoto(url) {
    if (!isUploadedTeamPhoto(url)) {
      return;
    }

    await fetch(`${apiBaseUrl}/api/about-content/admin/team-photo`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url
      })
    });
  }

  async function deleteUploadedPhotos(urls) {
    const uniqueUrls = [...new Set(urls.filter(isUploadedTeamPhoto))];

    await Promise.all(uniqueUrls.map((url) => deleteUploadedPhoto(url)));
  }

  async function saveContentSection(sectionToSave) {
    const content = stripRuntimeFields({
      ...sectionToSave,
      id: sectionToSave.id,
      type: sectionToSave.type
    });

    const response = await fetch(`${apiBaseUrl}/api/about-content/admin/${sectionToSave.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content
      })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(payload?.message || 'Unable to save about content.');
    }

    const defaultSection = companyProfile.sections.find((section) => section.id === sectionToSave.id);

    return Array.isArray(sectionToSave.members) && defaultSection
      ? mergeEditableSection(defaultSection, payload.section.content)
      : {
          ...payload.section.content,
          id: sectionToSave.id,
          type: sectionToSave.type
        };
  }

  async function handleMemberPhotoUpload(index, file) {
    if (!file) {
      return;
    }

    setUploadingMemberKey(`${activeSectionId}-${index}`);
    setStatus({
      type: 'loading',
      message: ''
    });

    let uploadedPhotoUrl = '';

    try {
      const previousUploadedImage = activeSection.members[index]?.image;
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${apiBaseUrl}/api/about-content/admin/team-photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Unable to upload team photo.');
      }

      uploadedPhotoUrl = payload.url;
      const updatedSection = {
        ...activeSection,
        members: activeSection.members.map((member, memberIndex) =>
          memberIndex === index
            ? {
                ...member,
                image: uploadedPhotoUrl,
                previewImage: uploadedPhotoUrl
              }
            : member
        )
      };
      const savedSection = await saveContentSection(updatedSection);

      updateActiveSection(savedSection);
      if (previousUploadedImage && previousUploadedImage !== uploadedPhotoUrl) {
        await deleteUploadedPhotos([previousUploadedImage]).catch(() => {});
        setPendingPhotoDeletes((current) => current.filter((url) => url !== previousUploadedImage));
      }
      setBrokenPreviewImages((current) => {
        const next = { ...current };
        delete next[`${activeSectionId}-${index}`];
        return next;
      });
      setToast({
        type: 'success',
        message: 'Photo uploaded as WebP and published.'
      });
      setStatus({
        type: 'idle',
        message: ''
      });
    } catch (error) {
      if (uploadedPhotoUrl) {
        await deleteUploadedPhotos([uploadedPhotoUrl]).catch(() => {});
      }
      const message = error instanceof Error ? error.message : 'Unable to upload team photo.';
      setStatus({
        type: 'error',
        message: ''
      });
      setToast({
        type: 'error',
        message
      });
    } finally {
      setUploadingMemberKey('');
    }
  }

  function handleMetricChange(index, field, value) {
    updateActiveSection((section) => ({
      ...section,
      items: section.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    }));
  }

  async function handleContentSubmit(event) {
    event.preventDefault();

    if (!activeSection) {
      return;
    }

    setStatus({
      type: 'loading',
      message: ''
    });

    try {
      const parsedContent = safeJsonParse(advancedJson, activeSection);
      const savedSection = await saveContentSection({
        ...parsedContent,
        id: activeSection.id,
        type: activeSection.type
      });

      updateActiveSection(savedSection);
      await deleteUploadedPhotos(pendingPhotoDeletes).catch(() => {});
      setPendingPhotoDeletes([]);
      setStatus({
        type: 'success',
        message: ''
      });
      setToast({
        type: 'success',
        message: 'About content section saved.'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save about content.';
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
    window.history.replaceState({}, '', '/admin/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  if (!token) {
    window.history.replaceState({}, '', '/admin/login');
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Seo
        title={`${page === 'content' ? 'Content Management' : 'Mail Configuration'} | ZeroOne IT Inc. Admin`}
        description="Private ZeroOne IT Inc. administrator workspace."
        canonicalPath={page === 'content' ? '/admin/content' : '/admin/mail-config'}
        noindex
      />
      <div className="grid min-h-screen lg:grid-cols-[14.5rem_1fr]">
        <aside className="flex min-h-screen flex-col border-r border-slate-900/10 bg-[#07152b] px-4 py-4 text-white lg:sticky lg:top-0 lg:h-screen">
          <a className="flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-xs font-black text-[#07152b] shadow-lg shadow-black/20">
              01
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black">ZeroOne IT Inc.</span>
              <span className="block text-xs font-semibold text-blue-200/70">Admin Workspace</span>
            </span>
          </a>

          <nav className="mt-8 grid gap-6" aria-label="Admin navigation">
            <section className="grid gap-2">
              <p className="px-3 text-xs font-black uppercase tracking-[0.24em] text-blue-200/55">Main</p>
              <a
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-black shadow-lg shadow-black/10 transition ${
                  page === 'content'
                    ? 'border-blue-200/15 bg-blue-500/10 text-white'
                    : 'border-transparent text-blue-100/75 hover:bg-white/10 hover:text-white'
                }`}
                href="/admin/content"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-300/15 text-blue-100" aria-hidden="true">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 4.75h14A1.25 1.25 0 0 1 20.25 6v12A1.25 1.25 0 0 1 19 19.25H5A1.25 1.25 0 0 1 3.75 18V6A1.25 1.25 0 0 1 5 4.75Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M7.5 8.5h9M7.5 12h9M7.5 15.5h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </span>
                Content
                {page === 'content' ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-200" aria-hidden="true" />
                ) : null}
              </a>
              <a
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-black shadow-lg shadow-black/10 transition ${
                  page === 'mail-config'
                    ? 'border-blue-200/15 bg-blue-500/10 text-white'
                    : 'border-transparent text-blue-100/75 hover:bg-white/10 hover:text-white'
                }`}
                href="/admin/mail-config"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-300/15 text-blue-100" aria-hidden="true">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="m6 8 6 4.5L18 8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                </span>
                Mail Config
                {page === 'mail-config' ? (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-200" aria-hidden="true" />
                ) : null}
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
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/10"
              type="button"
              onClick={() => setIsProfileMenuOpen((current) => !current)}
              aria-expanded={isProfileMenuOpen}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-sm font-black text-[#07152b]">
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
          {page === 'content' ? (
            <div className="max-w-6xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Website Content</p>
              <h1 className="mt-3 text-4xl font-black tracking-normal text-slate-950">Content Management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Edit About Us page copy section by section. The public page keeps its existing layout and images while
                these text changes are loaded from the database.
              </p>

              <div className="mt-8 grid gap-5 lg:grid-cols-[16rem_1fr]">
                <nav className="grid content-start gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/80" aria-label="About page sections">
                  {contentSections.map((section) => (
                    <button
                      key={section.id}
                      className={`rounded-md px-3 py-3 text-left text-sm font-black transition ${
                        section.id === activeSectionId
                          ? 'bg-[#07152b] text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      {section.title || section.id}
                    </button>
                  ))}
                </nav>

                {activeSection ? (
                  <form
                    className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/80 sm:p-6"
                    onSubmit={handleContentSubmit}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">{activeSection.id}</p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950">{activeSection.title}</h2>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        {activeSection.type}
                      </span>
                    </div>

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-800">Section Title</span>
                      <input
                        className="h-12 rounded-md border border-slate-200 bg-slate-50 px-4 text-sm text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                        name="title"
                        value={activeSection.title || ''}
                        onChange={handleSectionFieldChange}
                      />
                    </label>

                    {Array.isArray(activeSection.paragraphs) ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-slate-800">Paragraphs</span>
                        <textarea
                          className="min-h-36 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                          name="paragraphs"
                          value={linesToText(activeSection.paragraphs)}
                          onChange={handleSectionFieldChange}
                        />
                        <span className="text-xs font-semibold text-slate-500">Put each paragraph on its own line.</span>
                      </label>
                    ) : null}

                    {'intro' in activeSection ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-slate-800">Intro</span>
                        <textarea
                          className="min-h-24 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                          name="intro"
                          value={activeSection.intro || ''}
                          onChange={handleSectionFieldChange}
                        />
                      </label>
                    ) : null}

                    {'outro' in activeSection ? (
                      <label className="grid gap-2">
                        <span className="text-sm font-bold text-slate-800">Outro</span>
                        <textarea
                          className="min-h-20 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400 focus:bg-white"
                          name="outro"
                          value={activeSection.outro || ''}
                          onChange={handleSectionFieldChange}
                        />
                      </label>
                    ) : null}

                    {Array.isArray(activeSection.cards) ? (
                      <div className="grid gap-3">
                        <p className="text-sm font-bold text-slate-800">Cards</p>
                        {activeSection.cards.map((card, index) => (
                          <div key={`${activeSection.id}-card-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <input
                              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-400"
                              value={card.title || ''}
                              onChange={(event) => handleCardChange(index, 'title', event.target.value)}
                              placeholder="Card title"
                            />
                            <textarea
                              className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400"
                              value={card.description || ''}
                              onChange={(event) => handleCardChange(index, 'description', event.target.value)}
                              placeholder="Card description"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {Array.isArray(activeSection.items) ? (
                      <div className="grid gap-3">
                        <p className="text-sm font-bold text-slate-800">Cards</p>
                        {activeSection.items.map((item, index) => (
                          <div key={`${activeSection.id}-metric-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_1fr]">
                            <input
                              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-400"
                              value={item.value || ''}
                              onChange={(event) => handleMetricChange(index, 'value', event.target.value)}
                              placeholder="Value"
                            />
                            <input
                              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-400"
                              value={item.label || ''}
                              onChange={(event) => handleMetricChange(index, 'label', event.target.value)}
                              placeholder="Label"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {Array.isArray(activeSection.members) ? (
                      <div className="grid gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-800">
                            {activeSection.id === 'business-partner' ? 'Strategic Partners' : 'Members'}
                          </p>
                          <button
                            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-800"
                            type="button"
                            onClick={handleAddMember}
                          >
                            {activeSection.id === 'business-partner' ? 'Add Partner' : 'Add Member'}
                          </button>
                        </div>
                        {activeSection.members.map((member, index) => (
                          <div key={`${activeSection.id}-member-${index}`} className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-3">
                              {(() => {
                                const previewImage = member.image || member.previewImage;
                                const previewKey = `${activeSectionId}-${index}`;

                                return previewImage && brokenPreviewImages[previewKey] !== previewImage ? (
                                <img
                                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                                  src={getPreviewImageUrl(previewImage)}
                                  alt={`${member.name || 'Team member'} preview`}
                                  onError={(event) => {
                                    setBrokenPreviewImages((current) => ({
                                      ...current,
                                      [previewKey]: previewImage
                                    }));
                                  }}
                                />
                                ) : (
                                <span className="grid h-16 w-16 place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                                  Photo
                                </span>
                                );
                              })()}
                              <div className="grid gap-1">
                                <label className="inline-flex h-10 cursor-pointer items-center rounded-md bg-[#07152b] px-4 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-blue-950">
                                  {uploadingMemberKey === `${activeSectionId}-${index}` ? 'Uploading...' : 'Upload Photo'}
                                  <input
                                    className="sr-only"
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingMemberKey === `${activeSectionId}-${index}`}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      handleMemberPhotoUpload(index, file);
                                      event.target.value = '';
                                    }}
                                  />
                                </label>
                                <span className="text-xs font-semibold text-slate-500">
                                  Images are converted to WebP automatically.
                                </span>
                              </div>
                              </div>
                              <button
                                className="h-10 rounded-md border border-rose-200 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-rose-700 transition hover:bg-rose-50"
                                type="button"
                                onClick={() => handleRemoveMember(index)}
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-400"
                              value={member.name || ''}
                              onChange={(event) => handleMemberChange(index, 'name', event.target.value)}
                              placeholder="Member name"
                            />
                            <textarea
                              className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none focus:border-blue-400"
                              value={member.role || ''}
                              onChange={(event) => handleMemberChange(index, 'role', event.target.value)}
                              placeholder="Member role"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <label className="grid gap-2">
                      <span className="text-sm font-bold text-slate-800">Advanced Section JSON</span>
                      <textarea
                        className="min-h-56 rounded-md border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-blue-400"
                        value={advancedJson}
                        onChange={(event) => setAdvancedJson(event.target.value)}
                        spellCheck="false"
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        Use this for nested About Us copy such as challenge lists and process steps.
                      </span>
                    </label>

                    <button
                      className="h-12 rounded-md bg-[#07152b] px-5 text-sm font-black text-white shadow-lg shadow-slate-300/80 transition hover:bg-blue-950 disabled:cursor-wait disabled:opacity-60"
                      type="submit"
                      disabled={status.type === 'loading'}
                    >
                      {status.type === 'loading' ? 'Saving...' : 'Save Section'}
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : (
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
          )}
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
