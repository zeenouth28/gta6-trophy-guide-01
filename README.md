# Leonida Ledger — GTA VI Trophy Guide & Tracker

An offline, open-source, static web app: a tracker over all 55 official GTA VI
trophies (name, description and grade for each, with a guide in the author's own
words), a 7-stage roadmap to the Platinum, the missables flagged, a next-up
planner, and a sources page. No network requests, no artwork, system fonts only.
Progress saves in the browser (localStorage) with export and import.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` directly in a browser.

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## The data

`app/data/trophies.json` — the 55 trophies: 1 platinum, 2 gold, 6 silver,
46 bronze; 27 visible, 28 hidden. Names, descriptions and grades were checked
19 November 2026 against Exophase (via planetgta6.com, 18 Nov) and cross-checked
with PSNProfiles and TrueAchievements. Counts and methods were checked against
PowerPyx's trophy guide and roadmap (18 Nov) and GTABase (via egamers.io).
Rockstar has not published an official list.

`app/data/roadmap.json` — 7 stages (setup → story → questlines → activities →
robberies → collectibles → 100% + Platinum), difficulty 4/10, about 200 hours.

## What is still unknown

Four trophies have no confirmed unlock method at launch (PowerPyx, 18 Nov):
In The Beginning…, Bad Luck, I Guess, The Truth Is Out There and Ten Pin. They
are labelled unconfirmed in the app — no method is guessed for them. It is also
unconfirmed whether the Chapter 1 balcony meditation is required for Positive
Mental Attitude; the guide says to do it anyway and keep a Chapter 1 save.

## License

MIT. See LICENSE.
