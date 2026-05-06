import { TrackedCustomer, Zone, ZoneType } from './types';

const INITIAL_POSITIONS = [
  { x: 10, y: 30, w: 12, h: 40 },
  { x: 40, y: 50, w: 10, h: 35 },
  { x: 70, y: 20, w: 11, h: 38 },
];

export function createInitialCustomers(): TrackedCustomer[] {
  return INITIAL_POSITIONS.map((pos, i) => ({
    trackerId: `T${i + 1}`,
    token: `TK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    bbox: pos,
    status: 'unpaid',
    currentZone: 'none',
    lastBillingZoneEntryTimestamp: null,
    history: [{ zone: 'none', timestamp: new Date().toISOString() }],
    confidence: 0.85 + Math.random() * 0.14,
  }));
}

export function updateCustomerPositions(customers: TrackedCustomer[], zones: Zone[]): TrackedCustomer[] {
  return customers.map(c => {
    // Random movement simulation
    const dx = (Math.random() - 0.5) * 1.5;
    const dy = (Math.random() - 0.5) * 1.5;
    
    let nx = Math.min(Math.max(c.bbox.x + dx, 5), 85);
    let ny = Math.min(Math.max(c.bbox.y + dy, 5), 60);

    const nextBbox = { ...c.bbox, x: nx, y: ny };
    
    // Check zone membership
    let newZone: ZoneType | 'none' = 'none';
    for (const zone of zones) {
      if (
        nx + c.bbox.w / 2 >= zone.x &&
        nx + c.bbox.w / 2 <= zone.x + zone.width &&
        ny + c.bbox.h / 2 >= zone.y &&
        ny + c.bbox.h / 2 <= zone.y + zone.height
      ) {
        newZone = zone.type;
        break;
      }
    }

    const hasChangedZone = newZone !== c.currentZone;
    const lastBillingZoneEntryTimestamp = 
      newZone === 'billing' && hasChangedZone ? new Date().toISOString() : c.lastBillingZoneEntryTimestamp;

    return {
      ...c,
      bbox: nextBbox,
      currentZone: newZone,
      lastBillingZoneEntryTimestamp,
      history: hasChangedZone 
        ? [...c.history, { zone: newZone, timestamp: new Date().toISOString() }].slice(-10)
        : c.history
    };
  });
}
