import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzEzNDg5NTY0LCJleHAiOjIwMjk3MDgzNjR9.yO3tW2i-C1E9sWv8vNsq2B_zL_O_O2G1M1A-M-T--W4';

const CLOUD_PREFIX = 'https://zrocwujtcgehsqsrwptc.supabase.co/storage/v1/object/public/exam-images/';
const LOCAL_PREFIX = '/exam-images/';

async function fixDatabaseImageUrls() {
  // Let's get the key dynamically from .env.local to be safe
  const fs = await import('fs');
  const envVars = fs.readFileSync('.env.local', 'utf-8');
  let realKey = SUPABASE_KEY;
  const match = envVars.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
  if (match) {
    realKey = match[1].trim();
  }

  const supabase = createClient(SUPABASE_URL, realKey);
  console.log('🔄 开始修复数据库中的云端图片链接...');

  // Fix Questions table
  console.log('📦 修复 Questions 表...');
  const { data: questions, error: qErr } = await supabase.from('questions').select('id, images');
  if (qErr) {
    console.error('获取 questions 失败:', qErr);
    return;
  }

  let qUpdated = 0;
  for (const q of questions) {
    if (!q.images || !Array.isArray(q.images) || q.images.length === 0) continue;
    
    let needsUpdate = false;
    const newImages = q.images.map(img => {
      if (typeof img === 'string' && img.includes(CLOUD_PREFIX)) {
        needsUpdate = true;
        return img.replace(CLOUD_PREFIX, LOCAL_PREFIX);
      }
      return img;
    });

    if (needsUpdate) {
      await supabase.from('questions').update({ images: newImages }).eq('id', q.id);
      qUpdated++;
    }
  }
  console.log(`✅ Questions 表修复完成，共更新 ${qUpdated} 条记录。`);

  // Fix Exams table
  console.log('📦 修复 Exams 表...');
  const { data: exams, error: eErr } = await supabase.from('exams').select('id, image_url');
  if (eErr) {
    console.error('获取 exams 失败:', eErr);
    return;
  }

  let eUpdated = 0;
  for (const e of exams) {
    if (e.image_url && typeof e.image_url === 'string' && e.image_url.includes(CLOUD_PREFIX)) {
      const newUrl = e.image_url.replace(CLOUD_PREFIX, LOCAL_PREFIX);
      await supabase.from('exams').update({ image_url: newUrl }).eq('id', e.id);
      eUpdated++;
    }
  }
  console.log(`✅ Exams 表修复完成，共更新 ${eUpdated} 条记录。`);

  console.log('🎉 所有图片链接已在本地数据库中修复为本地相对路径！');
}

fixDatabaseImageUrls();
