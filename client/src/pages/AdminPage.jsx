import { useEffect, useState } from 'preact/hooks';

const resourceDefinitions = [
  {
    key: 'countdowns',
    label: 'Countdowns',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'targetDate', label: 'Target date', type: 'date', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true }
    ],
    summary: (record) =>
      `${record.title} · ${record.targetDate}${record.category ? ` · ${record.category}` : ''}`
  },
  {
    key: 'announcements',
    label: 'Announcements',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'body', label: 'Message', type: 'textarea' },
      {
        name: 'priority',
        label: 'Priority',
        type: 'select',
        defaultValue: 'normal',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'normal', label: 'Normal' },
          { value: 'high', label: 'High' }
        ]
      },
      { name: 'startsAt', label: 'Starts at', type: 'datetime-local' },
      { name: 'endsAt', label: 'Ends at', type: 'datetime-local' },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true }
    ],
    summary: (record) =>
      `${record.title}${record.priority ? ` · ${record.priority}` : ''}`
  },
  {
    key: 'locations',
    label: 'Weather locations',
    fields: [
      { name: 'name', label: 'Display name', type: 'text', required: true },
      { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', min: -90, max: 90, required: true },
      { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', min: -180, max: 180, required: true },
      { name: 'timezone', label: 'Time zone', type: 'text', required: true, defaultValue: 'America/New_York' },
      { name: 'sortOrder', label: 'Display order', type: 'number', min: 0, max: 999, defaultValue: 0 },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true }
    ],
    summary: (record) =>
      `${record.name} · ${record.latitude}, ${record.longitude}`
  },
  {
    key: 'favorite-teams',
    label: 'Favorite teams',
    fields: [
      { name: 'teamName', label: 'Team name', type: 'text', required: true },
      { name: 'sport', label: 'Sport', type: 'text', required: true },
      { name: 'league', label: 'League', type: 'text' },
      { name: 'dataSource', label: 'Provider', type: 'text', required: true, defaultValue: 'thesportsdb' },
      { name: 'externalTeamId', label: 'Provider team ID', type: 'text' },
      { name: 'sortOrder', label: 'Display order', type: 'number', min: 0, max: 999, defaultValue: 0 },
      { name: 'isActive', label: 'Active', type: 'checkbox', defaultValue: true }
    ],
    summary: (record) =>
      `${record.teamName} · ${record.sport}${record.league ? ` · ${record.league}` : ''}`
  }
];

