const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/orderTracking.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
const loaded = { exports: {} };
new Function('exports', 'module', compiled.outputText)(loaded.exports, loaded);
const { getOrderProgress, orderSteps, mergeTracking, getCourierLocation, getArrivalMinutes } = loaded.exports;
const cases = [
  { restaurant_confirmation_status: 'pending', payment_status: 'pending' },
  { restaurant_confirmation_status: 'accepted' },
  { restaurant_confirmation_status: 'accepted', payment_status: 'pending' },
  { payment_status: 'confirmed' },
  { status: 'preparing', payment_status: 'confirmed' },
  { status: 'ready', payment_status: 'confirmed' },
  ...['assigned', 'picked_up', 'on_the_way', 'delivered'].map(delivery_status => ({ delivery_status, status: 'ready' })),
];
cases.forEach((state, step) => test(orderSteps[step], () => {
  assert.equal(getOrderProgress({ delivery_status: 'pending', ...state }).step, step);
}));
for (const state of [{ status: 'cancelled' }, { delivery_status: 'cancelled' }, { restaurant_confirmation_status: 'rejected' }, { payment_status: 'rejected' }]) {
  test(`Blocked: ${JSON.stringify(state)}`, () => assert.equal(getOrderProgress({ delivery_status: 'pending', ...state }).blocked, true));
}
test('Missing data does not invent preparation', () => assert.equal(getOrderProgress().step, -1));
test('Old response does not invent preparation', () => assert.equal(getOrderProgress({ delivery_status: 'pending' }).step, -1));
test('Completed preparation is not delivered', () => assert.equal(getOrderProgress({ status: 'completed' }).step, 5));

test('Delivery completion takes precedence over inconsistent old statuses', () => {
  assert.equal(getOrderProgress({ delivery_status: 'delivered', payment_status: 'rejected', status: 'cancelled' }).step, 9);
  assert.equal(getOrderProgress({ delivery_completed_at: '2026-09-08T10:00:00Z', delivery_status: 'pending' }).step, 9);
});
test('Driver legacy statuses map to customer milestones', () => {
  assert.equal(getOrderProgress({ delivery_status: 'accepted' }).step, 6);
  assert.equal(getOrderProgress({ delivery_status: 'in_progress' }).step, 8);
});
test('Completed collection order remains completed', () => {
  assert.equal(getOrderProgress({ requires_delivery: false, status: 'completed', payment_status: 'rejected' }).label, 'Commande terminée');
});
test('Expired preorder is blocked', () => assert.equal(getOrderProgress({ restaurant_confirmation_status: 'expired' }).blocked, true));
test('A stale response cannot reopen a delivered order', () => {
  const done = { tracking_number: 'test', delivery_status: 'delivered' };
  assert.equal(mergeTracking(done, { tracking_number: 'test', delivery_status: 'pending' }), done);
});
test('Older responses cannot overwrite newer preparation status', () => {
  const latest = { tracking_number: 'test', status: 'ready', delivery_updated_at: '2026-09-08T10:00:00Z' };
  assert.equal(mergeTracking(latest, { tracking_number: 'test', status: 'preparing', delivery_updated_at: '2026-09-08T09:00:00Z' }), latest);
});
const now = Date.parse('2026-09-08T10:00:00Z');
const located = { tracking_number: 'test', delivery_status: 'on_the_way', courier_latitude: 0, courier_longitude: 0, courier_location_at: '2026-09-08T09:59:30Z' };
test('Zero coordinates are valid', () => assert.deepEqual(getCourierLocation(located, now), { latitude: 0, longitude: 0 }));
test('Old, future, invalid or completed GPS positions are hidden', () => {
  for (const patch of [{ courier_location_at: '2026-09-08T09:00:00Z' }, { courier_location_at: '2026-09-08T11:00:00Z' }, { courier_latitude: 91 }, { courier_longitude: null }, { delivery_status: 'delivered' }, { delivery_status: 'cancelled' }]) {
    assert.equal(getCourierLocation({ ...located, ...patch }, now), null);
  }
});
test('ETA is only shown for a future arrival on an ongoing journey', () => {
  assert.equal(getArrivalMinutes({ ...located, estimated_arrival_at: '2026-09-08T10:12:00Z' }, now), 12);
  assert.equal(getArrivalMinutes({ ...located, estimated_arrival_at: '2026-09-08T09:50:00Z' }, now), null);
  assert.equal(getArrivalMinutes({ ...located, delivery_status: 'delivered', estimated_arrival_at: '2026-09-08T10:12:00Z' }, now), null);
});

test('An early driver assignment does not hide payment or preparation', () => {
  assert.equal(getOrderProgress({ delivery_status: 'assigned', restaurant_confirmation_status: 'pending' }).step, 0);
  assert.equal(getOrderProgress({ delivery_status: 'assigned', payment_status: 'pending' }).step, 2);
  assert.equal(getOrderProgress({ delivery_status: 'assigned', payment_status: 'confirmed', status: 'preparing' }).step, 4);
  assert.equal(getOrderProgress({ delivery_status: 'assigned', payment_status: 'confirmed', status: 'ready' }).step, 6);
});
