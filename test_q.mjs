import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const local = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data: mistake } = await local.from('mistakes').select('*, question:questions(*)').limit(1).single();
  console.log('Mistake:', mistake.id);
  console.log('Question ID from Mistake:', mistake.question_id);
  
  if (mistake.question) {
    console.log('Question object exists within mistake join.');
    const { data: q, error } = await local.from('questions').select('*').eq('id', mistake.question.id).single();
    if (error) {
      console.log('Error fetching question directly:', error);
    } else {
      console.log('Success fetching question directly! ID:', q.id);
    }
  } else {
    console.log('Question object IS NULL in mistake join.');
  }
}
test();
