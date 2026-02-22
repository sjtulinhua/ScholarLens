import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const local = createClient(supabaseUrl, supabaseKey);

async function nuclearReset() {
  console.log('☢️ Starting Nuclear Reset...');

  // 1. Truncate tables in correct order of dependencies
  console.log('--- Cleaning Database Tables ---');
  
  const tables = ['practice_records', 'mistakes', 'questions', 'user_knowledge_points'];
  
  for (const table of tables) {
    console.log(`Clearing table: ${table}...`);
    const { error } = await local.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); 
    // Note: Using a delete logic that effectively clears everything
    // Actually, truncate is better but requires raw SQL. delete().neq() with a fake id is a common JS client hack to clear.
    // Or just .delete().gt('created_at', '1970-01-01')
    
    const { error: error2 } = await local.from(table).delete().not('id', 'is', null);
    
    if (error2) {
      console.error(`Error clearing ${table}:`, error2);
    } else {
      console.log(`✅ Table ${table} cleared.`);
    }
  }

  console.log('☢️ Nuclear Reset Database Phase Complete.');
}

nuclearReset();
