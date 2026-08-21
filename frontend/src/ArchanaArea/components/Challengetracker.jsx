import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { ChevronDown, Flame, X, Check, Clock, Lock, Plus, Calendar, Pencil, Trash2 } from 'lucide-react';
const VITE_API_BASE = import.meta.env.VITE_API_URL;
const API_BASE = `${VITE_API_BASE}/api`;

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}


function transformChallenge(c) {
  return {
    id: c.id,
    title: c.title,
    type: c.type,
    startDate: c.start_date,
    durationDays: c.duration_days,
    endDate: c.end_date,
    instantStatus: c.instant_status,
    log: Object.fromEntries((c.completed_dates || []).map((d) => [d, 'completed'])),
    backendStats: c.stats,
  };
}

function buildChallengePayload(formValues) {
  const body = {
    title: formValues.title,
    type: formValues.type,
    start_date: formValues.startDate,
  };
  if (formValues.type === 'days') {
    body.duration_days = formValues.durationDays;
  } else {
    body.end_date = formValues.endDate;
  }
  return body;
}


function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return formatISODate(date);
}

function calculateEndDate(startIso, durationDays) {
  if (!startIso || !durationDays || durationDays < 1) return '';
  return addDays(startIso, durationDays - 1);
}

function generateDayRange(startIso, durationDays) {
  const days = [];
  for (let i = 0; i < durationDays; i++) days.push(addDays(startIso, i));
  return days;
}

function todayISO() {
  return formatISODate(new Date());
}

function compareDates(a, b) {
  return a === b ? 0 : a < b ? -1 : 1;
}

