import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('🔄 Updating "exam-images" bucket to PUBLIC...')

  const { data, error } = await supabase.storage.updateBucket('exam-images', {
    public: true,
    allowedMimeTypes: ['image/*'],
    fileSizeLimit: 5242880 // 5MB
  })

  if (error) {
    console.error('❌ Failed to update bucket:', error.message)
    // Try to retrieve bucket info to see if it exists
    const { data: bucket, error: getError } = await supabase.storage.getBucket('exam-images')
    if (getError) {
       console.error('   Bucket might not exist:', getError.message)
    } else {
       console.log('   Current bucket config:', bucket)
    }
  } else {
    console.log('✅ Successfully made "exam-images" public!')
    console.log('   Result:', data)
  }
}

main()
