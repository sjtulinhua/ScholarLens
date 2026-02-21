import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Use undici's fetch with ProxyAgent which is available in Node 18+
import { fetch, ProxyAgent } from 'undici';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloud Supabase credentials
const SUPABASE_URL = 'https://zrocwujtcgehsqsrwptc.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
const PROXY_URL = 'http://127.0.0.1:7897';

console.log(`🔌 设置本地代理: ${PROXY_URL}`);
const dispatcher = new ProxyAgent(PROXY_URL);

// Create a custom fetch that uses the proxy
const customFetch = (url, options) => {
  return fetch(url, { ...options, dispatcher });
};

// @ts-ignore
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { fetch: customFetch }
});

const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'exam-images');

async function downloadImages() {
  console.log('🔄 开始从云端拉取图片到本地...');
  
  const { data: folders, error: folderError } = await supabase.storage.from('exam-images').list();

  if (folderError) {
    console.error('获取目录失败:', folderError);
    return;
  }

  let totalDownloaded = 0;

  for (const folder of folders) {
    if (folder.name === '.emptyFolderPlaceholder') continue;
    
    const userId = folder.name;
    const userDir = path.join(PUBLIC_DIR, userId);
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    console.log(`\n📂 扫描用户目录: ${userId}`);

    const { data: files, error: filesError } = await supabase.storage.from('exam-images').list(userId);

    if (filesError) {
      console.error(`无法读取目录 ${userId}:`, filesError);
      continue;
    }

    for (const file of files) {
      if (file.name === '.emptyFolderPlaceholder' || !file.created_at) continue;

      const remotePath = `${userId}/${file.name}`;
      const localFilePath = path.join(userDir, file.name);

      if (fs.existsSync(localFilePath)) {
        console.log(`⏭️ 跳过已存在: ${file.name}`);
        continue;
      }

      console.log(`⬇️ 下载中: ${file.name} ...`);

      const { data: fileData, error: downloadError } = await supabase.storage.from('exam-images').download(remotePath);

      if (downloadError) {
        console.error(`❌ 下载失败: ${file.name}`, downloadError);
        continue;
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      fs.writeFileSync(localFilePath, buffer);
      console.log(`✅ 成功保存: ${file.name}`);
      totalDownloaded++;
    }
  }

  console.log(`\n🎉 迁移完成！共下载了 ${totalDownloaded} 张新图片。`);
  console.log(`图片已保存在: ${PUBLIC_DIR}`);
}

downloadImages();