function formatDisplayDate(iso) {
  if (!iso) return '';
  const d = parseISODate(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dayLabel(iso) {
  const d = parseISODate(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
function getDayStatus(iso, log) {
  if (log[iso] === 'completed') return 'completed';
  const cmp = compareDates(iso, todayISO());
  if (cmp < 0) return 'missed';
  if (cmp === 0) return 'today';
  return 'upcoming';
}

function isEditable(iso) {
  return iso === todayISO();
}

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
`;

const todayPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.35); }
  50% { box-shadow: 0 0 0 5px rgba(251, 191, 36, 0); }
`;

const PageWrapper = styled.div`
  min-height: 100%;
  width: 100%;
  background: #09090b;
  color: #f4f4f5;
  font-family: 'Inter', sans-serif;
`;

const Container = styled.div`
  margin: 0 auto;
  max-width: 48rem;
  padding: 2.5rem 1.25rem;
`;

const HeaderRow = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const Title = styled.h1`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #fafafa;
  margin: 0;
`;

const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #71717a;
`;

const ErrorText = styled.p`
  margin: 0 0 1rem;
  font-size: 0.8125rem;
  color: #fda4af;
`;

const NewChallengeButton = styled.button`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  border: none;
  border-radius: 0.5rem;
  background: #fbbf24;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #09090b;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: #fcd34d;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const ChallengeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EmptyState = styled.div`
  border-radius: 0.75rem;
  border: 1px dashed #27272a;
  padding: 3.5rem 0;
  text-align: center;
  font-size: 0.875rem;
  color: #71717a;
`;

const FormWrapper = styled.form`
  margin-bottom: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #27272a;
  background: #18181b;
  padding: 1.25rem;
`;

const FieldGroup = styled.div`
  margin-bottom: 1rem;
`;

const FieldLabel = styled.label`
  margin-bottom: 0.375rem;
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717a;
`;

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  border-radius: 0.5rem;
  border: 1px solid #27272a;
  background: #09090b;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #f4f4f5;
  outline: none;
  transition: border-color 0.15s ease;

  &::placeholder {
    color: #52525b;
  }

  &:focus {
    border-color: #fbbf24;
  }
`;

const DateInput = styled(TextInput).attrs({ type: 'date' })``;
const NumberInput = styled(TextInput).attrs({ type: 'number' })``;

const TypeToggleRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TypeButton = styled.button`
  flex: 1;
  border-radius: 0.5rem;
  border: 1px solid ${(p) => (p.$active ? '#fbbf24' : '#27272a')};
  background: ${(p) => (p.$active ? 'rgba(251, 191, 36, 0.1)' : '#09090b')};
  color: ${(p) => (p.$active ? '#fcd34d' : '#a1a1aa')};
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(p) => (p.$active ? '#fbbf24' : '#3f3f46')};
  }
`;

const DateGrid = styled.div`
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`;

const EndDateInfo = styled.div`
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.5rem;
  background: #09090b;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  color: #a1a1aa;
`;

const CalendarIcon = styled(Calendar)`
  flex-shrink: 0;
  color: #fbbf24;
`;

const Strong = styled.span`
  font-weight: 500;
  color: #e4e4e7;
`;

const Dot = styled.span`
  color: #52525b;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SubmitButton = styled.button`
  border: none;
  border-radius: 0.5rem;
  background: #fbbf24;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #09090b;
  cursor: pointer;

  &:hover {
    background: #fcd34d;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const CancelButton = styled.button`
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #a1a1aa;
  cursor: pointer;

  &:hover {
    color: #e4e4e7;
  }
`;

const CardWrapper = styled.div`
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid #27272a;
  background: #18181b;
`;

const CardHeaderButton = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  text-align: left;
  background: transparent;
  border: none;
  box-sizing: border-box;
  cursor: ${(p) => (p.$clickable ? 'pointer' : 'default')};
`;

const CardTitleBlock = styled.div`
  min-width: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardTitle = styled.h3`
  font-family: 'Space Grotesk', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
  font-weight: 600;
  color: #fafafa;
  margin: 0;
`;

const TypeBadge = styled.span`
  flex-shrink: 0;
  border-radius: 9999px;
  background: #27272a;
  padding: 0.125rem 0.5rem;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #a1a1aa;
`;

const DateRange = styled.p`
  margin: 0.125rem 0 0;
  font-size: 0.75rem;
  color: #71717a;
`;

const CardMetaRow = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.75rem;
`;

const StreakBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: #fbbf24;
`;

const StreakValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
`;

const ProgressOuter = styled.div`
  display: none;
  width: 4rem;

  @media (min-width: 640px) {
    display: block;
  }
`;

const ProgressTrack = styled.div`
  height: 0.375rem;
  width: 100%;
  overflow: hidden;
  border-radius: 9999px;
  background: #27272a;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 9999px;
  background: #fbbf24;
  width: ${(p) => p.$pct}%;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  padding: 0.25rem;
  color: #52525b;
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover {
    color: #e4e4e7;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Chevron = styled(ChevronDown)`
  color: #71717a;
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$expanded ? '180deg' : '0deg')});
`;

const CardBody = styled.div`
  border-top: 1px solid #27272a;
  padding: 1rem 1.25rem;
`;

const controlActiveStyles = {
  completed: css`
    background: rgba(52, 211, 153, 0.15);
    border-color: #34d399;
    color: #6ee7b7;
  `,
  not_completed: css`
    background: rgba(251, 113, 133, 0.15);
    border-color: #fb7185;
    color: #fda4af;
  `,
  pending: css`
    background: rgba(63, 63, 70, 0.4);
    border-color: #71717a;
    color: #e4e4e7;
  `,
};

const ControlsRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ControlButton = styled.button`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  border: 1px solid #27272a;
  background: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #71717a;
  cursor: pointer;
  transition: all 0.15s ease;

  ${(p) => (p.$active ? controlActiveStyles[p.$statusKey] : '')}

  &:hover {
    border-color: ${(p) => (p.$active ? undefined : '#3f3f46')};
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const StatsGrid = styled.div`
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
`;

const StatCard = styled.div`
  border-radius: 0.5rem;
  background: #09090b;
  padding: 0.625rem 0.5rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: #fafafa;
`;

const StatLabel = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #71717a;
`;

const GridWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.375rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(10, 1fr);
  }
`;

const cellStatusStyles = {
  completed: css`
    border-color: #fbbf24;
    background: rgba(251, 191, 36, 0.9);
    color: #09090b;
  `,
  missed: css`
    border-color: #27272a;
    background: transparent;
    color: #3f3f46;
  `,
  today: css`
    border-color: rgba(251, 191, 36, 0.7);
    background: transparent;
    color: #fcd34d;
  `,
  upcoming: css`
    border-color: rgba(39, 39, 42, 0.6);
    border-style: dashed;
    background: transparent;
    color: #3f3f46;
  `,
};

const Cell = styled.button`
  position: relative;
  display: flex;
  aspect-ratio: 1 / 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s ease;
  cursor: ${(p) => (p.$editable ? 'pointer' : 'default')};

  ${(p) => cellStatusStyles[p.$status]}

  ${(p) =>
    p.$editable &&
    p.$status === 'today' &&
    css`
      animation: ${todayPulse} 2.2s ease-in-out infinite;
    `}

  &:hover .lock-icon {
    opacity: 1;
  }
`;

const DayLetter = styled.span`
  font-size: 9px;
  text-transform: uppercase;
  line-height: 1;
  opacity: 0.7;
`;

const DateNum = styled.span`
  line-height: 1;
`;

const MissedDot = styled.span`
  position: absolute;
  bottom: 2px;
  height: 4px;
  width: 4px;
  border-radius: 9999px;
  background: #3f3f46;
`;

const LockIcon = styled(Lock).attrs({ size: 9, className: 'lock-icon' })`
  position: absolute;
  right: 2px;
  top: 2px;
  color: #3f3f46;
  opacity: 0;
  transition: opacity 0.15s ease;
`;


export default function ChallengeTrackerPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChallenges() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await apiRequest('/challenges/');
        if (!cancelled) setChallenges(data.map(transformChallenge));
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChallenges();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleNewChallengeClick() {
    if (showForm && !editingChallenge) {
      setShowForm(false);
    } else {
      setEditingChallenge(null);
      setShowForm(true);
    }
  }

  function handleEditChallenge(challenge) {
    setEditingChallenge(challenge);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingChallenge(null);
  }

  async function handleCreateChallenge(formValues) {
    const created = await apiRequest('/challenges/', {
      method: 'POST',
      body: JSON.stringify(buildChallengePayload(formValues)),
    });
    setChallenges((prev) => [transformChallenge(created), ...prev]);
    setShowForm(false);
  }

  async function handleUpdateChallenge(challengeId, formValues) {
    const updated = await apiRequest(`/challenges/${challengeId}/`, {
      method: 'PATCH',
      body: JSON.stringify(buildChallengePayload(formValues)),
    });
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? transformChallenge(updated) : c))
    );
    setShowForm(false);
    setEditingChallenge(null);
  }

  async function handleDeleteChallenge(challengeId) {
    if (!window.confirm('Delete this challenge? This cannot be undone.')) return;
    try {
      await apiRequest(`/challenges/${challengeId}/`, { method: 'DELETE' });
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      if (editingChallenge?.id === challengeId) {
        setShowForm(false);
        setEditingChallenge(null);
      }
    } catch (err) {
      console.error('Failed to delete challenge:', err.message);
    }
  }

  async function handleToggleDay(challengeId, iso) {
    if (!isEditable(iso)) return;
    try {
      const result = await apiRequest(`/challenges/${challengeId}/mark-day/`, { method: 'POST' });
      setChallenges((prev) =>
        prev.map((c) => {
          if (c.id !== challengeId) return c;
          const newLog = { ...c.log };
          if (result.completed) newLog[iso] = 'completed';
          else delete newLog[iso];
          return { ...c, log: newLog, backendStats: result.stats };
        })
      );
    } catch (err) {
      console.error('Failed to mark day:', err.message);
    }
  }

  async function handleSetInstantStatus(challengeId, statusValue) {
    try {
      const updated = await apiRequest(`/challenges/${challengeId}/instant-status/`, {
        method: 'PATCH',
        body: JSON.stringify({ instant_status: statusValue }),
      });
      setChallenges((prev) =>
        prev.map((c) => (c.id === challengeId ? transformChallenge(updated) : c))
      );
    } catch (err) {
      console.error('Failed to set status:', err.message);
    }
  }

  return (
    <PageWrapper>
      <GlobalStyle />
      <Container>
        <HeaderRow>
          <div>
            <Title>Challenges</Title>
            <Subtitle>Day-based challenges lock once the day passes. Only today is editable.</Subtitle>
          </div>
          <NewChallengeButton onClick={handleNewChallengeClick} disabled={loading}>
            <Plus size={16} strokeWidth={2.5} />
            New challenge
          </NewChallengeButton>
        </HeaderRow>

        {showForm && (
          <ChallengeCreateForm
            key={editingChallenge ? `edit-${editingChallenge.id}` : 'new'}
            editingChallenge={editingChallenge}
            onCreate={handleCreateChallenge}
            onUpdate={handleUpdateChallenge}
            onCancel={handleCancelForm}
          />
        )}

        {loading && <Subtitle>Loading challenges...</Subtitle>}
        {!loading && loadError && <ErrorText>Couldn't load challenges: {loadError}</ErrorText>}

        {!loading && !loadError && (
          <ChallengeList>
            {challenges.map((c) => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                onToggleDay={handleToggleDay}
                onSetInstantStatus={handleSetInstantStatus}
                onEdit={handleEditChallenge}
                onDelete={handleDeleteChallenge}
              />
            ))}
            {challenges.length === 0 && <EmptyState>No challenges yet. Start one above.</EmptyState>}
          </ChallengeList>
        )}
      </Container>
    </PageWrapper>
  );
}


