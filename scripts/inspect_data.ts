import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectData() {
  console.log('🔍 Inspecting Questions...')
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, content, images, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${questions.length} questions:`)
  questions.forEach((q, i) => {
    console.log(`\n[${i + 1}] ID: ${q.id}`)
    console.log(`    Created: ${q.created_at}`)
    console.log(`    Images: ${JSON.stringify(q.images)}`)
    console.log(`    Content Preview: ${q.content?.substring(0, 50)}...`)
  })
}

inspectData()
