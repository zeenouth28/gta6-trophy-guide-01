// Leonida Ledger — GTA VI trophy guide & tracker. Offline static app: all data is
// app/data/trophies.json and app/data/roadmap.json, progress lives in localStorage.
const KEY = 'leonida-ledger-v1';
const DEMO_EARNED = [2, 3, 5, 8, 10, 16, 20, 21, 33, 35, 46, 53, 55];
const params = new URLSearchParams(location.search);
const demo = params.get('demo') === '1';

const store = JSON.parse(localStorage.getItem(KEY) ?? '{}');
let earned = new Set(store.earned ?? (demo ? DEMO_EARNED : []));
let notes = store.notes ?? (demo ? { 28: 'Do the balcony meditation in Chapter 1!', 14: 'Checklist opens after the story.' } : {});
function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], notes }));
}

const [trophiesDoc, roadmapDoc] = await Promise.all([
  fetch('data/trophies.json').then(r => r.json()),
  fetch('data/roadmap.json').then(r => r.json()),
]);
const trophies = trophiesDoc.trophies;
const byId = Object.fromEntries(trophies.map(t => [t.id, t]));
const KIND_LABEL = { story: 'Story', activity: 'Activity', robbery: 'Robbery', collectible: 'Collectible', misc: 'Other' };

// ---------- tabs ----------
const tabButtons = [...document.querySelectorAll('#tabs button')];
function showTab(name) {
  tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + name));
  if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
}
tabButtons.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
const initialTab = (location.hash || '#tracker').slice(1);
if (['tracker', 'roadmap', 'missables', 'planner', 'sources'].includes(initialTab)) showTab(initialTab);

// ---------- progress ----------
function renderProgress() {
  document.getElementById('earned-count').textContent = `${earned.size} / ${trophies.length}`;
  document.getElementById('progress-fill').style.width = `${(earned.size / trophies.length) * 100}%`;
  const plat = earned.size === trophies.length;
  document.getElementById('platinum-note').textContent = plat
    ? 'Platinum earned — Vice Got a Price!'
    : 'Platinum: Vice Got a Price!';
}

// ---------- tracker ----------
const rowsEl = document.getElementById('rows');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilersEl = document.getElementById('spoilers');
const noteEl = document.getElementById('filter-note');

function spoilerHidden(t) {
  return spoilersEl.checked && t.hidden && !earned.has(t.id);
}

function renderTracker() {
  const q = searchEl.value.trim().toLowerCase();
  const kind = kindEl.value;
  const grade = gradeEl.value;
  const hideEarned = hideEarnedEl.checked;
  rowsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (kind !== 'all' && t.kind !== kind) continue;
    if (grade !== 'all' && t.grade !== grade) continue;
    if (hideEarned && earned.has(t.id)) continue;
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (q && !hay.includes(q)) continue;
    shown++;
    const card = document.createElement('article');
    card.className = 'card' + (earned.has(t.id) ? ' earned' : '');
    const isSpoiler = spoilerHidden(t);
    const title = isSpoiler ? 'Hidden story trophy — earn it to reveal' : t.name;
    const desc = isSpoiler ? 'A hidden story trophy. Its name and description stay hidden until you earn it.' : t.description;
    card.innerHTML = `
      <h3></h3>
      <p class="desc"></p>
      <div class="meta">
        <span class="badge ${t.grade}">${t.grade}</span>
        <span class="badge kind">${KIND_LABEL[t.kind]}</span>
        ${t.hidden ? '<span class="badge hidden-flag">hidden</span>' : ''}
        ${t.unconfirmed ? '<span class="badge unconfirmed">unconfirmed</span>' : ''}
      </div>
      <p class="guide"></p>
      <ol></ol>
      <p class="sources"></p>`;
    card.querySelector('h3').textContent = title;
    card.querySelector('.desc').textContent = desc;
    const guideEl = card.querySelector('.guide');
    guideEl.textContent = isSpoiler ? 'Finish the story to reveal this trophy.' : t.guide;
    const ol = card.querySelector('ol');
    if (!isSpoiler) for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    card.querySelector('.sources').textContent = 'Sources: ' + t.sources.join(', ') + '.';
    const toggle = document.createElement('label');
    toggle.className = 'earned-toggle';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save(); renderProgress(); renderTracker(); renderRoadmap(); renderPlanner();
    });
    toggle.append(box, document.createTextNode(earned.has(t.id) ? 'Earned' : 'Mark as earned'));
    card.append(toggle);
    const note = document.createElement('textarea');
    note.className = 'note-area';
    note.placeholder = 'Your note for this trophy…';
    note.value = notes[t.id] ?? '';
    note.addEventListener('input', () => {
      if (note.value.trim()) notes[t.id] = note.value;
      else delete notes[t.id];
      save();
    });
    card.append(note);
    rowsEl.append(card);
  }
  noteEl.textContent = shown === trophies.length
    ? `Showing all ${trophies.length} trophies.`
    : `Showing ${shown} of ${trophies.length} trophies.`;
}