function ChallengeCreateForm({ editingChallenge, onCreate, onUpdate, onCancel }) {
  const isEditing = Boolean(editingChallenge);

  const [title, setTitle] = useState(editingChallenge?.title ?? '');
  const [type, setType] = useState(editingChallenge?.type ?? 'days');
  const [startDate, setStartDate] = useState(editingChallenge?.startDate ?? todayISO());
  const [durationDays, setDurationDays] = useState(
    editingChallenge?.type === 'days' ? editingChallenge.durationDays : 30
  );
  const [instantEndDate, setInstantEndDate] = useState(
    editingChallenge?.type === 'instant' ? editingChallenge.endDate : addDays(todayISO(), 9)
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const computedEndDate = useMemo(() => {
    if (type === 'days') return calculateEndDate(startDate, Number(durationDays) || 0);
    return instantEndDate;
  }, [type, startDate, durationDays, instantEndDate]);

  const totalDaysPreview = useMemo(() => {
    if (!startDate || !computedEndDate) return 0;
    return Math.round((parseISODate(computedEndDate) - parseISODate(startDate)) / 86400000) + 1;
  }, [startDate, computedEndDate]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !startDate || !computedEndDate) return;

    setSubmitting(true);
    setFormError('');
    try {
      const values = {
        title: title.trim(),
        type,
        startDate,
        durationDays: type === 'days' ? Number(durationDays) : totalDaysPreview,
        endDate: computedEndDate,
      };
      if (isEditing) {
        await onUpdate(editingChallenge.id, values);
      } else {
        await onCreate(values);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormWrapper onSubmit={submit}>
      <FieldGroup>
        <FieldLabel>Challenge title</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 30 Days of DSA"
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Challenge type</FieldLabel>
        <TypeToggleRow>
          <TypeButton type="button" $active={type === 'days'} onClick={() => setType('days')}>
            Days challenge
          </TypeButton>
          <TypeButton type="button" $active={type === 'instant'} onClick={() => setType('instant')}>
            Instant challenge
          </TypeButton>
        </TypeToggleRow>
      </FieldGroup>

      <DateGrid>
        <div>
          <FieldLabel>Start date</FieldLabel>
          <DateInput value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        {type === 'days' ? (
          <div>
            <FieldLabel>Duration (days)</FieldLabel>
            <NumberInput
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <FieldLabel>End date</FieldLabel>
            <DateInput
              value={instantEndDate}
              min={startDate}
              onChange={(e) => setInstantEndDate(e.target.value)}
            />
          </div>
        )}
      </DateGrid>

      <EndDateInfo>
        <CalendarIcon size={15} />
        Ends <Strong>{formatDisplayDate(computedEndDate)}</Strong>
        <Dot>&middot;</Dot>
        <Strong>{totalDaysPreview}</Strong> total days
      </EndDateInfo>

      {formError && <ErrorText>{formError}</ErrorText>}

      <ButtonRow>
        <SubmitButton type="submit" disabled={submitting}>
          {submitting
            ? isEditing
              ? 'Saving...'
              : 'Creating...'
            : isEditing
            ? 'Save changes'
            : 'Create challenge'}
        </SubmitButton>
        <CancelButton type="button" onClick={onCancel}>
          Cancel
        </CancelButton>
      </ButtonRow>
    </FormWrapper>
  );
}

function ChallengeCard({ challenge, onToggleDay, onSetInstantStatus, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    if (challenge.type !== 'days' || !challenge.backendStats) return null;
    return {
      totalDays: challenge.backendStats.total_days,
      completed: challenge.backendStats.completed,
      missed: challenge.backendStats.missed,
      remaining: challenge.backendStats.remaining,
      currentStreak: challenge.backendStats.current_streak,
      longestStreak: challenge.backendStats.longest_streak,
      days: generateDayRange(challenge.startDate, challenge.durationDays),
    };
  }, [challenge]);

  const progressPct = stats ? Math.round((stats.completed / stats.totalDays) * 100) : 0;
  const clickable = challenge.type === 'days';

  function toggleExpanded() {
    if (clickable) setExpanded((v) => !v);
  }

  return (
    <CardWrapper>
      <CardHeaderButton
        $clickable={clickable}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={toggleExpanded}
        onKeyDown={(e) => {
          if (clickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <CardTitleBlock>
          <TitleRow>
            <CardTitle>{challenge.title}</CardTitle>
            <TypeBadge>{challenge.type === 'days' ? 'Days' : 'Instant'}</TypeBadge>
          </TitleRow>
          <DateRange>
            {formatDisplayDate(challenge.startDate)} &rarr; {formatDisplayDate(challenge.endDate)}
          </DateRange>
        </CardTitleBlock>

        <CardMetaRow>
          {challenge.type === 'days' && stats && (
            <>
              <StreakBadge>
                <Flame size={15} />
                <StreakValue>{stats.currentStreak}</StreakValue>
              </StreakBadge>
              <ProgressOuter>
                <ProgressTrack>
                  <ProgressFill $pct={progressPct} />
                </ProgressTrack>
              </ProgressOuter>
            </>
          )}
          <IconButton
            type="button"
            title="Edit challenge"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(challenge);
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton
            type="button"
            title="Delete challenge"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(challenge.id);
            }}
          >
            <Trash2 size={14} />
          </IconButton>
          {challenge.type === 'days' && stats && <Chevron size={18} $expanded={expanded} />}
        </CardMetaRow>
      </CardHeaderButton>

      {challenge.type === 'instant' && (
        <CardBody>
          <InstantChallengeControls
            status={challenge.instantStatus}
            onChange={(status) => onSetInstantStatus(challenge.id, status)}
          />
        </CardBody>
      )}

      {challenge.type === 'days' && expanded && stats && (
        <CardBody>
          <ReportStats stats={stats} />
          <DaysGrid
            days={stats.days}
            log={challenge.log}
            onToggleDay={(iso) => onToggleDay(challenge.id, iso)}
          />
        </CardBody>
      )}
    </CardWrapper>
  );
}

function InstantChallengeControls({ status, onChange }) {
  const options = [
    { key: 'completed', label: 'Completed', icon: Check },
    { key: 'not_completed', label: 'Not completed', icon: X },
    { key: 'pending', label: 'Pending', icon: Clock },
  ];

  return (
    <ControlsRow>
      {options.map(({ key, label, icon: Icon }) => (
        <ControlButton
          key={key}
          $active={status === key}
          $statusKey={key}
          onClick={() => onChange(key)}
        >
          <Icon size={14} />
          {label}
        </ControlButton>
      ))}
    </ControlsRow>
  );
}


function ReportStats({ stats }) {
  const items = [
    { label: 'Done', value: stats.completed },
    { label: 'Missed', value: stats.missed },
    { label: 'Remaining', value: stats.remaining },
    { label: 'Best streak', value: stats.longestStreak },
  ];
  return (
    <StatsGrid>
      {items.map((it) => (
        <StatCard key={it.label}>
          <StatValue>{it.value}</StatValue>
          <StatLabel>{it.label}</StatLabel>
        </StatCard>
      ))}
    </StatsGrid>
  );
}


function DaysGrid({ days, log, onToggleDay }) {
  return (
    <GridWrapper>
      {days.map((iso) => (
        <DayCell key={iso} iso={iso} log={log} onToggleDay={onToggleDay} />
      ))}
    </GridWrapper>
  );
}

function DayCell({ iso, log, onToggleDay }) {
  const status = getDayStatus(iso, log);
  const editable = isEditable(iso);
  const dateNum = parseISODate(iso).getDate();

  return (
    <Cell
      type="button"
      $status={status}
      $editable={editable}
      onClick={() => editable && onToggleDay(iso)}
      disabled={!editable}
      title={`${formatDisplayDate(iso)} - ${status}${editable ? ' (tap to toggle)' : ''}`}
    >
      <DayLetter>{dayLabel(iso).slice(0, 1)}</DayLetter>
      <DateNum>{dateNum}</DateNum>
      {status === 'missed' && <MissedDot />}
      {!editable && status !== 'completed' && status !== 'missed' && <LockIcon />}
    </Cell>
  );
}