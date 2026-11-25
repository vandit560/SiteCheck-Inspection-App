// SiteCheck mock API. Use as is; do not modify this file.

export type ChecklistItem = {
  id: string;
  text: string;
};

export type Inspection = {
  id: string;
  siteName: string;
  address: string;
  scheduledAt: string; // ISO 8601, UTC
  checklist: ChecklistItem[];
};

export type ItemResult = {
  itemId: string;
  result: 'PASS' | 'FAIL' | 'NA';
  note?: string;
};

export type Submission = {
  inspectionId: string;
  completedAt: string; // ISO 8601
  results: ItemResult[];
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const checklist: ChecklistItem[] = [
  { id: 'c1', text: 'Scaffolding is secured and stable' },
  { id: 'c2', text: 'Workers are wearing helmets and safety shoes' },
  { id: 'c3', text: 'Fire extinguishers are available and in date' },
  { id: 'c4', text: 'Electrical wiring is covered and away from water' },
  { id: 'c5', text: 'Open edges and shafts are barricaded' },
  { id: 'c6', text: 'First aid kit is available on site' },
  { id: 'c7', text: 'Emergency exit routes are clear' },
  { id: 'c8', text: 'Construction material is stacked safely' },
];

function daysFromNow(days: number, hourUtc: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 30, 0, 0);
  return d.toISOString();
}

const inspections: Inspection[] = [
  { id: 'insp-101', siteName: 'Shivalik Heights, Tower B', address: 'Near Iskcon Cross Road, Satellite, Ahmedabad', scheduledAt: daysFromNow(-1, 4), checklist },
  { id: 'insp-102', siteName: 'Riverfront Commercial Hub', address: 'Ashram Road, Ahmedabad', scheduledAt: daysFromNow(0, 3), checklist },
  { id: 'insp-103', siteName: 'Green Acres Bungalows, Phase 2', address: 'Shela, Ahmedabad', scheduledAt: daysFromNow(0, 9), checklist },
  { id: 'insp-104', siteName: 'Sun Prime Business Park', address: 'SG Highway, Ahmedabad', scheduledAt: daysFromNow(1, 5), checklist },
  { id: 'insp-105', siteName: 'Metro Depot Extension', address: 'Gyaspur, Ahmedabad', scheduledAt: daysFromNow(2, 18), checklist },
];

const received = new Set<string>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The mock behaves like a real server over the phone's real connection:
// requests fail when the phone has no internet access.
async function requireNetwork() {
  try {
    const res = await fetch('https://clients3.google.com/generate_204', { method: 'GET' });
    if (res.status !== 204) throw new Error('no connectivity');
  } catch {
    throw new ApiError(0, 'Network request failed');
  }
  await wait(400 + Math.random() * 1200);
  if (Math.random() < 0.15) throw new ApiError(500, 'Internal server error');
}

export async function getAssignedInspections(): Promise<Inspection[]> {
  await requireNetwork();
  return JSON.parse(JSON.stringify(inspections));
}

export async function submitInspection(submission: Submission): Promise<{ receivedAt: string }> {
  await requireNetwork();
  if (!inspections.some((i) => i.id === submission.inspectionId)) {
    throw new ApiError(404, 'Inspection not found');
  }
  if (received.has(submission.inspectionId)) {
    throw new ApiError(409, 'Inspection already submitted');
  }
  const incomplete = checklist.some((c) => !submission.results.some((r) => r.itemId === c.id));
  const missingNote = submission.results.some((r) => r.result === 'FAIL' && !r.note?.trim());
  if (incomplete || missingNote) {
    throw new ApiError(422, 'Submission is incomplete');
  }
  received.add(submission.inspectionId);
  return { receivedAt: new Date().toISOString() };
}
