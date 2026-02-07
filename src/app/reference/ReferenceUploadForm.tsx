"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, CheckCircle2, FileType } from "lucide-react";

export default function ReferenceUploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => ["application/pdf", "image/jpeg", "image/png"].includes(f.type));
      
      if (validFiles.length !== selectedFiles.length) {
        alert("部分文件格式不支持，已自动过滤。目前支持 PDF 和图片格式。");
      }
      
      if (validFiles.length > 0) {
        setFiles(validFiles);
        setUploadStatus("idle");
        setMessage("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus("idle");
    setMessage("");

    const formData = new FormData();
    files.forEach(f => {
      formData.append("files", f);
    });
    
    // 生成默认描述
    const defaultDesc = files[0].name.split('.')[0] + (files.length > 1 ? ` 等${files.length}个文件` : "");
    formData.append("description", description || defaultDesc);
    formData.append("subject", "math");

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
        setMessage(result.message || "上传成功！数据已加入基准库。");
        setFiles([]);
        setDescription("");
        router.refresh();
      }
    } catch (error) {
      setUploadStatus("error");
      setMessage("上传过程中发生网络或系统错误");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          批量上传基准资料
        </CardTitle>
        <CardDescription>
          支持同时选择多张图片或 PDF 试卷。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              files.length > 0 ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              accept=".pdf,image/png,image/jpeg"
              multiple
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer block space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                {files.length > 0 ? (
                  <FileText className="w-6 h-6 text-primary" />
                ) : (
                  <FileType className="w-6 h-6 text-muted-foreground" />
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
                    <div className="font-medium text-foreground">点击或拖拽文件到此处</div>
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
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">资料描述 (如：2024厦门中考数学)</label>
                <input 
                  type="text" 
                  className="w-full bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                  placeholder="给这组题目起个名字"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "正在解析并入库 (可能需要几十秒)..." : "确认开始收录"}
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
      </CardContent>
    </Card>
  );
}
