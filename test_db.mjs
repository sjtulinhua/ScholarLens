import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path:'.env.local'})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data: mistakes, error } = await supabase
      .from("mistakes")
      .select(`
        id,
        status,
        primary_knowledge_point,
        question:questions (
          subject,
          knowledge_points
        )
      `)
      .limit(5);
      
  console.log(JSON.stringify(mistakes, null, 2))
}
test()
