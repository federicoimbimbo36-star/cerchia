import { useState, useEffect, useRef } from 'react';
import {
  Users, Plus, User, ArrowLeft, Check, Shuffle, Flag, Trophy,
  Copy, Eye, EyeOff, Camera, Lock, Phone, Mail, LogOut, Trash2, X,
  Sparkles, ChevronRight,
} from 'lucide-react';
import { supabase, phoneToTechnicalEmail, normalizePhone } from './supabaseClient';

/* ---------------------------------------------------------------------- */
/* DATI DI PROVA                                                          */
/* ---------------------------------------------------------------------- */

const PALETTE = ['#2F6FED', '#FF6B4A', '#1FAE7A', '#F0A93A', '#8B5CF6', '#EC4899'];
const REACTIONS = ['ðŸ‘', 'ðŸ”¥', 'ðŸ˜‚', 'ðŸ†'];
const RESERVED_NICKNAMES = ['giulia_99', 'marco_re', 'sara_official', 'admin'];
const POINT_OPTIONS = [-30, -15, -10, -5, 5, 10, 15, 30];

const FORMATS = [
  {
    id: 'vacanza',
    name: 'Vacanza Soft',
    emoji: 'ðŸ–ï¸',
    tagline: 'Ritmo lento, missioni diffuse su piÃ¹ giorni',
    missions: [
      { id: 'v1', title: 'Prepara la colazione per tutti', points: 10, repeatable: true, cooldownSec: 20, requiresConsent: false },
      { id: 'v2', title: 'Porta il gruppo in un posto non turistico', points: 15, repeatable: false, requiresConsent: false },
      { id: 'v3', title: 'Scatta una foto di gruppo in cui ridono tutti', points: 12, repeatable: false, requiresConsent: true },
      { id: 'v4', title: 'Cucina un piatto a sorpresa per il gruppo', points: 12, repeatable: true, cooldownSec: 25, requiresConsent: false },
    ],
  },
  {
    id: 'nightout',
    name: 'Night Out',
    emoji: 'ðŸŒƒ',
    tagline: 'Missioni rapide, pensate per una serata sola',
    missions: [
      { id: 'n1', title: 'Fai ridere il gruppo con una storia vera in 1 minuto', points: 8, repeatable: true, cooldownSec: 15, requiresConsent: false },
      { id: 'n2', title: 'Scatta una foto artistica del locale', points: 6, repeatable: false, requiresConsent: false },
      { id: 'n3', title: 'Indovina il prossimo ordine di qualcuno', points: 10, repeatable: true, cooldownSec: 18, requiresConsent: false },
      { id: 'n4', title: 'Organizza un brindisi analcolico a tema', points: 10, repeatable: false, requiresConsent: false },
    ],
  },
  {
    id: 'festival',
    name: 'Festival Crew',
    emoji: 'ðŸŽ§',
    tagline: 'Esplorazione e resistenza del gruppo su piÃ¹ giorni',
    missions: [
      { id: 'f1', title: 'Ritrova il gruppo al punto B in meno di 15 minuti', points: 15, repeatable: false, requiresConsent: false },
      { id: 'f2', title: 'Scopri un artista sconosciuto e convinci un amico ad ascoltarlo', points: 10, repeatable: false, requiresConsent: true },
      { id: 'f3', title: 'Arriva primo al ritrovo colazione', points: 8, repeatable: true, cooldownSec: 20, requiresConsent: false },
      { id: 'f4', title: 'Cattura il momento migliore della giornata in una foto', points: 8, repeatable: true, cooldownSec: 25, requiresConsent: true },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    emoji: 'ðŸ§©',
    tagline: 'Nessuna missione preimpostata: create voi le regole del gioco',
    missions: [],
  },
];

const ME = { id: 'u1', name: 'Tu', color: '#2F6FED' };

const DEMO_CIRCLE = {
  id: 'c1',
  name: 'Weekend a Riccione',
  formatId: 'vacanza',
  status: 'active',
  code: 'RIC482',
  ownerId: 'u1',
  members: [
    ME,
    { id: 'u2', name: 'Giulia', color: '#FF6B4A' },
    { id: 'u3', name: 'Marco', color: '#1FAE7A' },
    { id: 'u4', name: 'Sara', color: '#F0A93A' },
  ],
  customMissions: [],
  disabledMissionIds: [],
  scoreEntries: [
    { id: 'e1', missionId: 'v1', userId: 'u2', points: 10, hidden: false, reactions: { 'ðŸ‘': 2 }, ts: Date.now() - 1000 * 60 * 60 * 30 },
    { id: 'e2', missionId: 'v2', userId: 'u2', points: 15, hidden: false, reactions: { 'ðŸ”¥': 1 }, ts: Date.now() - 1000 * 60 * 60 * 26 },
    { id: 'e3', missionId: 'v3', userId: 'u3', points: 12, hidden: false, reactions: {}, ts: Date.now() - 1000 * 60 * 60 * 20 },
    { id: 'e4', missionId: 'v4', userId: 'u3', points: 12, hidden: true, reactions: {}, ts: Date.now() - 1000 * 60 * 60 * 15 },
    { id: 'e5', missionId: 'v4', userId: 'u4', points: 12, hidden: false, reactions: { 'ðŸ˜‚': 1 }, ts: Date.now() - 1000 * 60 * 60 * 10 },
    { id: 'e6', missionId: 'v1', userId: 'u1', points: 10, hidden: false, reactions: {}, ts: Date.now() - 1000 * 60 * 60 * 4 },
  ],
};

const JOIN_CIRCLE_TEMPLATE = {
  id: 'c2',
  name: 'Trip Squad',
  formatId: 'festival',
  status: 'active',
  code: 'FEST24',
  ownerId: 'u5',
  members: [
    { id: 'u5', name: 'Alessandro', color: '#8B5CF6' },
    { id: 'u6', name: 'Chiara', color: '#EC4899' },
  ],
  customMissions: [],
  disabledMissionIds: [],
  scoreEntries: [
    { id: 'j1', missionId: 'f3', userId: 'u5', points: 8, hidden: false, reactions: {}, ts: Date.now() - 1000 * 60 * 60 * 5 },
  ],
};

/* ---------------------------------------------------------------------- */
/* HELPER                                                                  */
/* ---------------------------------------------------------------------- */

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function formatFor(formatId) {
  return FORMATS.find((f) => f.id === formatId);
}

function allMissionsFor(circle) {
  const base = (formatFor(circle.formatId)?.missions || []).filter(
    (m) => !(circle.disabledMissionIds || []).includes(m.id)
  );
  const custom = (circle.customMissions || []).filter((m) => !m.removed);
  return [...base, ...custom];
}

// A differenza di allMissionsFor (solo missioni attive), questa cerca anche tra
// quelle rimosse/disabilitate: serve per mostrare correttamente i titoli nello
// storico/recap anche dopo che una missione Ã¨ stata eliminata dal creatore.
function findMissionById(circle, missionId) {
  const base = formatFor(circle.formatId)?.missions || [];
  const custom = circle.customMissions || [];
  return base.find((m) => m.id === missionId) || custom.find((m) => m.id === missionId);
}

function scoresFor(circle) {
  return circle.members
    .map((m) => ({
      ...m,
      total: circle.scoreEntries.filter((e) => e.userId === m.id).reduce((s, e) => s + e.points, 0),
    }))
    .sort((a, b) => b.total - a.total);
}

function relativeTime(ts) {
  const diffMin = Math.round((Date.now() - ts) / 60000);
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h fa`;
  const diffD = Math.round(diffH / 24);
  return `${diffD} g fa`;
}

function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase();
}

function signed(n) {
  return n > 0 ? `+${n}` : `${n}`;
}

/* ---------------------------------------------------------------------- */
/* COMPONENTI PICCOLI                                                      */
/* ---------------------------------------------------------------------- */

function AvatarCircle({ name, color, size = 40 }) {
  return (
    <div
      className="avatar-circle"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.42,
      }}
    >
      {initials(name)}
    </div>
  );
}

function Chip({ children, tone = 'muted' }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

/* ---------------------------------------------------------------------- */
/* APP                                                                     */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authMode, setAuthMode] = useState('signup');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showAuthConfirmPassword, setShowAuthConfirmPassword] = useState(false);

  const [circles, setCircles] = useState([DEMO_CIRCLE]);
  const [activeTab, setActiveTab] = useState('gruppi');
  const [openCircleId, setOpenCircleId] = useState(null);
  const [circleSubTab, setCircleSubTab] = useState('missioni');

  const [plusStep, setPlusStep] = useState('menu');
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleFormatId, setNewCircleFormatId] = useState(null);
  const [draftCircle, setDraftCircle] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinPreview, setJoinPreview] = useState(null);

  const [user, setUser] = useState({
    name: 'Tu',
    nickname: 'tu_92',
    email: 'tu@example.com',
    emailVerified: true,
    phone: '+39 333 123 4567',
    phoneVerified: true,
    avatarColor: '#2F6FED',
  });
  const [nicknameDraft, setNicknameDraft] = useState('tu_92');
  const [pwFields, setPwFields] = useState({ current: '', next: '', confirm: '' });

  const [toast, setToast] = useState(null);
  const [consentModal, setConsentModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [reportMission, setReportMission] = useState(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [proposeText, setProposeText] = useState('');
  const [proposePoints, setProposePoints] = useState(null);

  const [cooldowns, setCooldowns] = useState({});
  const [, forceTick] = useState(0);
  const idCounter = useRef(1000);
  const newId = (prefix) => `${prefix}-${(idCounter.current += 1)}`;

  const openCircle = circles.find((c) => c.id === openCircleId) || null;

  /* --- ripristina la sessione Supabase esistente (utente giÃ  loggato) --- */
  useEffect(() => {
    let active = true;

    async function loadProfileInto(session) {
      if (!session?.user) return;
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (!active) return;
      if (error) {
        console.warn('Impossibile leggere il profilo:', error.message);
        return;
      }
      setUser((u) => ({
        ...u,
        name: profile.display_name,
        nickname: profile.nickname || u.nickname,
        phone: profile.phone,
        phoneVerified: false,
        avatarColor: profile.avatar_color,
      }));
      setIsAuthenticated(true);
    }

    supabase.auth.getSession().then(({ data }) => {
      loadProfileInto(data.session).finally(() => {
        if (active) setSessionChecked(true);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  /* --- toast auto-dismiss --- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  /* --- cooldown ticking --- */
  useEffect(() => {
    const hasActive = Object.values(cooldowns).some((end) => end > Date.now());
    if (!hasActive) return;
    const iv = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [cooldowns]);

  /* --- simula amici che entrano nella cerchia durante l'invito --- */
  useEffect(() => {
    if (plusStep !== 'invite' || !draftCircle) return;
    const t1 = setTimeout(() => {
      setDraftCircle((dc) => (dc ? { ...dc, members: [...dc.members, { id: newId('m'), name: 'Alessandro', color: '#8B5CF6' }] } : dc));
    }, 2200);
    const t2 = setTimeout(() => {
      setDraftCircle((dc) => (dc ? { ...dc, members: [...dc.members, { id: newId('m'), name: 'Chiara', color: '#EC4899' }] } : dc));
    }, 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plusStep, draftCircle?.id]);

  function showToast(msg) {
    setToast({ msg, id: Date.now() });
  }

  function updateCircle(id, updater) {
    setCircles((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  function goTab(tab) {
    setActiveTab(tab);
    setOpenCircleId(null);
  }

  function openCircleDetail(circle) {
    setOpenCircleId(circle.id);
    setCircleSubTab(circle.status === 'closed' ? 'classifica' : 'missioni');
  }

  /* ---------------------- creazione / ingresso cerchia ---------------------- */

  function resetPlusFlow() {
    setPlusStep('menu');
    setNewCircleName('');
    setNewCircleFormatId(null);
    setDraftCircle(null);
    setJoinCodeInput('');
    setJoinError('');
    setJoinPreview(null);
  }

  // "Indietro" torna di UN passo, senza perdere quello che hai giÃ  inserito
  // (prima il tasto Indietro resettava sempre tutto il flusso: era il bug piÃ¹
  // fastidioso da testare â€” scrivevi il nome, sbagliavi format, e perdevi il nome).
  function goBackStep() {
    if (plusStep === 'format') {
      setPlusStep('name');
    } else if (plusStep === 'invite') {
      setDraftCircle(null);
      setPlusStep('format');
    } else {
      resetPlusFlow();
    }
  }

  function handleConfirmFormat() {
    if (!newCircleFormatId) return;
    setDraftCircle({
      id: newId('c'),
      name: newCircleName.trim(),
      formatId: newCircleFormatId,
      code: generateCode(),
      ownerId: ME.id,
      members: [ME],
      customMissions: [],
      scoreEntries: [],
    });
    setPlusStep('invite');
  }

  function handleStartSession() {
    if (!draftCircle || draftCircle.members.length < 3) return;
    const finalCircle = { ...draftCircle, status: 'active' };
    setCircles((prev) => [...prev, finalCircle]);
    resetPlusFlow();
    setActiveTab('gruppi');
    openCircleDetail(finalCircle);
    showToast('Cerchia creata! Si parte ðŸŽ‰');
  }

  function handleVerifyJoinCode() {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    if (code === JOIN_CIRCLE_TEMPLATE.code && !circles.some((c) => c.code === code)) {
      setJoinPreview(JOIN_CIRCLE_TEMPLATE);
      setJoinError('');
    } else if (circles.some((c) => c.code === code)) {
      setJoinError('Fai giÃ  parte di questa Cerchia.');
      setJoinPreview(null);
    } else {
      setJoinError('Codice non valido o scaduto.');
      setJoinPreview(null);
    }
  }

  function handleConfirmJoin() {
    if (!joinPreview) return;
    const joined = { ...joinPreview, members: [...joinPreview.members, ME] };
    setCircles((prev) => [...prev, joined]);
    resetPlusFlow();
    setActiveTab('gruppi');
    showToast(`Ti sei unito a ${joined.name}!`);
  }

  /* ---------------------------- missioni ---------------------------- */

  function cooldownKey(circleId, missionId) {
    return `${circleId}:${missionId}`;
  }
  function isOnCooldown(circleId, missionId) {
    const end = cooldowns[cooldownKey(circleId, missionId)];
    return end && end > Date.now();
  }
  function cooldownRemaining(circleId, missionId) {
    const end = cooldowns[cooldownKey(circleId, missionId)] || 0;
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
  }
  function alreadyDoneByMe(circle, mission) {
    return circle.scoreEntries.some((e) => e.missionId === mission.id && e.userId === ME.id);
  }
  function eligibleMissions(circle) {
    const all = allMissionsFor(circle).filter((m) => m.status !== 'in_revisione');
    return all.filter((m) => {
      if (m.repeatable) return !isOnCooldown(circle.id, m.id);
      return !alreadyDoneByMe(circle, m);
    });
  }

  function requestComplete(circle, mission) {
    if (mission.requiresConsent) {
      const others = circle.members.filter((m) => m.id !== ME.id);
      setConsentModal({
        circleId: circle.id,
        mission,
        silent: false,
        responses: Object.fromEntries(others.map((m) => [m.id, 'pending'])),
        others,
      });
    } else {
      setConsentModal({
        circleId: circle.id,
        mission,
        silent: false,
        responses: {},
        others: [],
      });
    }
  }

  function finalizeCompletion(circleId, mission, silent, rejected) {
    if (rejected) {
      showToast('Consenso non raggiunto: nessun punto assegnato.');
      setConsentModal(null);
      return;
    }
    updateCircle(circleId, (c) => ({
      ...c,
      scoreEntries: [
        ...c.scoreEntries,
        { id: newId('e'), missionId: mission.id, userId: ME.id, points: mission.points, hidden: silent, reactions: {}, ts: Date.now() },
      ],
    }));
    if (mission.repeatable) {
      setCooldowns((prev) => ({ ...prev, [cooldownKey(circleId, mission.id)]: Date.now() + (mission.cooldownSec || 20) * 1000 }));
    }
    setConsentModal(null);
    showToast(`Completata! ${signed(mission.points)} punti`);
  }

  function handlePescaMissione(circle) {
    const eligible = eligibleMissions(circle);
    if (eligible.length === 0) {
      showToast('Nessuna missione disponibile al momento.');
      return;
    }
    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    showToast(`Pescata: ${picked.title}`);
    requestComplete(circle, picked);
  }

  function handleReact(circle, entryId, emoji) {
    updateCircle(circle.id, (c) => ({
      ...c,
      scoreEntries: c.scoreEntries.map((e) =>
        e.id === entryId ? { ...e, reactions: { ...e.reactions, [emoji]: (e.reactions[emoji] || 0) + 1 } } : e
      ),
    }));
  }

  function handleProposeMission(circle) {
    if (!proposeText.trim() || proposePoints === null) return;
    const missionId = newId('custom');
    const points = proposePoints;
    updateCircle(circle.id, (c) => ({
      ...c,
      customMissions: [
        ...(c.customMissions || []),
        { id: missionId, title: proposeText.trim(), points, repeatable: false, requiresConsent: false, custom: true, status: 'in_revisione' },
      ],
    }));
    setProposeText('');
    setProposePoints(null);
    setProposeOpen(false);
    showToast(`Missione proposta (${signed(points)} punti): in revisione prima di essere attivabile.`);
    // Il timer Ã¨ legato all'id della missione, non alla schermata aperta:
    // viene approvata anche se nel frattempo navighi altrove.
    setTimeout(() => {
      updateCircle(circle.id, (c) => ({
        ...c,
        customMissions: (c.customMissions || []).map((m) =>
          m.id === missionId ? { ...m, status: 'approvata' } : m
        ),
      }));
    }, 4000);
  }

  function handleDeleteMission(circle, mission) {
    setConfirmModal({
      title: 'Rimuovere questa missione?',
      body: `"${mission.title}" non sarÃ  piÃ¹ disponibile per nessun membro della Cerchia.`,
      confirmLabel: 'Rimuovi missione',
      danger: true,
      onConfirm: () => {
        updateCircle(circle.id, (c) => {
          if (mission.custom) {
            return {
              ...c,
              customMissions: (c.customMissions || []).map((m) =>
                m.id === mission.id ? { ...m, removed: true } : m
              ),
            };
          }
          return { ...c, disabledMissionIds: [...(c.disabledMissionIds || []), mission.id] };
        });
        setConfirmModal(null);
        showToast('Missione rimossa dalla Cerchia.');
      },
    });
  }

  function handleLeaveCircle(circle) {
    const ownerNote = circle.ownerId === ME.id
      ? ' Sei il creatore: in una versione reale andrebbe prima nominato un nuovo owner.'
      : '';
    setConfirmModal({
      title: 'Uscire dalla Cerchia?',
      body: `Non farai piÃ¹ parte di "${circle.name}". Potrai rientrare solo con un nuovo invito.${ownerNote}`,
      confirmLabel: 'Esci dalla Cerchia',
      danger: true,
      onConfirm: () => {
        setCircles((prev) => prev.filter((c) => c.id !== circle.id));
        setOpenCircleId((cur) => (cur === circle.id ? null : cur));
        setConfirmModal(null);
        showToast(`Hai lasciato ${circle.name}.`);
      },
    });
  }

  function handleReportMission() {
    setReportMission(null);
    showToast('Segnalazione inviata: verrÃ  revisionata dal team.');
  }

  function handleCloseSession(circle) {
    setConfirmModal({
      title: 'Chiudere la sessione?',
      body: 'VerrÃ  generato il recap finale. Non sarÃ  piÃ¹ possibile completare nuove missioni.',
      confirmLabel: 'Chiudi e genera recap',
      onConfirm: () => {
        updateCircle(circle.id, (c) => ({ ...c, status: 'closed' }));
        setConfirmModal(null);
        showToast('Sessione chiusa. Ecco il recap!');
      },
    });
  }

  function handleRemoveMember(circle, memberId) {
    setConfirmModal({
      title: 'Rimuovere il membro?',
      body: 'VerrÃ  escluso dalla Cerchia. I punti giÃ  assegnati restano nello storico.',
      confirmLabel: 'Rimuovi',
      onConfirm: () => {
        updateCircle(circle.id, (c) => ({ ...c, members: c.members.filter((m) => m.id !== memberId) }));
        setConfirmModal(null);
        showToast('Membro rimosso.');
      },
    });
  }

  /* ---------------------------- accesso / iscrizione ---------------------------- */

  function switchAuthMode(mode) {
    setAuthMode(mode);
    setAuthError('');
  }

  function isValidPhone(p) {
    const digits = p.replace(/[^0-9]/g, '');
    return digits.length >= 8;
  }

  async function handleAuthSubmit() {
    const rawPhone = authPhone.trim();
    if (!isValidPhone(rawPhone)) {
      setAuthError('Inserisci un numero di telefono valido.');
      return;
    }
    if (authPassword.length < 6) {
      setAuthError('La password deve avere almeno 6 caratteri.');
      return;
    }
    if (authMode === 'signup' && authPassword !== authConfirmPassword) {
      setAuthError('Le due password non coincidono.');
      return;
    }

    const phone = normalizePhone(rawPhone);
    const technicalEmail = phoneToTechnicalEmail(phone);
    setAuthError('');
    setAuthBusy(true);

    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: technicalEmail,
          password: authPassword,
          options: {
            data: {
              phone,
              display_name: 'Tu',
              avatar_color: PALETTE[0],
            },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes('already registered')) {
            setAuthError('Questo numero di telefono ha giÃ  un account: prova ad accedere.');
          } else {
            setAuthError(`Non Ã¨ stato possibile creare l'account: ${error.message}`);
          }
          return;
        }
        if (data.session) {
          setUser((u) => ({ ...u, phone, phoneVerified: false }));
          setIsAuthenticated(true);
          showToast('Account creato! Benvenuto su Cerchia ðŸŽ‰');
        } else {
          // Progetto configurato con conferma email obbligatoria: va disattivata
          // (vedi README) perchÃ© qui usiamo una email tecnica, non reale.
          setAuthError('Account creato ma serve disattivare la conferma email nelle impostazioni Supabase (vedi README).');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: technicalEmail,
          password: authPassword,
        });
        if (error) {
          setAuthError('Numero di telefono o password non corretti.');
          return;
        }
        setUser((u) => ({ ...u, phone }));
        setIsAuthenticated(true);
        showToast('Bentornato su Cerchia ðŸ‘‹');
      }
      setAuthPassword('');
      setAuthConfirmPassword('');
    } catch (err) {
      setAuthError('Errore di connessione: controlla la tua rete e riprova.');
    } finally {
      setAuthBusy(false);
    }
  }

  /* ---------------------------- account ---------------------------- */

  const nicknameTaken = RESERVED_NICKNAMES.includes(nicknameDraft.trim().toLowerCase());

  function handleSaveAccount() {
    if (nicknameTaken) {
      showToast('Correggi il nickname prima di salvare: giÃ  in uso.');
      return;
    }
    setUser((u) => ({ ...u, nickname: nicknameDraft.trim() }));
    showToast('Modifiche salvate âœ…');
  }

  function handlePasswordRecovery() {
    showToast('Codice OTP inviato via SMS al numero verificato ðŸ“±');
  }

  function handleChangePassword() {
    if (!pwFields.current || !pwFields.next) {
      showToast('Inserisci la password attuale e quella nuova.');
      return;
    }
    if (pwFields.next !== pwFields.confirm) {
      showToast('La conferma non coincide con la nuova password.');
      return;
    }
    setPwFields({ current: '', next: '', confirm: '' });
    showToast('Password aggiornata âœ…');
  }

  function handleDeleteAccount() {
    setConfirmModal({
      title: 'Eliminare l\u2019account?',
      body: 'Questa azione Ã¨ definitiva e rimuoverÃ  i tuoi dati da tutte le Cerchie.',
      confirmLabel: 'Elimina account',
      danger: true,
      onConfirm: () => {
        setConfirmModal(null);
        showToast('Account eliminato (demo) â€” nessuna modifica reale.');
      },
    });
  }

  function handleLogout() {
    setConfirmModal({
      title: 'Uscire dall\u2019account?',
      body: 'Dovrai effettuare di nuovo l\u2019accesso per continuare a giocare.',
      confirmLabel: 'Esci',
      onConfirm: async () => {
        await supabase.auth.signOut();
        setConfirmModal(null);
        setActiveTab('gruppi');
        setOpenCircleId(null);
        setAuthMode('login');
        setAuthPhone('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setAuthError('');
        setIsAuthenticated(false);
        showToast('Hai effettuato il logout.');
      },
    });
  }

  /* ---------------------------------------------------------------------- */
  /* RENDER                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="page-bg">
      <style>{CSS}</style>
      <div className="phone-frame">
        {!sessionChecked ? (
          <div className="app-shell">
            <div className="screen auth-screen">
              <p className="screen-sub" style={{ textAlign: 'center' }}>Verifica sessioneâ€¦</p>
            </div>
          </div>
        ) : !isAuthenticated ? (
          <div className="app-shell">
            <AuthScreen
              mode={authMode}
              setMode={switchAuthMode}
              phone={authPhone}
              setPhone={setAuthPhone}
              password={authPassword}
              setPassword={setAuthPassword}
              confirmPassword={authConfirmPassword}
              setConfirmPassword={setAuthConfirmPassword}
              showPassword={showAuthPassword}
              setShowPassword={setShowAuthPassword}
              showConfirmPassword={showAuthConfirmPassword}
              setShowConfirmPassword={setShowAuthConfirmPassword}
              error={authError}
              busy={authBusy}
              onSubmit={handleAuthSubmit}
            />
          </div>
        ) : (
          <>
            <div className="app-shell">
              {activeTab === 'gruppi' && !openCircle && (
                <GruppiScreen circles={circles} onOpen={openCircleDetail} onLeave={handleLeaveCircle} />
              )}
              {activeTab === 'plus' && !openCircle && (
                <PlusScreen
                  step={plusStep}
                  setStep={setPlusStep}
                  name={newCircleName}
                  setName={setNewCircleName}
                  formatId={newCircleFormatId}
                  setFormatId={setNewCircleFormatId}
                  onConfirmFormat={handleConfirmFormat}
                  draftCircle={draftCircle}
                  onStartSession={handleStartSession}
                  joinCodeInput={joinCodeInput}
                  setJoinCodeInput={setJoinCodeInput}
                  joinError={joinError}
                  joinPreview={joinPreview}
                  onVerifyCode={handleVerifyJoinCode}
                  onConfirmJoin={handleConfirmJoin}
                  onBackStep={goBackStep}
                />
              )}
              {activeTab === 'account' && !openCircle && (
                <AccountScreen
                  user={user}
                  setUser={setUser}
                  nicknameDraft={nicknameDraft}
                  setNicknameDraft={setNicknameDraft}
                  nicknameTaken={nicknameTaken}
                  pwFields={pwFields}
                  setPwFields={setPwFields}
                  onSave={handleSaveAccount}
                  onRecovery={handlePasswordRecovery}
                  onChangePassword={handleChangePassword}
                  onDelete={handleDeleteAccount}
                  onLogout={handleLogout}
                />
              )}

              {openCircle && (
                <CircleDetail
                  circle={openCircle}
                  subTab={circleSubTab}
                  setSubTab={setCircleSubTab}
                  onBack={() => setOpenCircleId(null)}
                  onComplete={requestComplete}
                  onPesca={handlePescaMissione}
                  onReact={handleReact}
                  isOnCooldown={isOnCooldown}
                  cooldownRemaining={cooldownRemaining}
                  alreadyDoneByMe={alreadyDoneByMe}
                  onCloseSession={handleCloseSession}
                  onRemoveMember={handleRemoveMember}
                  onDeleteMission={handleDeleteMission}
                  onLeave={handleLeaveCircle}
                  proposeOpen={proposeOpen}
                  setProposeOpen={setProposeOpen}
                  proposeText={proposeText}
                  setProposeText={setProposeText}
                  proposePoints={proposePoints}
                  setProposePoints={setProposePoints}
                  onProposeMission={handleProposeMission}
                  onReportMission={(m) => setReportMission(m)}
                  showToast={showToast}
                />
              )}
            </div>

            <BottomNav active={activeTab} onChange={goTab} />
          </>
        )}

        {toast && <div className="toast">{toast.msg}</div>}

        {consentModal && (
          <ConsentModal
            data={consentModal}
            setData={setConsentModal}
            onConfirm={(silent) => {
              const anyRejected = Object.values(consentModal.responses).includes('rejected');
              finalizeCompletion(consentModal.circleId, consentModal.mission, silent, anyRejected);
            }}
            onCancel={() => setConsentModal(null)}
          />
        )}

        {confirmModal && (
          <ConfirmDialog data={confirmModal} onCancel={() => setConfirmModal(null)} />
        )}

        {reportMission && (
          <ReportDialog mission={reportMission} onCancel={() => setReportMission(null)} onConfirm={handleReportMission} />
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SCHERMATA: ACCESSO / ISCRIZIONE                                         */
/* ---------------------------------------------------------------------- */

function AuthScreen(props) {
  const {
    mode, setMode, phone, setPhone, password, setPassword,
    confirmPassword, setConfirmPassword, showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword, error, busy, onSubmit,
  } = props;

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !busy) onSubmit();
  }

  return (
    <div className="screen auth-screen">
      <div className="brand-row auth-brand-row">
        <svg width="34" height="34" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="12" stroke="#2F6FED" strokeWidth="3" />
          <circle cx="15" cy="15" r="4.5" fill="#FF6B4A" />
        </svg>
        <div>
          <div className="brand-name">Cerchia</div>
          <div className="brand-tagline">Il gioco del gruppo</div>
        </div>
      </div>

      <h1 className="screen-title">{mode === 'signup' ? 'Crea il tuo account' : 'Bentornato'}</h1>
      <p className="screen-sub">
        {mode === 'signup'
          ? 'Iscriviti con il numero di telefono per iniziare a giocare con i tuoi amici.'
          : 'Accedi con numero di telefono e password.'}
      </p>

      <div className="segmented">
        <button disabled={busy} className={mode === 'login' ? 'segmented-item active' : 'segmented-item'} onClick={() => setMode('login')}>
          Accedi
        </button>
        <button disabled={busy} className={mode === 'signup' ? 'segmented-item active' : 'segmented-item'} onClick={() => setMode('signup')}>
          Registrati
        </button>
      </div>

      <div className="field-group">
        <label className="field-label"><Phone size={13} /> Numero di telefono</label>
        <input
          className="text-input"
          type="tel"
          placeholder="+39 333 123 4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="tel"
          disabled={busy}
        />
      </div>

      <div className="field-group">
        <label className="field-label"><Lock size={13} /> Password</label>
        <div className="password-field">
          <input
            className="text-input"
            type={showPassword ? 'text' : 'password'}
            placeholder="Almeno 6 caratteri"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            disabled={busy}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((s) => !s)}
            title={showPassword ? 'Nascondi password' : 'Mostra password'}
            disabled={busy}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {mode === 'signup' && (
        <div className="field-group">
          <label className="field-label"><Lock size={13} /> Conferma password</label>
          <div className="password-field">
            <input
              className="text-input"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Ripeti la password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="new-password"
              disabled={busy}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((s) => !s)}
              title={showConfirmPassword ? 'Nascondi password' : 'Mostra password'}
              disabled={busy}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {error && <p className="field-error">{error}</p>}

      <button className="btn btn-primary btn-block" onClick={onSubmit} disabled={busy}>
        {busy ? 'Attendereâ€¦' : mode === 'signup' ? 'Crea account' : 'Accedi'}
      </button>

      <p className="auth-switch-hint">
        {mode === 'signup' ? 'Hai giÃ  un account? ' : 'Non hai ancora un account? '}
        <button
          type="button"
          className="link-btn auth-inline-link"
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          disabled={busy}
        >
          {mode === 'signup' ? 'Accedi' : 'Registrati'}
        </button>
      </p>

      <p className="policy-note">
        Prototipo dimostrativo: nessun account reale viene creato e i dati restano solo su questo dispositivo.
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SCHERMATA: GRUPPI                                                       */
/* ---------------------------------------------------------------------- */

function GruppiScreen({ circles, onOpen, onLeave }) {
  return (
    <div className="screen">
      <div className="brand-row">
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="12" stroke="#2F6FED" strokeWidth="3" />
          <circle cx="15" cy="15" r="4.5" fill="#FF6B4A" />
        </svg>
        <div>
          <div className="brand-name">Cerchia</div>
          <div className="brand-tagline">Il gioco del gruppo</div>
        </div>
      </div>

      {circles.length === 0 ? (
        <div className="empty-state">
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            <circle cx="44" cy="44" r="38" stroke="#C9C4B6" strokeWidth="3" strokeDasharray="8 8" />
          </svg>
          <p className="empty-title">Non fai ancora parte di nessuna Cerchia.</p>
          <p className="empty-sub">Creane una o entra con un codice dal tasto +.</p>
        </div>
      ) : (
        <div className="circle-list">
          {circles.map((c) => {
            const fmt = formatFor(c.formatId);
            const scores = scoresFor(c);
            const myRank = scores.findIndex((m) => m.id === ME.id) + 1;
            return (
              <div
                key={c.id}
                className="circle-card"
                role="button"
                tabIndex={0}
                onClick={() => onOpen(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(c);
                  }
                }}
              >
                <div className="circle-card-emoji">{fmt?.emoji}</div>
                <div className="circle-card-info">
                  <div className="circle-card-name">{c.name}</div>
                  <div className="circle-card-meta">
                    {fmt?.name} Â· {c.members.length} membri
                  </div>
                </div>
                <div className="circle-card-right">
                  {c.status === 'closed' ? (
                    <Chip tone="muted">Chiusa</Chip>
                  ) : (
                    <Chip tone="mint">Attiva</Chip>
                  )}
                  {myRank > 0 && <div className="circle-card-rank">#{myRank}</div>}
                  <button
                    className="icon-btn"
                    title="Esci dalla Cerchia"
                    onClick={(e) => { e.stopPropagation(); onLeave(c); }}
                  >
                    <LogOut size={15} />
                  </button>
                  <ChevronRight size={18} color="#B7B3A6" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SCHERMATA: + (CREA / TROVA)                                             */
/* ---------------------------------------------------------------------- */

function PlusScreen(props) {
  const {
    step, setStep, name, setName, formatId, setFormatId, onConfirmFormat,
    draftCircle, onStartSession, joinCodeInput, setJoinCodeInput, joinError,
    joinPreview, onVerifyCode, onConfirmJoin, onBackStep,
  } = props;

  return (
    <div className="screen">
      {step !== 'menu' && (
        <button className="back-row" onClick={onBackStep}>
          <ArrowLeft size={18} /> <span>Indietro</span>
        </button>
      )}

      {step === 'menu' && (
        <>
          <h1 className="screen-title">Nuova avventura o ti unisci a una giÃ  iniziata?</h1>
          <button className="big-choice-card" onClick={() => setStep('name')}>
            <div className="big-choice-emoji">âœ¨</div>
            <div>
              <div className="big-choice-title">Crea una nuova Cerchia</div>
              <div className="big-choice-sub">Scegli nome, format e invita gli amici</div>
            </div>
          </button>
          <button className="big-choice-card" onClick={() => setStep('join')}>
            <div className="big-choice-emoji">ðŸ”—</div>
            <div>
              <div className="big-choice-title">Entra con un codice o link</div>
              <div className="big-choice-sub">Qualcuno ti ha giÃ  invitato</div>
            </div>
          </button>
        </>
      )}

      {step === 'name' && (
        <>
          <h1 className="screen-title">Come si chiama la vostra Cerchia?</h1>
          <input
            className="text-input"
            placeholder="Es. Weekend a Riccione"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button className="btn btn-primary btn-block" disabled={!name.trim()} onClick={() => setStep('format')}>
            Continua
          </button>
        </>
      )}

      {step === 'format' && (
        <>
          <h1 className="screen-title">Ogni format ha il suo stile</h1>
          <p className="screen-sub">Puoi sempre disattivare le missioni che non vi convincono.</p>
          <div className="format-grid">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                className={`format-card ${formatId === f.id ? 'format-card-active' : ''}`}
                onClick={() => setFormatId(f.id)}
              >
                <div className="format-emoji">{f.emoji}</div>
                <div className="format-name">{f.name}</div>
                <div className="format-tagline">{f.tagline}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-block" disabled={!formatId} onClick={onConfirmFormat}>
            Conferma format e continua
          </button>
        </>
      )}

      {step === 'invite' && draftCircle && (
        <>
          <h1 className="screen-title">Manda il link al gruppo</h1>
          <p className="screen-sub">Si parte quando siete almeno in 3.</p>
          <div className="invite-code-box">
            <div className="invite-code">{draftCircle.code}</div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                try { navigator.clipboard.writeText(draftCircle.code); } catch (e) { /* noop */ }
              }}
            >
              <Copy size={16} /> Copia codice
            </button>
          </div>
          <div className="member-join-list">
            {draftCircle.members.map((m) => (
              <div key={m.id} className="member-join-row">
                <AvatarCircle name={m.name} color={m.color} size={34} />
                <span>{m.name}{m.id === ME.id ? ' (tu)' : ''}</span>
                <Check size={16} color="#1FAE7A" style={{ marginLeft: 'auto' }} />
              </div>
            ))}
            {draftCircle.members.length < 3 && (
              <div className="member-join-row member-join-waiting">
                <div className="avatar-circle avatar-placeholder">â€¦</div>
                <span>In attesa di altri amici</span>
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-block" disabled={draftCircle.members.length < 3} onClick={onStartSession}>
            {draftCircle.members.length < 3 ? `Avvia sessione (servono almeno 3 membri)` : 'Avvia sessione'}
          </button>
        </>
      )}

      {step === 'join' && (
        <>
          <h1 className="screen-title">Inserisci il codice invito</h1>
          <input
            className="text-input"
            placeholder="Es. FEST24"
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            autoFocus
          />
          {joinError && <p className="field-error">{joinError}</p>}
          {!joinPreview && (
            <button className="btn btn-primary btn-block" disabled={!joinCodeInput.trim()} onClick={onVerifyCode}>
              Verifica codice
            </button>
          )}
          {joinPreview && (
            <div className="join-preview-card">
              <div className="join-preview-title">{joinPreview.name}</div>
              <div className="join-preview-sub">
                {formatFor(joinPreview.formatId)?.emoji} {formatFor(joinPreview.formatId)?.name} Â· {joinPreview.members.length} membri
              </div>
              <button className="btn btn-primary btn-block" onClick={onConfirmJoin}>
                Unisciti alla Cerchia
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SCHERMATA: ACCOUNT                                                      */
/* ---------------------------------------------------------------------- */

function AccountScreen({
  user, setUser, nicknameDraft, setNicknameDraft, nicknameTaken,
  pwFields, setPwFields, onSave, onRecovery, onChangePassword, onDelete, onLogout,
}) {
  return (
    <div className="screen">
      <h1 className="screen-title">Account</h1>

      <div className="account-avatar-row">
        <AvatarCircle name={user.name} color={user.avatarColor} size={72} />
        <div className="avatar-palette">
          {PALETTE.map((c) => (
            <button
              key={c}
              className="avatar-swatch"
              style={{ background: c, outline: user.avatarColor === c ? '2px solid #14171F' : 'none' }}
              onClick={() => setUser((u) => ({ ...u, avatarColor: c }))}
            />
          ))}
        </div>
      </div>
      <p className="micro-hint"><Camera size={13} /> Scegli un colore per il tuo avatar</p>

      <div className="field-group">
        <label className="field-label">Nome</label>
        <input className="text-input" value={user.name} onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))} />
      </div>

      <div className="field-group">
        <label className="field-label">Nickname (univoco in tutta l'app)</label>
        <input className="text-input" value={nicknameDraft} onChange={(e) => setNicknameDraft(e.target.value)} />
        {nicknameTaken && <p className="field-error">Nickname giÃ  in uso da un altro utente.</p>}
      </div>

      <div className="field-group">
        <label className="field-label"><Mail size={13} /> Email {user.emailVerified && <Chip tone="mint">verificata</Chip>}</label>
        <input className="text-input" value={user.email} onChange={(e) => setUser((u) => ({ ...u, email: e.target.value }))} />
      </div>

      <div className="field-group">
        <label className="field-label"><Phone size={13} /> Numero di telefono {user.phoneVerified && <Chip tone="mint">verificato</Chip>}</label>
        <input className="text-input" value={user.phone} onChange={(e) => setUser((u) => ({ ...u, phone: e.target.value }))} />
      </div>

      <button className="btn btn-primary btn-block" onClick={onSave}>Salva modifiche</button>

      <div className="divider" />

      <h2 className="section-title"><Lock size={15} /> Password</h2>
      <input className="text-input" type="password" placeholder="Password attuale" value={pwFields.current}
        onChange={(e) => setPwFields((p) => ({ ...p, current: e.target.value }))} />
      <input className="text-input" type="password" placeholder="Nuova password" value={pwFields.next}
        onChange={(e) => setPwFields((p) => ({ ...p, next: e.target.value }))} />
      <input className="text-input" type="password" placeholder="Conferma nuova password" value={pwFields.confirm}
        onChange={(e) => setPwFields((p) => ({ ...p, confirm: e.target.value }))} />
      <button className="btn btn-ghost btn-block" onClick={onChangePassword}>Cambia password</button>
      <button className="link-btn" onClick={onRecovery}>Password dimenticata? Recupera via SMS</button>

      <div className="divider" />

      <button className="btn btn-ghost btn-block" onClick={onLogout}><LogOut size={16} /> Esci</button>
      <button className="link-btn danger" onClick={onDelete}><Trash2 size={14} /> Elimina account</button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DETTAGLIO CERCHIA                                                       */
/* ---------------------------------------------------------------------- */

function CircleDetail(props) {
  const {
    circle, subTab, setSubTab, onBack, onComplete, onPesca, onReact,
    isOnCooldown, cooldownRemaining, alreadyDoneByMe, onCloseSession,
    onRemoveMember, onDeleteMission, onLeave, proposeOpen, setProposeOpen,
    proposeText, setProposeText, proposePoints, setProposePoints,
    onProposeMission, onReportMission, showToast,
  } = props;

  const fmt = formatFor(circle.formatId);
  const missions = allMissionsFor(circle);
  const isOwner = circle.ownerId === ME.id;

  return (
    <div className="screen circle-detail">
      <button className="back-row" onClick={onBack}>
        <ArrowLeft size={18} /> <span>{circle.name}</span>
      </button>

      <div className="segmented">
        <button className={subTab === 'missioni' ? 'segmented-item active' : 'segmented-item'} onClick={() => setSubTab('missioni')}>Missioni</button>
        <button className={subTab === 'classifica' ? 'segmented-item active' : 'segmented-item'} onClick={() => setSubTab('classifica')}>Classifica</button>
        <button className={subTab === 'impostazioni' ? 'segmented-item active' : 'segmented-item'} onClick={() => setSubTab('impostazioni')}>Impostazioni</button>
      </div>

      {subTab === 'missioni' && (
        <div className="sub-screen">
          <button
            className="btn btn-secondary btn-block"
            onClick={() => onPesca(circle)}
            disabled={circle.status === 'closed' || missions.length === 0}
          >
            <Shuffle size={16} /> Pesca missione
          </button>

          {missions.length === 0 && (
            <div className="missions-empty">
              {circle.formatId === 'custom'
                ? 'Questo format non ha missioni preimpostate: aggiungine una qui sotto.'
                : 'Il creatore ha rimosso tutte le missioni preimpostate. Proponetene una nuova qui sotto.'}
            </div>
          )}

          {missions.map((m) => {
            const onCd = m.repeatable && isOnCooldown(circle.id, m.id);
            const done = !m.repeatable && alreadyDoneByMe(circle, m);
            const pending = m.status === 'in_revisione';
            const disabled = onCd || done || pending || circle.status === 'closed';
            return (
              <div key={m.id} className="mission-card">
                <div className="mission-head">
                  <div className="mission-title">{m.title}</div>
                  <div className="mission-points">{signed(m.points)}</div>
                </div>
                <div className="mission-tags">
                  {m.repeatable && <Chip tone="amber">Ripetibile</Chip>}
                  {m.requiresConsent && <Chip tone="muted">Richiede consenso</Chip>}
                  {m.points < 0 && <Chip tone="coral">PenalitÃ </Chip>}
                  {m.custom && <Chip tone={pending ? 'amber' : 'mint'}>{pending ? 'In revisione' : 'Custom Â· approvata'}</Chip>}
                </div>
                <div className="mission-actions">
                  <button className="btn btn-primary" disabled={disabled} onClick={() => onComplete(circle, m)}>
                    {onCd ? `Disponibile tra ${cooldownRemaining(circle.id, m.id)}s` : done ? 'GiÃ  completata da te' : pending ? 'In revisione' : 'Segna completata'}
                  </button>
                  <button className="icon-btn" title="Segnala missione" onClick={() => onReportMission(m)}>
                    <Flag size={16} />
                  </button>
                  {isOwner && (
                    <button className="icon-btn danger" title="Elimina missione" onClick={() => onDeleteMission(circle, m)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {proposeOpen ? (
            <div className="propose-box">
              <input className="text-input" placeholder="Descrivi la missione che proponi"
                value={proposeText} onChange={(e) => setProposeText(e.target.value)} autoFocus />
              <div className="points-picker">
                <span className="points-picker-label">Punteggio</span>
                <div className="points-picker-grid">
                  {POINT_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`points-chip ${p < 0 ? 'points-chip-neg' : 'points-chip-pos'} ${proposePoints === p ? 'points-chip-active' : ''}`}
                      onClick={() => setProposePoints(p)}
                    >
                      {signed(p)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="propose-actions">
                <button className="btn btn-ghost" onClick={() => { setProposeOpen(false); setProposePoints(null); }}>Annulla</button>
                <button className="btn btn-primary" disabled={!proposeText.trim() || proposePoints === null} onClick={() => onProposeMission(circle)}>
                  Proponi
                </button>
              </div>
            </div>
          ) : (
            <button className="link-btn" onClick={() => setProposeOpen(true)}>+ Proponi una missione custom</button>
          )}
        </div>
      )}

      {subTab === 'classifica' && (
        <ClassificaTab circle={circle} isOwner={isOwner} onCloseSession={onCloseSession} onReact={onReact} />
      )}

      {subTab === 'impostazioni' && (
        <ImpostazioniTab circle={circle} fmt={fmt} isOwner={isOwner} onRemoveMember={onRemoveMember} onLeave={onLeave} showToast={showToast} />
      )}
    </div>
  );
}

function ClassificaTab({ circle, isOwner, onCloseSession, onReact }) {
  const scores = scoresFor(circle);
  const recentEntries = [...circle.scoreEntries].sort((a, b) => b.ts - a.ts).slice(0, 6);
  const medals = ['ðŸ¥‡', 'ðŸ¥ˆ', 'ðŸ¥‰'];

  const missionCounts = {};
  circle.scoreEntries.forEach((e) => { missionCounts[e.missionId] = (missionCounts[e.missionId] || 0) + 1; });
  const topMissionId = Object.keys(missionCounts).sort((a, b) => missionCounts[b] - missionCounts[a])[0];
  const topMission = topMissionId ? findMissionById(circle, topMissionId) : null;
  const activityCounts = {};
  circle.scoreEntries.forEach((e) => { activityCounts[e.userId] = (activityCounts[e.userId] || 0) + 1; });
  const mostActiveId = Object.keys(activityCounts).sort((a, b) => activityCounts[b] - activityCounts[a])[0];
  const mostActive = circle.members.find((m) => m.id === mostActiveId);

  return (
    <div className="sub-screen">
      {circle.status === 'closed' && (
        <div className="recap-banner">
          <Sparkles size={16} /> Sessione chiusa â€” ecco il recap
        </div>
      )}

      <div className="leaderboard">
        {scores.map((m, i) => (
          <div key={m.id} className="leaderboard-row">
            <div className="leaderboard-rank">{medals[i] || `#${i + 1}`}</div>
            <AvatarCircle name={m.name} color={m.color} size={38} />
            <div className="leaderboard-name">{m.name}{m.id === ME.id ? ' (tu)' : ''}</div>
            <div className="leaderboard-points">{m.total}</div>
          </div>
        ))}
      </div>

      {circle.status === 'closed' && (
        <div className="recap-highlights">
          {topMission && <div className="recap-card">ðŸ† Missione piÃ¹ popolare<br /><b>{topMission.title}</b></div>}
          {mostActive && <div className="recap-card">âš¡ Membro piÃ¹ attivo<br /><b>{mostActive.name}</b></div>}
        </div>
      )}

      {isOwner && circle.status !== 'closed' && (
        <button className="btn btn-primary btn-block" onClick={() => onCloseSession(circle)}>
          <Trophy size={16} /> Chiudi sessione e genera recap
        </button>
      )}

      <h2 className="section-title">AttivitÃ  recente</h2>
      <div className="activity-feed">
        {recentEntries.map((e) => {
          const m = circle.members.find((mm) => mm.id === e.userId);
          const mission = findMissionById(circle, e.missionId);
          return (
            <div key={e.id} className="activity-row">
              <AvatarCircle name={e.hidden ? '?' : m?.name} color={e.hidden ? '#C9C4B6' : m?.color} size={30} />
              <div className="activity-text">
                {e.hidden ? (
                  <span>Qualcuno ha completato una missione <span className="muted-inline">(voce nascosta)</span></span>
                ) : (
                  <span><b>{m?.name}</b> ha completato "{mission?.title}"</span>
                )}
                <div className="activity-meta">{relativeTime(e.ts)} Â· {signed(e.points)} punti</div>
              </div>
              {!e.hidden && (
                <div className="reaction-row">
                  {REACTIONS.map((r) => (
                    <button key={r} className="reaction-btn" onClick={() => onReact(circle, e.id, r)}>
                      {r}{e.reactions[r] ? <span className="reaction-count">{e.reactions[r]}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImpostazioniTab({ circle, fmt, isOwner, onRemoveMember, onLeave, showToast }) {
  return (
    <div className="sub-screen">
      <div className="settings-card">
        <div className="settings-card-title">{fmt?.emoji} {fmt?.name}</div>
        <div className="settings-card-sub">{fmt?.tagline}</div>
      </div>

      <h2 className="section-title">Codice invito</h2>
      <div className="invite-code-box">
        <div className="invite-code">{circle.code}</div>
        <button className="btn btn-ghost" onClick={() => {
          try { navigator.clipboard.writeText(circle.code); } catch (e) { /* noop */ }
          showToast('Codice copiato');
        }}>
          <Copy size={16} /> Copia
        </button>
      </div>

      <h2 className="section-title"><Users size={15} /> Membri ({circle.members.length})</h2>
      <div className="member-join-list">
        {circle.members.map((m) => (
          <div key={m.id} className="member-join-row">
            <AvatarCircle name={m.name} color={m.color} size={34} />
            <span>{m.name}{m.id === circle.ownerId ? ' Â· owner' : ''}{m.id === ME.id ? ' (tu)' : ''}</span>
            {isOwner && m.id !== ME.id && (
              <button className="icon-btn danger" style={{ marginLeft: 'auto' }} onClick={() => onRemoveMember(circle, m.id)}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="policy-note">
        Cerchia Ã¨ un gioco sociale pensato per il divertimento responsabile. Non promuove nÃ© incentiva l'abuso di alcol.
        Tutte le attivitÃ  che coinvolgono altre persone richiedono consenso esplicito. Le missioni devono sempre essere sicure, legali e rispettose.
      </div>

      <button className="btn btn-danger btn-block" onClick={() => onLeave(circle)}>
        <LogOut size={16} /> Esci dalla Cerchia
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* BOTTOM NAV                                                              */
/* ---------------------------------------------------------------------- */

function BottomNav({ active, onChange }) {
  return (
    <div className="bottom-nav">
      <button className={`nav-item ${active === 'gruppi' ? 'nav-item-active' : ''}`} onClick={() => onChange('gruppi')}>
        <Users size={22} />
        <span>Gruppi</span>
      </button>
      <button className="nav-item-plus" onClick={() => onChange('plus')}>
        <Plus size={26} color="#fff" />
      </button>
      <button className={`nav-item ${active === 'account' ? 'nav-item-active' : ''}`} onClick={() => onChange('account')}>
        <User size={22} />
        <span>Account</span>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* MODALI                                                                  */
/* ---------------------------------------------------------------------- */

function ConsentModal({ data, setData, onConfirm, onCancel }) {
  const { mission, others, responses, silent } = data;
  const allResolved = others.length === 0 || others.every((o) => responses[o.id] !== 'pending');

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{mission.title}</div>
          <button className="icon-btn" onClick={onCancel}><X size={18} /></button>
        </div>
        <div className="modal-points">{signed(mission.points)} punti</div>

        {others.length > 0 && (
          <>
            <p className="modal-hint">Questa missione coinvolge altre persone: serve il loro consenso esplicito.</p>
            {others.map((o) => (
              <div key={o.id} className="consent-row">
                <AvatarCircle name={o.name} color={o.color} size={30} />
                <span className="consent-name">{o.name}</span>
                <div className="consent-buttons">
                  <button
                    className={`mini-btn ${responses[o.id] === 'accepted' ? 'mini-btn-mint' : ''}`}
                    onClick={() => setData((d) => ({ ...d, responses: { ...d.responses, [o.id]: 'accepted' } }))}
                  >
                    Simula: accetta
                  </button>
                  <button
                    className={`mini-btn ${responses[o.id] === 'rejected' ? 'mini-btn-coral' : ''}`}
                    onClick={() => setData((d) => ({ ...d, responses: { ...d.responses, [o.id]: 'rejected' } }))}
                  >
                    Simula: rifiuta
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        <label className="silent-toggle">
          <input type="checkbox" checked={silent} onChange={(e) => setData((d) => ({ ...d, silent: e.target.checked }))} />
          {silent ? <EyeOff size={15} /> : <Eye size={15} />} Non mostrare in classifica (modalitÃ  silenziosa)
        </label>

        <button className="btn btn-primary btn-block" disabled={!allResolved} onClick={() => onConfirm(silent)}>
          Conferma completamento
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ data, onCancel }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal modal-small">
        <div className="modal-title">{data.title}</div>
        <p className="modal-hint">{data.body}</p>
        <div className="modal-row-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Annulla</button>
          <button className={`btn ${data.danger ? 'btn-danger' : 'btn-primary'}`} onClick={data.onConfirm}>
            {data.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportDialog({ mission, onCancel, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal modal-small">
        <div className="modal-title">Segnala "{mission.title}"</div>
        <p className="modal-hint">La segnalazione verrÃ  revisionata dal team di moderazione.</p>
        <div className="modal-row-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Annulla</button>
          <button className="btn btn-danger" onClick={onConfirm}>Invia segnalazione</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CSS                                                                     */
/* ---------------------------------------------------------------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

:root {
  --bg: #F5F3EE;
  --surface: #FFFFFF;
  --surface-alt: #EFECE3;
  --ink: #14171F;
  --ink-soft: #5B6070;
  --primary: #2F6FED;
  --primary-dark: #1E4FC4;
  --primary-tint: #E7EEFD;
  --coral: #FF6B4A;
  --mint: #1FAE7A;
  --mint-tint: #E1F5EC;
  --amber: #F0A93A;
  --amber-tint: #FCEDD6;
  --border: #E4E1D8;
}

* { box-sizing: border-box; }

.page-bg {
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at 30% 0%, #E7EEFD 0%, var(--bg) 55%);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 12px;
  font-family: 'Inter', sans-serif;
  color: var(--ink);
}

.phone-frame {
  width: 100%;
  max-width: 412px;
  min-height: 860px;
  background: var(--bg);
  border-radius: 34px;
  box-shadow: 0 30px 60px -20px rgba(20,23,31,0.35), 0 0 0 10px #0e1015;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

@media (max-width: 460px) {
  .page-bg { padding: 0; }
  .phone-frame { border-radius: 0; box-shadow: none; min-height: 100vh; }
}

.app-shell {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 90px;
  position: relative;
}

.screen {
  padding: 18px 20px 24px;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

.brand-row { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.brand-name { font-family: 'Unbounded', sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -0.02em; }
.brand-tagline { font-size: 12px; color: var(--ink-soft); }

.screen-title { font-family: 'Unbounded', sans-serif; font-size: 19px; font-weight: 600; line-height: 1.3; margin: 4px 0 14px; }
.screen-sub { font-size: 13px; color: var(--ink-soft); margin-top: -8px; margin-bottom: 14px; }

.empty-state { text-align: center; padding: 60px 20px; color: var(--ink-soft); }
.empty-title { font-weight: 600; color: var(--ink); margin-top: 14px; }
.empty-sub { font-size: 13px; margin-top: 4px; }

.circle-list { display: flex; flex-direction: column; gap: 10px; }
.circle-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
  padding: 14px 14px; cursor: pointer; text-align: left; width: 100%;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.circle-card:hover { transform: translateY(-1px); box-shadow: 0 6px 16px -8px rgba(20,23,31,0.25); }
.circle-card:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.circle-card-emoji { font-size: 26px; }
.circle-card-info { flex: 1; min-width: 0; }
.circle-card-name { font-weight: 700; font-size: 15px; }
.circle-card-meta { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }
.circle-card-right { display: flex; align-items: center; gap: 8px; }
.circle-card-rank { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 13px; color: var(--primary); }

.avatar-circle {
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-family: 'Unbounded', sans-serif; flex-shrink: 0;
}
.avatar-placeholder { background: var(--surface-alt); color: var(--ink-soft); }

.chip { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 600; gap: 4px; }
.chip-mint { background: var(--mint-tint); color: var(--mint); }
.chip-amber { background: var(--amber-tint); color: #9C6B12; }
.chip-coral { background: #FFE7E0; color: var(--coral); }
.chip-muted { background: var(--surface-alt); color: var(--ink-soft); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px;
  padding: 12px 16px; border-radius: 14px; border: none; cursor: pointer;
  transition: opacity 0.15s ease, transform 0.1s ease;
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.98); }
.btn-block { width: 100%; margin-top: 6px; }
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--primary-dark); }
.btn-secondary { background: var(--primary-tint); color: var(--primary-dark); }
.btn-ghost { background: var(--surface-alt); color: var(--ink); }
.btn-danger { background: var(--coral); color: #fff; }

.text-input {
  width: 100%; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border);
  background: var(--surface); font-size: 14px; font-family: 'Inter', sans-serif; margin-bottom: 8px;
  color: var(--ink);
}
.text-input:focus { outline: 2px solid var(--primary); outline-offset: 1px; }

.field-error { color: var(--coral); font-size: 12px; margin: -4px 0 8px; }

.auth-screen { display: flex; flex-direction: column; justify-content: center; min-height: 100%; }
.auth-brand-row { justify-content: center; margin-bottom: 26px; }
.password-field { position: relative; }
.password-field .text-input { padding-right: 44px; }
.password-toggle {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--ink-soft);
  padding: 8px; display: flex; align-items: center; justify-content: center;
}
.auth-switch-hint { text-align: center; font-size: 13px; color: var(--ink-soft); margin: 14px 0 6px; }
.auth-inline-link { display: inline; padding: 0; font-size: 13px; }

.big-choice-card {
  display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
  background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
  padding: 16px; margin-bottom: 12px; cursor: pointer;
}
.big-choice-emoji { font-size: 28px; }
.big-choice-title { font-weight: 700; font-size: 15px; }
.big-choice-sub { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }

.format-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.format-card {
  text-align: left; background: var(--surface); border: 2px solid var(--border); border-radius: 16px;
  padding: 14px; cursor: pointer;
}
.format-card-active { border-color: var(--primary); background: var(--primary-tint); }
.format-emoji { font-size: 22px; }
.format-name { font-weight: 700; font-size: 14px; margin-top: 4px; }
.format-tagline { font-size: 12px; color: var(--ink-soft); margin-top: 2px; }

.back-row {
  display: flex; align-items: center; gap: 8px; background: none; border: none; cursor: pointer;
  font-weight: 600; font-size: 14px; color: var(--ink); padding: 0 0 14px; font-family: 'Inter', sans-serif;
}

.invite-code-box {
  display: flex; align-items: center; justify-content: space-between; background: var(--surface);
  border: 1px dashed var(--primary); border-radius: 16px; padding: 16px; margin-bottom: 14px;
}
.invite-code { font-family: 'IBM Plex Mono', monospace; font-size: 22px; font-weight: 700; letter-spacing: 0.08em; color: var(--primary-dark); }

.member-join-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.member-join-row { display: flex; align-items: center; gap: 10px; background: var(--surface); border-radius: 12px; padding: 8px 10px; font-size: 13px; font-weight: 500; }
.member-join-waiting { color: var(--ink-soft); font-style: italic; }

.join-preview-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-top: 6px; }
.join-preview-title { font-weight: 700; font-size: 16px; }
.join-preview-sub { font-size: 12px; color: var(--ink-soft); margin: 4px 0 12px; }

.account-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 4px; }
.avatar-palette { display: flex; gap: 6px; flex-wrap: wrap; }
.avatar-swatch { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #fff; cursor: pointer; box-shadow: 0 0 0 1px var(--border); }
.micro-hint { font-size: 11px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; margin: 6px 0 18px; }

.field-group { margin-bottom: 12px; }
.field-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-soft); margin-bottom: 5px; }

.divider { height: 1px; background: var(--border); margin: 20px 0; }
.section-title { display: flex; align-items: center; gap: 6px; font-family: 'Unbounded', sans-serif; font-size: 14px; font-weight: 600; margin: 18px 0 10px; }

.link-btn { background: none; border: none; color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer; padding: 8px 0; display: block; }
.link-btn.danger { color: var(--coral); }

.segmented { display: flex; background: var(--surface-alt); border-radius: 14px; padding: 4px; margin-bottom: 16px; gap: 4px; }
.segmented-item { flex: 1; background: none; border: none; padding: 9px 4px; border-radius: 10px; font-weight: 600; font-size: 12.5px; color: var(--ink-soft); cursor: pointer; }
.segmented-item.active { background: var(--surface); color: var(--primary-dark); box-shadow: 0 2px 6px -2px rgba(20,23,31,0.2); }

.sub-screen { display: flex; flex-direction: column; gap: 12px; }

.missions-empty { font-size: 12.5px; color: var(--ink-soft); background: var(--surface-alt); border-radius: 12px; padding: 12px 14px; line-height: 1.5; }
.mission-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px; }
.mission-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.mission-title { font-weight: 600; font-size: 13.5px; line-height: 1.4; }
.mission-points { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: var(--coral); font-size: 14px; flex-shrink: 0; }
.mission-tags { display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap; }
.mission-actions { display: flex; gap: 8px; align-items: center; }
.mission-actions .btn { flex: 1; }

.icon-btn { background: var(--surface-alt); border: none; border-radius: 10px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ink-soft); flex-shrink: 0; }
.icon-btn.danger { color: var(--coral); }

.propose-box { background: var(--surface); border: 1px dashed var(--border); border-radius: 14px; padding: 12px; }
.propose-actions { display: flex; gap: 8px; justify-content: flex-end; }

.points-picker { margin: 4px 0 10px; }
.points-picker-label { font-size: 11px; font-weight: 600; color: var(--ink-soft); display: block; margin-bottom: 6px; }
.points-picker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.points-chip {
  padding: 8px 4px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface);
  font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 12.5px; cursor: pointer; text-align: center; color: var(--ink-soft);
}
.points-chip-neg.points-chip-active { background: #FFE7E0; border-color: var(--coral); color: var(--coral); }
.points-chip-pos.points-chip-active { background: var(--mint-tint); border-color: var(--mint); color: var(--mint); }

.recap-banner { display: flex; align-items: center; gap: 8px; background: var(--primary-tint); color: var(--primary-dark); font-weight: 600; font-size: 13px; padding: 10px 14px; border-radius: 12px; }

.leaderboard { display: flex; flex-direction: column; gap: 8px; }
.leaderboard-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 10px 12px; }
.leaderboard-rank { width: 26px; text-align: center; font-weight: 700; font-size: 15px; }
.leaderboard-name { flex: 1; font-weight: 600; font-size: 13.5px; }
.leaderboard-points { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: var(--primary-dark); font-size: 15px; }

.recap-highlights { display: flex; flex-direction: column; gap: 8px; }
.recap-card { background: var(--amber-tint); border-radius: 12px; padding: 10px 12px; font-size: 12.5px; line-height: 1.5; }

.activity-feed { display: flex; flex-direction: column; gap: 10px; }
.activity-row { display: flex; align-items: flex-start; gap: 10px; }
.activity-text { flex: 1; font-size: 12.5px; line-height: 1.5; }
.activity-meta { font-size: 11px; color: var(--ink-soft); margin-top: 2px; }
.muted-inline { color: var(--ink-soft); font-style: italic; }
.reaction-row { display: flex; gap: 3px; }
.reaction-btn { background: var(--surface-alt); border: none; border-radius: 8px; padding: 3px 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 2px; }
.reaction-count { font-size: 10px; font-family: 'IBM Plex Mono', monospace; color: var(--ink-soft); }

.settings-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px; }
.settings-card-title { font-weight: 700; font-size: 15px; }
.settings-card-sub { font-size: 12px; color: var(--ink-soft); margin-top: 3px; }

.policy-note { font-size: 11px; color: var(--ink-soft); line-height: 1.6; background: var(--surface-alt); border-radius: 12px; padding: 12px; margin-top: 8px; }

.bottom-nav {
  position: absolute; bottom: 0; left: 0; right: 0; height: 84px;
  background: var(--surface); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-around; padding-bottom: 14px;
}
.nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; background: none; border: none; cursor: pointer; color: var(--primary); font-size: 11px; font-weight: 600; padding: 6px 16px; border-radius: 12px; opacity: 0.55; }
.nav-item-active { opacity: 1; background: var(--primary-tint); }
.nav-item-plus { width: 54px; height: 54px; border-radius: 50%; background: var(--primary); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 18px -6px rgba(47,111,237,0.6); transform: translateY(-14px); }

.toast {
  position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 12.5px; font-weight: 500;
  box-shadow: 0 10px 24px -8px rgba(0,0,0,0.4); white-space: nowrap; max-width: 90%; text-align: center; z-index: 50;
}

.modal-overlay { position: absolute; inset: 0; background: rgba(20,23,31,0.55); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.modal { background: var(--bg); width: 100%; border-radius: 24px 24px 0 0; padding: 20px; max-height: 80%; overflow-y: auto; }
.modal-small { border-radius: 20px; margin: auto; max-width: 320px; }
.modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.modal-title { font-weight: 700; font-size: 15px; line-height: 1.4; }
.modal-points { font-family: 'IBM Plex Mono', monospace; color: var(--coral); font-weight: 700; margin: 4px 0 12px; }
.modal-hint { font-size: 12.5px; color: var(--ink-soft); margin-bottom: 12px; line-height: 1.5; }
.modal-row-actions { display: flex; gap: 10px; margin-top: 16px; }
.modal-row-actions .btn { flex: 1; }

.consent-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.consent-name { font-weight: 600; font-size: 13px; flex: 1; }
.consent-buttons { display: flex; gap: 6px; }
.mini-btn { font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; }
.mini-btn-mint { background: var(--mint-tint); color: var(--mint); border-color: var(--mint); }
.mini-btn-coral { background: #FFE7E0; color: var(--coral); border-color: var(--coral); }

.silent-toggle { display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 500; margin: 14px 0; cursor: pointer; }
`;
