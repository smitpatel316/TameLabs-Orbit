# Orbit — Map your relationships. Prune the noise.

Part of **Tame Labs** — Social CRM for psychological tooling.

## What is Orbit?

Your address book is a liability if you can't see patterns. Orbit lets you map contacts by energy (draining → nourishing), health (last interaction + sentiment), type (family/friend/professional/romantic/acquaintance), tags, birthdays.

## Features v2.0 (TS rewrite)

- **ContactsList**: Search by name/notes/tags, filter by tag/type, sort by recent/health/name, health badge color
- **ContactDetail**: Health score, energy, interaction count, notes, recent logs, quick actions to log interaction / view journey / sentiment
- **AddContact**: Name, relationship type (emoji+color), tags, birthday MM/DD, notes
- **AddInteraction**: Type (call/text/in-person/email/other), summary, energy level (draining-neutral-nourishing with colors), sentiment (positive/neutral/negative)
- **Map**: Energy cloud bubble map (opacity = health), by-type clusters, health distribution bar chart
- **Insights**: Overview stats, energy distribution, upcoming birthdays 30d, recent contact, by-type counts, needs attention <70%, suggestions
- **Reminders**: Create reminders per contact, toggle done, delete
- **JourneyMapping**: Timeline vertical with dot+line per interaction
- **SentimentScreen**: Positive/neutral/negative breakdown + insight
- **Settings**: Stats, export JSON, clear all local data

## Tech

- Expo 54, React 19, React Native 0.81, TypeScript
- Zustand 4.5.5 + AsyncStorage persist (`orbit-contacts-v2`)
- date-fns, react-native-svg
- Dark theme `#0F1117` background, `#1A1D27` surface, `#E53E3E` accent

## Data model

Contact { id, name, type, energy, tags[], notes, birthday, lastInteraction, createdAt, groups }
Interaction { id, contactId, type, summary, energy, sentiment, createdAt }
Group, Reminder ...

Store: `stores/orbitStore.js` → now TS-compatible, health = fn(lastInteraction days + recent energy + sentiment)

## Run

```bash
npm install
npm start
```

## Philosophy

Local-first, no tracking. Relationships are private infrastructure. Health score is naive (recency + energy) but directionally useful.

## Part of Tame Labs

- Hubble: Calibrate fear / Brier scores
- Orbit: Map relationships
- Quiet: Async social without Mammoth incentives

MIT Open Core