function emptyRecord(fields) {
  return fields.reduce((record, field) => {
    record[field.name] = field.type === 'checkbox'
      ? Boolean(field.defaultValue)
      : field.defaultValue ?? '';

    return record;
  }, {});
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed.');

    error.fields = data.fields || {};

    throw error;
  }

  return data;
}

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiRequest('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });

      onLogin();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main class="admin-login-page">
      <form class="admin-login-card" onSubmit={handleSubmit}>
        <p class="dashboard-eyebrow">Goselaz home</p>
        <h1>Dashboard admin</h1>
        <p>Sign in to manage household dashboard data.</p>

        <label class="admin-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onInput={(event) => setPassword(event.currentTarget.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p class="admin-error">{error}</p>}

        <button
          class="admin-button admin-button--primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

function AdminField({ field, value, error, onChange }) {
  const inputId = `admin-${field.name}`;

  if (field.type === 'checkbox') {
    return (
      <label class="admin-checkbox" for={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(field.name, event.currentTarget.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  return (
    <label class="admin-field" for={inputId}>
      <span>{field.label}{field.required ? ' *' : ''}</span>

      {field.type === 'textarea' ? (
        <textarea
          id={inputId}
          value={value || ''}
          onInput={(event) => onChange(field.name, event.currentTarget.value)}
          rows="3"
        />
      ) : field.type === 'select' ? (
        <select
          id={inputId}
          value={value || ''}
          onChange={(event) => onChange(field.name, event.currentTarget.value)}
        >
          {field.options.map((option) => (
            <option value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          type={field.type}
          value={value ?? ''}
          min={field.min}
          max={field.max}
          step={field.step}
          onInput={(event) => onChange(field.name, event.currentTarget.value)}
          required={field.required}
        />
      )}

      {error && <small class="admin-field-error">{error}</small>}
    </label>
  );
}

function EntityPanel({
  definition,
  records,
  onSave,
  onDelete,
  isWorking
}) {
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState(emptyRecord(definition.fields));
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  function startCreate() {
    setEditingRecord(null);
    setFormData(emptyRecord(definition.fields));
    setFormError('');
    setFieldErrors({});
  }

  function startEdit(record) {
    setEditingRecord(record);
    setFormData({
      ...emptyRecord(definition.fields),
      ...record,
      startsAt: record.startsAt
        ? record.startsAt.slice(0, 16)
        : '',
      endsAt: record.endsAt
        ? record.endsAt.slice(0, 16)
        : ''
    });
    setFormError('');
    setFieldErrors({});
  }

  function updateField(name, value) {
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setFormError('');
    setFieldErrors({});

    try {
      await onSave(
        definition.key,
        editingRecord?.id,
        formData
      );

      startCreate();
    } catch (error) {
      setFormError(error.message);
      setFieldErrors(error.fields || {});
    }
  }

  async function deleteRecord(record) {
    const confirmed = window.confirm(
      `Delete "${definition.summary(record)}"?`
    );

    if (!confirmed) {
      return;
    }

    await onDelete(definition.key, record.id);
  }

  return (
    <section class="admin-panel">
      <div class="admin-panel__header">
        <div>
          <h2>{definition.label}</h2>
          <p>{records.length} record{records.length === 1 ? '' : 's'}</p>
        </div>

        <button
          class="admin-button"
          type="button"
          onClick={startCreate}
        >
          Add new
        </button>
      </div>

      <div class="admin-record-list">
        {records.length === 0 ? (
          <p class="admin-empty">No records yet.</p>
        ) : (
          records.map((record) => (
            <div class="admin-record" key={record.id}>
              <p>{definition.summary(record)}</p>

              <div class="admin-record__actions">
                <button
                  type="button"
                  onClick={() => startEdit(record)}
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="admin-delete-button"
                  onClick={() => deleteRecord(record)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form class="admin-editor" onSubmit={submitForm}>
        <h3>
          {editingRecord ? 'Edit record' : `Add ${definition.label.toLowerCase()}`}
        </h3>

        <div class="admin-form-grid">
          {definition.fields.map((field) => (
            <AdminField
              key={field.name}
              field={field}
              value={formData[field.name]}
              error={fieldErrors[field.name]}
              onChange={updateField}
            />
          ))}
        </div>

        {formError && <p class="admin-error">{formError}</p>}

        <div class="admin-editor__actions">
          <button
            class="admin-button admin-button--primary"
            type="submit"
            disabled={isWorking}
          >
            {isWorking
              ? 'Saving…'
              : editingRecord
                ? 'Save changes'
                : 'Create record'}
          </button>

          <button
            class="admin-button"
            type="button"
            onClick={startCreate}
            disabled={isWorking}
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  );
}

function AdminPage() {
  const [authenticationState, setAuthenticationState] = useState('loading');
  const [records, setRecords] = useState({});
  const [pageError, setPageError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  async function loadRecords() {
    setPageError('');

    try {
      const results = await Promise.all(
        resourceDefinitions.map(async (definition) => {
          const response = await apiRequest(
            `/api/admin/${definition.key}`
          );

          return [definition.key, response.records];
        })
      );

      setRecords(Object.fromEntries(results));
    } catch (error) {
      setPageError(error.message);
    }
  }

  async function checkSession() {
    try {
      const response = await apiRequest('/api/admin/session');

      if (response.authenticated) {
        setAuthenticationState('authenticated');
        await loadRecords();
      } else {
        setAuthenticationState('unauthenticated');
      }
    } catch (error) {
      setPageError(error.message);
      setAuthenticationState('unauthenticated');
    }
  }

  useEffect(() => {
    checkSession();
  }, []);

  async function saveRecord(resource, recordId, data) {
    setIsWorking(true);

    try {
      const method = recordId ? 'PUT' : 'POST';
      const url = recordId
        ? `/api/admin/${resource}/${recordId}`
        : `/api/admin/${resource}`;

      await apiRequest(url, {
        method,
        body: JSON.stringify(data)
      });

      await loadRecords();
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteRecord(resource, recordId) {
    setIsWorking(true);

    try {
      await apiRequest(`/api/admin/${resource}/${recordId}`, {
        method: 'DELETE'
      });

      await loadRecords();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsWorking(false);
    }
  }

  async function logout() {
    await apiRequest('/api/admin/logout', {
      method: 'POST'
    });

    setRecords({});
    setAuthenticationState('unauthenticated');
  }

  if (authenticationState === 'loading') {
    return (
      <main class="admin-login-page">
        <p>Checking admin session…</p>
      </main>
    );
  }

  if (authenticationState !== 'authenticated') {
    return <LoginForm onLogin={checkSession} />;
  }

  return (
    <main class="admin-page">
      <header class="admin-topbar">
        <div>
          <p class="dashboard-eyebrow">Goselaz home</p>
          <h1>Dashboard admin</h1>
          <p>Changes appear on the dashboard during its next refresh.</p>
        </div>

        <div class="admin-topbar__actions">
          <a class="admin-button" href="/">View dashboard</a>

          <button
            class="admin-button"
            type="button"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </header>

      {pageError && <p class="admin-error admin-page-error">{pageError}</p>}

      <div class="admin-grid">
        {resourceDefinitions.map((definition) => (
          <EntityPanel
            key={definition.key}
            definition={definition}
            records={records[definition.key] || []}
            onSave={saveRecord}
            onDelete={deleteRecord}
            isWorking={isWorking}
          />
        ))}
      </div>
    </main>
  );
}

export default AdminPage;