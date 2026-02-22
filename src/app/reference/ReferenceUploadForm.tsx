"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, FileType, CheckCircle2 } from "lucide-react";
import { ALL_SUBJECTS } from "@/lib/subjects";

export default function ReferenceUploadForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState<"merge" | "separate">("merge");
  const [subject, setSubject] = useState("math");

  const processFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(f => ["application/pdf", "image/jpeg", "image/png"].includes(f.type));
    
    if (validFiles.length !== selectedFiles.length) {
      alert("部分文件格式不支持，已自动过滤。目前支持 PDF 和图片格式。");
    }
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
      setUploadStatus("idle");
      setMessage("");
      
      // Auto-detect best mode
      const hasImages = validFiles.some(f => f.type.startsWith("image/"));
      if (validFiles.length > 1 && !hasImages) {
        setUploadMode("separate"); // Default to separate for multiple PDFs
      } else {
        setUploadMode("merge"); // Force merge for images or single file
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    let successCount = 0;
    let failCount = 0;

    setIsUploading(true);
    setUploadStatus("idle");
    setMessage("");

    // --- SEPARATE MODE (Multiple PDFs) ---
    if (uploadMode === "separate") {
      const errors: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setMessage(`正在处理 ${i + 1}/${files.length}: ${file.name}...`);
        
        const formData = new FormData();
        formData.append("files", file);
        formData.append("description", file.name.split('.')[0]); 
        formData.append("subject", subject); 

        try {
          const response = await fetch("/api/admin/upload-reference", {
            method: "POST",
            body: formData,
          });
          const result = await response.json();
          
          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            errors.push(`${file.name}: ${result.error || "服务器错误"}`);
          }
        } catch(error) {
          failCount++;
          errors.push(`${file.name}: 网络错误`);
        }
      }
      
      setIsUploading(false);
      
      if (failCount === 0) {
        setUploadStatus("success");
        setMessage(`成功批量录入 ${successCount} 份独立真题！数据已加入库。`);
        setFiles([]);
        setDescription("");
        router.refresh();
        if (onSuccess) onSuccess();
      } else {
        setUploadStatus("error");
        setMessage(`${successCount}份成功上传，${failCount}份失败。\n${errors.slice(0, 2).join("\n")}${errors.length > 2 ? "\n..." : ""}`);
      }
      return;
    }

    // --- MERGE MODE (Single Exam) ---
    const formData = new FormData();
    files.forEach(f => {
      formData.append("files", f);
    });
    
    // 生成默认描述
    const defaultDesc = files[0].name.split('.')[0] + (files.length > 1 ? ` 等${files.length}个文件` : "");
    formData.append("description", description || defaultDesc);
    formData.append("subject", subject);

    try {
      const response = await fetch("/api/admin/upload-reference", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setUploadStatus("error");
        setMessage(result.error || "上传失败");
      } else {
        setUploadStatus("success");
        setMessage(result.message || "上传成功！数据已加入真题库。");
        setFiles([]);
        setDescription("");
        router.refresh();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      setUploadStatus("error");
      setMessage("上传过程中发生网络或系统错误");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          上传真题
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          支持同时选择多张图片或 PDF 试卷。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div 
          className={
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer " +
            (isDragging 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : files.length > 0 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50")
          }
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".pdf,image/png,image/jpeg"
            multiple
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer block space-y-4 w-full h-full">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? "bg-primary text-white" : "bg-primary/10"
            }`}>
              {files.length > 0 ? (
                <FileText className={`w-6 h-6 ${isDragging ? "text-white" : "text-primary"}`} />
              ) : (
                <FileType className={`w-6 h-6 ${isDragging ? "text-white" : "text-muted-foreground"}`} />
              )}
            </div>
            <div>
              {files.length > 0 ? (
                <div className="font-medium text-foreground">
                  已选择 {files.length} 个文件
                  <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px] mx-auto">
                    {files.map(f => f.name).join(", ")}
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-medium text-foreground">
                    {isDragging ? "松开鼠标即可上传" : "点击或拖拽文件到此处"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">支持多选 PDF / PNG / JPG</div>
                </>
              )}
            </div>
          </label>
        </div>

        {files.length === 0 && (
          <div className="flex items-start gap-3 p-3 text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg border border-yellow-500/20">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Word 文档注意事项</strong>
              <p className="mt-1 opacity-90 text-xs text-left">
                为了防止数学公式乱码，请务必将在 Word 中“另存为 PDF”后再上传。
              </p>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-medium block">所属科目</label>
              <div className="flex flex-wrap bg-muted/40 p-1 rounded-lg gap-1 border">
                {ALL_SUBJECTS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSubject(s.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${subject === s.value ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Toggle (only show if multiple files and NO images) */}
            {files.length > 1 && !files.some(f => f.type.startsWith('image/')) && (
                <div className="space-y-3">
                  <label className="text-sm font-medium block">资料类型模式检测为多个文档，您希望：</label>
                  <div className="flex bg-muted/40 p-1 rounded-lg gap-1 border">
                    <button
                      type="button"
                      onClick={() => setUploadMode("separate")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === "separate" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      作为 {files.length} 份独立试卷
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("merge")}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === "merge" ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      合并为 1 份完整试卷
                    </button>
                  </div>
                </div>
            )}

            {uploadMode === "merge" && (
              <div className="animate-in fade-in slide-in-from-top-1">
                <label className="text-sm font-medium mb-1 block">资料描述 (如：2024厦门中考数学)</label>
                <input 
                  type="text" 
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="给这组合并且成的一份试卷起个名字"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}
            
            {uploadMode === "separate" && (
              <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border max-h-[160px] overflow-y-auto animate-in fade-in slide-in-from-top-1 scrollbar-none">
                <p className="mb-2 font-medium text-foreground">将自动使用以下文件名分批建档：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {files.map(f => (
                    <li key={f.name} className="truncate" title={f.name}>{f.name.split('.')[0]}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
              {isUploading ? (uploadMode === "separate" ? message || "正在批量处理中..." : "正在解析并入库 (可能需要几十秒)...") : `确定开始收录 (${uploadMode === "separate" ? `${files.length} 份` : "1 份"})`}
            </Button>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4" />
            {message}
          </div>
        )}
        
        {uploadStatus === "error" && (
          <div className="flex items-center gap-2 text-red-600 bg-red-500/10 p-3 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
