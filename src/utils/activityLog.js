import { supabase } from '../supabase';

export async function logActivity({ actor, action, sistema, field, oldValue, newValue, note }) {
  try {
    await supabase.from('activity_log').insert([{
      actor,
      action,
      sistema:   sistema   || null,
      field:     field     || null,
      old_value: oldValue != null ? String(oldValue) : null,
      new_value: newValue != null ? String(newValue) : null,
      note:      note      || null,
    }]);
  } catch (e) {
    console.warn('[AquaOps] activityLog failed:', e?.message);
  }
}
