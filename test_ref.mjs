import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path:'.env.local'})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data: references, error } = await supabase
    .from("questions")
    .select("id, content, official_year, subject, difficulty, created_at, answer, analysis, images, knowledge_points")
    .eq("is_reference", true)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.log("Reference query error:", error);
  } else {
    console.log("Success! Found:", references?.length, "items.");
  }
}
test()