searchEl.addEventListener('input', renderTracker);
kindEl.addEventListener('change', renderTracker);
gradeEl.addEventListener('change', renderTracker);
hideEarnedEl.addEventListener('change', renderTracker);
spoilersEl.addEventListener('change', renderTracker);

document.getElementById('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], notes }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-ledger-progress.json';
  a.click();
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    earned = new Set((data.earned ?? []).filter(id => byId[id]));
    notes = data.notes ?? {};
    save(); renderProgress(); renderTracker(); renderRoadmap(); renderPlanner();
  } catch { alert('That file is not a Leonida Ledger export.'); }
});

// ---------- roadmap ----------
function renderRoadmap() {
  document.getElementById('roadmap-intro').textContent =
    `${roadmapDoc.title} — difficulty ${roadmapDoc.difficulty}, ${roadmapDoc.hours}, ${roadmapDoc.playthroughs}.`;
  const wrap = document.getElementById('roadmap');
  wrap.replaceChildren();
  for (const stage of roadmapDoc.stages) {
    const done = stage.trophies.filter(id => earned.has(id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<h3>Stage ${stage.n} — </h3><p class="hours"></p><p></p><div class="chips"></div><div class="stage-bar"><div></div></div>`;
    div.querySelector('h3').append(document.createTextNode(stage.name));
    div.querySelector('.hours').textContent = `About ${stage.hours} · ${done}/${stage.trophies.length} trophies in this stage`;
    div.querySelectorAll('p')[1].textContent = stage.text;
    const tips = document.createElement('p');
    tips.textContent = 'Tips: ' + stage.tips.join(' · ') + '.';
    div.append(tips);
    const chips = div.querySelector('.chips');
    for (const id of stage.trophies) {
      const chip = document.createElement('span');
      chip.className = 'chip' + (earned.has(id) ? ' earned' : '');
      chip.textContent = byId[id].name;
      chips.append(chip);
    }
    div.querySelector('.stage-bar > div').style.width =
      stage.trophies.length ? `${(done / stage.trophies.length) * 100}%` : '0%';
    wrap.append(div);
  }
}

// ---------- missables ----------
function renderMissables() {
  const el = document.getElementById('missables');
  el.replaceChildren();
  const pma = byId[28];
  const warn = document.createElement('div');
  warn.className = 'callout';
  warn.innerHTML = `<h3>Possibly missable: Positive Mental Attitude</h3>`;
  const p1 = document.createElement('p');
  p1.textContent = pma.guide;
  warn.append(p1);
  const p2 = document.createElement('p');
  p2.textContent = 'Why it matters: GTA VI has no mission replay, so anything tied to a chapter window cannot be replayed. PowerPyx and GTABase both flag this as the only trophy that might be missable, and both say it is unconfirmed whether the balcony meditation is actually required. Do it anyway, and keep a Chapter 1 save until the trophy pops.';
  warn.append(p2);
  el.append(warn);

  const yago = document.createElement('div');
  yago.className = 'callout';
  yago.innerHTML = `<h3>Time-sensitive (not a trophy, but it feeds one)</h3>`;
  const p3 = document.createElement('p');
  p3.textContent = 'Race Against Yago, in Yago\u2019s street-racing strand in Chapter 3, carries an hourglass icon: it only appears for a limited window. The strand counts toward Strangers & Freaks, so save first and race the moment it shows up.';
  yago.append(p3);
  el.append(yago);

  const safe = document.createElement('div');
  safe.className = 'callout safe';
  safe.innerHTML = `<h3>Everything else: not missable</h3>`;
  const p4 = document.createElement('p');
  p4.textContent = 'GTABase and PowerPyx both say nothing else on the list is permanently missable: every requirement can still be done in free roam once the credits roll, and all story trophies unlock by finishing the story. The one habit that covers every edge case is the save routine below.';
  safe.append(p4);
  const ul = document.createElement('ul');
  for (const line of [
    'One manual save at the start of every chapter.',
    'One manual save right before the final mission.',
    'Keep the Chapter 1 save until Positive Mental Attitude pops.',
    'Cheats off for the whole run — PowerPyx reports a cheat disables trophies and you cannot save afterwards.',
  ]) {
    const li = document.createElement('li');
    li.textContent = line;
    ul.append(li);
  }
  safe.append(ul);
  el.append(safe);
}

// ---------- planner ----------
const QUICK_WINS = [2, 21, 46, 20, 16, 35, 53, 55, 3, 8, 10, 11, 12, 13];
function renderPlanner() {
  const el = document.getElementById('planner');
  el.replaceChildren();
  const h1 = document.createElement('h2');
  h1.textContent = 'Quick wins — do these first';
  el.append(h1);
  const q = document.createElement('p');
  q.textContent = 'The easiest trophies on the list, in the order you will meet them. Ticking these off early builds momentum and covers a spread of kinds.';
  el.append(q);
  for (const id of QUICK_WINS) {
    const t = byId[id];
    const div = document.createElement('div');
    div.className = 'card' + (earned.has(id) ? ' earned' : '');
    div.innerHTML = `<h3></h3><p class="desc"></p><p class="guide"></p>`;
    div.querySelector('h3').textContent = `${earned.has(id) ? '✓ ' : ''}${t.name} — ${t.grade}`;
    div.querySelector('.desc').textContent = t.description;
    div.querySelector('.guide').textContent = t.guide;
    el.append(div);
  }
  const h2 = document.createElement('h2');
  h2.textContent = 'Roadmap order — what to do next';
  el.append(h2);
  const p2 = document.createElement('p');
  p2.textContent = 'The full order follows the Roadmap tab: setup, story, questlines, activities, robberies, collectibles, then 100% and the Platinum. Your next unfinished stage is highlighted there.';
  el.append(p2);
  const next = roadmapDoc.stages.find(s => s.trophies.some(id => !earned.has(id)));
  if (next) {
    const div = document.createElement('div');
    div.className = 'stage';
    div.innerHTML = `<h3></h3><p></p>`;
    div.querySelector('h3').textContent = `Next: Stage ${next.n} — ${next.name} (${next.hours})`;
    div.querySelector('p').textContent = next.text;
    el.append(div);
  }
  const h3 = document.createElement('h2');
  h3.textContent = 'Still unconfirmed — do not grind these yet';
  el.append(h3);
  const p3 = document.createElement('p');
  p3.textContent = 'Four trophies have no confirmed unlock method at launch (PowerPyx, 18 Nov). Their guides say so plainly. Check back once a second source confirms a method — do not waste hours on a guess.';
  el.append(p3);
  for (const t of trophies.filter(t => t.unconfirmed)) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3></h3><p class="desc"></p><p class="guide"></p>`;
    div.querySelector('h3').textContent = `${t.name} — ${t.grade}`;
    div.querySelector('.desc').textContent = t.description;
    div.querySelector('.guide').textContent = t.guide;
    el.append(div);
  }
}

// ---------- sources ----------
function renderSources() {
  const el = document.getElementById('sources');
  el.replaceChildren();
  const h1 = document.createElement('h2');
  h1.textContent = 'How this guide was built';
  el.append(h1);
  const items = [
    ['Exophase (via planetgta6.com, 18 Nov 2026)', 'The trophy names, descriptions and grades: the official English list as shown on PlayStation Network, taken 18 November. Every name, description and grade in the Tracker comes from this list.'],
    ['PSNProfiles and TrueAchievements', 'Cross-checks: the same 55 names appear on both trackers, with the same 1 platinum / 2 gold / 6 silver / 46 bronze split and 27 visible / 28 hidden.'],
    ['PowerPyx — GTA 6 Trophy Guide & Roadmap (18 Nov 2026)', 'The counts and methods: 9 activity types, 42 shooting-range golds (18 Griffin, 24 Rodgers Ranch), 14 Top Fun drone race locations, 18 meditation spots, 70 of 80 Challenges for 100%, the Chapter 1 balcony meditation, the time-sensitive Race Against Yago, difficulty 4/10 and ~200 hours.'],
    ['GTABase (via egamers.io, 18 Nov 2026)', 'Second source for the missable flag (Positive Mental Attitude only), the 100% checklist shape, and the note that nothing else is permanently missable because free roam stays open after the credits.'],
    ['CryptoGames', 'Listed as a source for cross-checking trophy details; where a detail could not be confirmed in two sources, the guide says so instead of guessing.'],
  ];
  for (const [name, text] of items) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `<h3></h3><p></p>`;
    div.querySelector('h3').textContent = name;
    div.querySelector('p').textContent = text;
    el.append(div);
  }
  const h2 = document.createElement('h2');
  h2.textContent = 'What is still unknown';
  el.append(h2);
  const unknowns = document.createElement('div');
  unknowns.className = 'card';
  unknowns.innerHTML = `<p></p><p></p><p></p>`;
  const ps = unknowns.querySelectorAll('p');
  ps[0].textContent = 'Rockstar has not published an official trophy list. The list here is the platform list as reported on 18 November 2026, and it agrees across Exophase, PSNProfiles, TrueAchievements, GTABase and PowerPyx.';
  ps[1].textContent = 'Four trophies have no confirmed unlock method yet: In The Beginning…, Bad Luck, I Guess, The Truth Is Out There and Ten Pin. They are labelled unconfirmed in the Tracker and the Planner.';
  ps[2].textContent = 'It is unconfirmed whether the Chapter 1 balcony meditation is required for Positive Mental Attitude. The safe move — do it and keep a Chapter 1 save — is what PowerPyx and GTABase recommend.';
  el.append(unknowns);
}

// ---------- boot ----------
renderProgress();
renderTracker();
renderRoadmap();
renderMissables();
renderPlanner();
renderSources();
