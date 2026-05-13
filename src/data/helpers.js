// AquaOps — Pure helper functions (no React dependencies)
import { THRESHOLDS, TASK_TYPES, PROF_CATEGORIES, SCORE_WEIGHTS } from './constants';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getAlert(val, key) {
  if (val == null) return null;
  if (val < THRESHOLDS[key].min) return "low";
  if (val > THRESHOLDS[key].max) return "high";
  return "ok";
}

function getLatestReading(readings, systemId) {
  return readings.filter(r => r.sistema === systemId).sort((a,b) => new Date(b.fecha) - new Date(a.fecha))[0] || null;
}

function calcGrowth(readings, systemId) {
  const sys = readings.filter(r => r.sistema === systemId && r.peso).sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
  if (sys.length < 2) return null;
  const first = sys[0].sembrado || sys[0].peso;
  const last = sys[sys.length-1].peso;
  return Math.round(((last - first) / first) * 100);
}

// ─── BONUS SCORING HELPERS ───────────────────────────────────────────────────
function calcTaskScore(taskLogs, initials) {
  // For each task type, sum objetivo and actual across all logs where this person participated
  let weightedSum = 0;
  let totalWeight = 0;
  TASK_TYPES.forEach(tt => {
    const relevant = taskLogs.filter(l =>
      l.taskId === tt.id &&
      (l.initials === initials || l.initials2 === initials) &&
      l.confirmed
    );
    if (relevant.length === 0) return;
    const obj = relevant.reduce((s,l) => s + (l.objetivo||0), 0);
    const act = relevant.reduce((s,l) => s + (l.actual||0), 0);
    if (obj === 0) return;
    const rate = Math.min(act / obj, 1.0);
    weightedSum += rate * tt.weight;
    totalWeight += tt.weight;
  });
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

function calcProfScore(profScores, initials, month) {
  const record = profScores.find(p => p.initials === initials && p.month === month);
  if (!record) return null;
  let total = 0;
  PROF_CATEGORIES.forEach(cat => {
    const raw = record[cat.id] || 0; // 1–5 scale
    total += (raw / 5) * cat.weight;
  });
  return total; // 0–1
}

function calcTotalScore(taskScore, profScore) {
  if (taskScore === null && profScore === null) return null;
  const t = taskScore ?? 0;
  const p = profScore ?? 0;
  return t * SCORE_WEIGHTS.tasks + p * SCORE_WEIGHTS.prof;
}

function calcBonusShare(crewScores, poolAmount) {
  // Formula: Employee Total × Score ÷ SUMPRODUCT(all Score) × Pool
  const validScores = crewScores.filter(c => c.totalScore !== null);
  const sumScores = validScores.reduce((s,c) => s + (c.totalScore||0), 0);
  if (sumScores === 0) return crewScores.map(c => ({ ...c, bonusShare: 0 }));
  return crewScores.map(c => ({
    ...c,
    bonusShare: c.totalScore !== null ? (c.totalScore / sumScores) * poolAmount : 0,
  }));
}

function calcHoras(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;
  const [h1,m1] = checkIn.split(":").map(Number);
  const [h2,m2] = checkOut.split(":").map(Number);
  const mins = (h2*60+m2) - (h1*60+m1);
  if (mins <= 0) return null;
  return (mins/60).toFixed(1);
}

export { getAlert, getLatestReading, calcGrowth, calcTaskScore, calcProfScore, calcTotalScore, calcBonusShare, calcHoras };
