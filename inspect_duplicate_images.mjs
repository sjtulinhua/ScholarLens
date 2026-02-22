import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const local = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  console.log('--- Inspecting Mistakes and Questions Data ---');
  const { data: mistakes, error } = await local
    .from('mistakes')
    .select(`
      id,
      question_id,
      question:questions (
        id,
        content,
        images,
        knowledge_points
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  mistakes.forEach((m, i) => {
    console.log(`Mistake ${i + 1}:`);
    console.log(`  ID: ${m.id}`);
    console.log(`  Question ID: ${m.question_id}`);
    console.log(`  Knowledge Points: ${m.question?.knowledge_points}`);
    console.log(`  Images: ${JSON.stringify(m.question?.images)}`);
    console.log('-------------------');
  });
}

inspectData();
