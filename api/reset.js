import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wejvwqncgapzzwvafjet.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlanZ3cW5jZ2Fwenp3dmFmamV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMDYyMTAsImV4cCI6MjA5NjU4MjIxMH0.jCtqE-XJoWzbCdjBk2HfpfRifIypYkhPUXMNG_6HhT0'
);

export default async function handler(req, res) {
  try {
    // Goluwala reset - shift result2 to result1
    const { data: rData } = await supabase.from('results').select('*').eq('id', 1).single();
    if (rData) {
      const newResult1 = rData.result2 && rData.result2 !== 'WAIT' ? rData.result2 : rData.result1;
      await supabase.from('results').upsert({
        id: 1,
        result1: newResult1,
        result2: 'WAIT',
        updated_at: new Date().toISOString()
      });
    }

    // Aashapura reset - just clear current display, chart already saved by admin
    await supabase.from('aashapura_results').upsert({
      id: 1,
      open_digits: 'XXX',
      close_digits: 'XXX',
      updated_at: new Date().toISOString()
    });

    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
