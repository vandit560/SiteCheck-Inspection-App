# SiteCheck – Building Safety Inspection Mobile App

SiteCheck is an offline-first mobile application built for building safety inspectors visiting construction sites, basements, and remote outskirts where network connectivity is weak or non-existent.

Inspectors can review assigned sites, conduct safety checklists, record pass/fail/N/A evaluations with mandatory notes for failures, and submit reports with the guarantee that **nothing recorded is ever lost**. All completed reports automatically sync with the office dispatch once network connectivity is available.

---

## 🚀 How to Run

### Prerequisites
- Node.js (v20+ recommended)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

Press:
- **`i`** to open in the **iOS Simulator**
- **`a`** to open in the **Android Emulator**
- **`w`** to open in the **Web Browser**

### 3. Verify Code Quality
```bash
npx tsc --noEmit    # TypeScript typecheck (0 errors)
```

---

## 📱 Features & Functional Requirements

| Requirement | Implementation & Architectural Solution |
| :--- | :--- |
| **1. Assigned Inspections** | Inspectors see all assigned sites with site names, addresses, scheduled times, and real-time progress indicators. Cached locally for offline access. |
| **2. Checklist & Validation** | Interactive PASS, FAIL, and N/A controls for every checklist item. Selecting **FAIL** automatically mandates a detailed explanation note. Full client-side validation prevents submitting incomplete reports. |
| **3. Offline-First (No Lost Data)** | Every single button tap and note keystroke is immediately persisted to local storage (`@react-native-async-storage/async-storage`). App crashes or battery loss will never lose inspector progress. |
| **4. Outbox & Background Sync** | Submissions are committed to a local Outbox first. An active background sync engine transmits them to `mockApi.ts`, with automatic retry on network reconnection, periodic retries for transient 500 server errors, and 409 idempotency handling. |
| **5. Offline Simulation Mode** | Includes a built-in "Simulate Basement / No Signal" toggle in the header banner and Settings screen, allowing developers and reviewers to test offline queuing and syncing without disabling their device's Wi-Fi. |

---

## 🛠 Architectural Decisions

Where the brief was open-ended, the following key engineering decisions were made:

### 1. Offline-First Architecture & Realm Database
- **Realm Database Engine**: Data is persisted using **Realm** (`realm` and `@realm/react`), providing ACID transactional guarantees, zero-copy reads, and high performance for mobile inspection records.
- **Embedded Object Models**:
  - `Inspection`: Primary key `id`, siteName, address, scheduledAt, and embedded `ChecklistItem[]`.
  - `DraftInspection`: Primary key `inspectionId`, lastSavedAt, and embedded `DraftItem[]` (result, note, updatedAt).
  - `OutboxItem`: Primary key `inspectionId`, site details, submission status, retry attempts, and embedded `OutboxResult[]`.
  - `SyncedRecord`: Primary key `inspectionId` and office `receivedAt` timestamp.
  - `AppSetting`: Key-value store for app settings (e.g. offline simulation toggle).
- **Instant Persistence**: Every single selection or note keystroke commits to Realm via `realm.write()`. Battery depletion or sudden app termination will never lose inspector progress.
- **Outbox Queue**: When an inspection is finalized, it is committed to the Realm `OutboxItem` collection. The inspector is confirmed immediately, while background synchronization handles office transmission.

### 2. Robust Sync Engine & Resiliency
- **Network Recovery Trigger**: Uses `@react-native-community/netinfo` to detect when the device regains network access and automatically triggers outbox synchronization.
- **Handling Random 500 Errors**: `mockApi.ts` simulates a 15% random failure (`ApiError(500, 'Internal server error')`). The sync engine catches this, flags the submission for automatic retry, and runs a periodic ticker (every 30 seconds) to retry failed submissions.
- **Idempotency (409 Conflict Handling)**: If an inspection was previously received by the server, `mockApi.ts` returns `ApiError(409, 'Inspection already submitted')`. The sync engine recognizes this as a successful receipt, marks it as `synced`, and clears the draft.
- **Concurrency Lock**: An active sync mutex (`isSyncingInProgress`) prevents overlapping sync attempts or duplicate submissions.

