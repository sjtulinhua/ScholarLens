import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({path:'.env.local'})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID

async function test() {
  const { error } = await supabase.from("questions").insert({
    user_id: userId,
    subject: "math",
    content: "这是一个测试问题，用于检查入库是否成功。",
    difficulty: 3,
    knowledge_points: [],
    is_reference: true,
    official_year: "2024厦门测试卷",
    embedding: new Array(3072).fill(0),
    images: []
  });
  
  console.log("Insert result error:", error);
}
test()
