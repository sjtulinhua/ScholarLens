import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function cleanupData() {
  console.log('🧹 Cleaning up ALL mistakes and questions...')
  
  // 1. Delete all mistakes first (foreign key constraint)
  const { error: error1 } = await supabase
    .from('mistakes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (error1) {
    console.error('❌ Failed to delete mistakes:', error1.message)
    return
  }
  console.log('✅ All mistakes deleted.')

  // 2. Delete all questions
  const { error: error2 } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (error2) {
    console.error('❌ Failed to delete questions:', error2.message)
    return
  }
  console.log('✅ All questions deleted.')
  console.log('✨ Database is now clean. You can start fresh upload.')
}

cleanupData()