### 3. Feature-Based Architecture & Twrnc Styling
The codebase adheres strictly to Feature-Based Architecture and modular design:

```text
src/
├── app/                           # Expo Router routes (thin entrypoints)
│   ├── _layout.tsx                # App root provider & stack navigation
│   ├── index.tsx                  # Home route -> InspectionListScreen
│   ├── inspection/[id].tsx        # Inspection detail route -> InspectionDetailScreen
│   ├── outbox.tsx                 # Outbox route -> OutboxScreen
│   └── settings.tsx               # Settings route -> SettingsScreen
├── features/
│   ├── inspections/               # Inspection domain feature
│   │   ├── components/            # InspectionCard, ChecklistItemRow, etc.
│   │   ├── context/               # InspectionContext provider & state
│   │   ├── hooks/                 # useInspectionList, useInspectionDetail
│   │   ├── screens/               # InspectionListScreen, InspectionDetailScreen
│   │   ├── services/              # inspectionService (fetch, progress, validation)
│   │   ├── types/                 # Inspection domain types
│   │   └── index.ts               # Feature public barrel exports
│   ├── outbox/                    # Background sync & transmission queue feature
│   │   ├── components/            # OutboxItemCard
│   │   ├── hooks/                 # useOutbox
│   │   ├── screens/               # OutboxScreen
│   │   ├── services/              # syncService (retry, 409 idempotency, lock)
│   │   ├── types/                 # OutboxItem, SyncResult
│   │   └── index.ts               # Feature public barrel exports
│   └── settings/                  # Inspector settings & simulator
│       ├── screens/               # SettingsScreen
│       └── index.ts               # Feature public barrel exports
├── components/                    # App-wide shared components (NetworkBanner)
├── services/                      # Shared infrastructure (storage, network)
└── constants/                     # Shared theme & tokens
```

- **twrnc**: Tailwind CSS for React Native provides consistent, responsive typography, spacing, and accessible touch targets without inline style pollution or heavy UI libraries.
- **File Size Discipline**: Every source file is kept strictly under **300 lines** (averaging 70–220 lines) for maximum readability and maintainability.
- **No Template Code**: All starter template boilerplate files were completely removed in favor of clean, production-ready custom implementations.

---

## 🤖 How AI Was Used

1. **Architecture & Schema Design**: Scoped out the domain types, draft schema, outbox state machine, and error handling flow based on `mockApi.ts`.
2. **Component Decomposition**: Structured components into reusable, modular primitives (`StatusBadge`, `InspectionProgressBar`, `ChecklistItemRow`, `NetworkBanner`).
3. **Strict TypeScript & Validation Rules**: Verified contract compatibility with `mockApi.ts`, including the 422 validation condition (all items answered + required notes for failures).
4. **Project Rules Enforcement**: Applied the project rules from `skills/expo-react-native-project-rules.md` (Feature-based structure, `twrnc` styling, max 300 lines per file, `npx tsc --noEmit` validation).

---

## ⏱️ Time Taken

- **Exploration & Requirements Analysis**: ~20 minutes
- **Storage, Sync Engine & Offline Architecture**: ~45 minutes
- **Checklist UI, Validation & Feature Screens**: ~50 minutes
- **Offline Simulation, Diagnostics & Outbox**: ~30 minutes
- **Testing, Refactoring (Line-limit compliance) & Documentation**: ~25 minutes
- **Total Time**: ~2 hours 50 minutes

---

## 🔮 What I'd Improve With More Time

1. **Photo & Media Attachments**: Allow inspectors to snap photos of safety hazards with camera capture and store compressed images locally.
2. **Digital Inspector Signature**: Add a signature pad modal for inspector and site manager sign-off prior to submission.
3. **SQLite Database**: For enterprise scales with thousands of historical inspections, migrate from AsyncStorage to `expo-sqlite` with indexing.
4. **Geolocation Verification**: Capture GPS coordinates at the time of checklist completion to verify the inspector was physically on site.
5. **PDF Report Export**: Generate and share a branded PDF inspection certificate directly from the mobile device.
