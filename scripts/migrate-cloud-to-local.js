import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetch, ProxyAgent } from 'undici';
import dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURATION ---
const CLOUD_URL = 'https://zrocwujtcgehsqsrwptc.supabase.co';
// Use the old Cloud Service Role Key to bypass RLS on the source database
const CLOUD_SERVICE_KEY = process.env.CLOUD_SERVICE_KEY || ''; 
const PROXY_URL = 'http://127.0.0.1:7897';

const LOCAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const LOCAL_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000000';

if (!LOCAL_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

// --- INITIALIZATION ---
// --- INITIALIZATION ---
async function getCloudClient() {
  let dispatcher = null;
  if (PROXY_URL) {
    try {
      console.log(`🔌 Checking proxy: ${PROXY_URL}`);
      const testRes = await fetch('http://127.0.0.1:7897', { method: 'HEAD', signal: AbortSignal.timeout(1000) }).catch(() => null);
      if (testRes) {
        console.log('✅ Proxy is responsive.');
        dispatcher = new ProxyAgent(PROXY_URL);
      } else {
        console.warn('⚠️ Proxy is not responsive, will try direct connection.');
      }
    } catch (e) {
      console.warn('⚠️ Proxy check failed, using direct connection.');
    }
  }

  const cloudFetch = (url, options) => {
    const fetchOptions = { ...options };
    if (dispatcher) fetchOptions.dispatcher = dispatcher;
    };

const CLOUD_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 

  return createClient(CLOUD_URL, CLOUD_KEY, {
    global: { fetch: cloudFetch }
  });
}

const PUBLIC_EXAM_DIR = path.join(__dirname, '..', 'public', 'exam-images');
const DEFAULT_USER_DIR = path.join(PUBLIC_EXAM_DIR, DEFAULT_USER_ID);

async function migrate() {
  const local = createClient(LOCAL_URL, LOCAL_SERVICE_KEY);
  const cloud = await getCloudClient();
  
  console.log('🚀 Starting Data Migration (Local-First Sync)');
  console.log(`👤 Mapping all data to Default User: ${DEFAULT_USER_ID}`);

  try {
    // Authenticate with user credentials to bypass RLS for personal data
    console.log('\n🔐 Authenticating with Cloud Supabase...');
    const { data: authData, error: authErr } = await cloud.auth.signInWithPassword({
      email: 'sjtulinhua@126.com',
      password: '111111'
    });

    if (authErr) {
      throw new Error(`Cloud Authentication Failed: ${authErr.message}`);
    }
    console.log('✅ Authenticated as:', authData.user.email);
    
    // We will use the user's actual ID for finding files or replacing image references
    const cloudUserId = authData.user.id;
    // 1. Reorganize local images
    console.log('\n📁 Reorganizing local images...');
    if (!fs.existsSync(DEFAULT_USER_DIR)) fs.mkdirSync(DEFAULT_USER_DIR, { recursive: true });

    if (fs.existsSync(PUBLIC_EXAM_DIR)) {
      const folders = fs.readdirSync(PUBLIC_EXAM_DIR);
      for (const folder of folders) {
        const folderPath = path.join(PUBLIC_EXAM_DIR, folder);
        if (fs.lstatSync(folderPath).isDirectory() && folder !== DEFAULT_USER_ID) {
          console.log(`📦 Merging folder ${folder} into ${DEFAULT_USER_ID}`);
          const files = fs.readdirSync(folderPath);
          for (const file of files) {
            const oldPath = path.join(folderPath, file);
            const newPath = path.join(DEFAULT_USER_DIR, file);
            if (!fs.existsSync(newPath)) {
              fs.renameSync(oldPath, newPath);
            }
          }
          // Optionally remove empty folder
          // fs.rmdirSync(folderPath); 
        }
      }
    }
    console.log('✅ Local images reorganized.');

    // Function to fix record paths
    const fixPaths = (obj) => {
        if (!obj) return obj;
        let str = JSON.stringify(obj);
        // Replace any mention of old UUID formats in paths if necessary
        // But mainly we map user_id
        return JSON.parse(str);
    };

    // 2. Sync Exams
    console.log('\n📦 Syncing: Exams...');
    const { data: cloudExams, error: eErr } = await cloud.from('exams').select('*');
    if (eErr) throw eErr;
    let examCount = 0;
    for (const exam of cloudExams) {
      const oldId = exam.user_id;
      const fixedExam = {
          ...exam,
          user_id: DEFAULT_USER_ID,
          image_url: exam.image_url ? exam.image_url.replace(oldId, DEFAULT_USER_ID) : exam.image_url
      };
      const { data, error } = await local.from('exams').upsert(fixedExam).select();
      if (error) {
         console.error(`💥 Upsert failed for exam ${exam.id}:`, error);
      } else {
         examCount++;
      }
    }
    console.log(`✅ ${examCount} exams synced.`);

    // 3. Sync Questions
    console.log('\n📦 Syncing: Questions...');
    const { data: cloudQs, error: qErr } = await cloud.from('questions').select('*');
    if (qErr) throw qErr;
    let questionCount = 0;
    for (const q of cloudQs) {
        const oldId = q.user_id;
        const fixedQ = {
            ...q,
            user_id: DEFAULT_USER_ID,
            // Update image paths in JSON array if they contain the old user ID
            images: Array.isArray(q.images) 
                ? q.images.map(img => typeof img === 'string' ? img.replace(oldId, DEFAULT_USER_ID) : img)
                : q.images
        };
        const { data, error } = await local.from('questions').upsert(fixedQ).select();
        if (error) {
           console.error(`💥 Upsert failed for question ${q.id}:`, error);
        } else {
           questionCount++;
        }
    }
    console.log(`✅ ${questionCount} questions synced.`);

    // 4. Sync Mistakes
    console.log('\n📦 Syncing: Mistakes...');
    const { data: cloudMs, error: mErr } = await cloud.from('mistakes').select('*');
    if (mErr) throw mErr;
    let mistakeCount = 0;
    for (const m of cloudMs) {
        const fixedM = {
           id: m.id,
           question_id: m.question_id,
           user_id: DEFAULT_USER_ID,
           status: m.status,
           created_at: m.created_at
        };
        const { data, error } = await local.from('mistakes').upsert(fixedM).select();
        if (error) {
           console.error(`💥 Upsert failed for mistake ${m.id}:`, error);
        } else {
           mistakeCount++;
           if (mistakeCount === 1) console.log('Sample verified insert:', data);
        }
    }
    console.log(`✅ ${mistakeCount} mistakes synced.`);

    // 5. Sync Knowledge Base
    console.log('\n📦 Syncing: Knowledge Base...');
    const { data: cloudKB, error: kbErr } = await cloud.from('knowledge_base').select('*');
    if (!kbErr && cloudKB) {
        for (const kb of cloudKB) await local.from('knowledge_base').upsert(kb);
        console.log(`✅ ${cloudKB.length} KB entries synced.`);
    }

    console.log('\n✨ MIGRATION SUCCESSFUL! ✨');
    console.log('You can now run "npm run dev" to see your cloud data locally.');

  } catch (err) {
    console.error('\n💥 Migration logic failed:', err);
  }
}

migrate();
