import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiKey: !!key,
      geminiKeyLength: key?.length || 0,
      geminiKeyPrefix: key ? key.substring(0, 4) : "N/A",
      geminiKeySuffix: key ? key.substring(key.length - 4) : "N/A",
      hasSupabaseUrl: !!supabaseUrl,
      nodeVersion: process.version,
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    }
  };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("mistakes").select("id").limit(1);
    
    return NextResponse.json({
      ...debugInfo,
      supabaseConn: {
        success: !error,
        error: error ? error.message : null,
        dataCount: data?.length || 0
      }
    });
  } catch (e: any) {
    return NextResponse.json({
      ...debugInfo,
      supabaseConn: {
        success: false,
        error: e.message
      }
    });
  }
}
