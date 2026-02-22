"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { FileText, Clock, GraduationCap, BookOpen, Database, Filter, BrainCircuit, X, Plus, Check, Trash2, Settings2, UploadCloud, Layers3 } from "lucide-react";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { addReferenceToMistakes, deleteReferenceSource, deleteReferenceSources } from "./actions";
import { DifficultyDistribution } from "@/components/reference/DifficultyDistribution";
import ReferenceUploadForm from "./ReferenceUploadForm";
import { ALL_SUBJECTS_WITH_ALL } from "@/lib/subjects";

interface ReferenceItem {
  id: string;
  content: string;
  official_year: string | null;
  subject: string;
  difficulty: number;
  created_at: string;
  meta_data?: any;
  knowledge_points?: string[];
  images?: string[];
  analysis?: string;
  question_type?: string;
}

export function ReferenceListView({ 
  initialItems, 
  userMistakes 
}: { 
  initialItems: ReferenceItem[];
  userMistakes: { difficulty: number }[];
}) {
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [minDifficulty, setMinDifficulty] = useState(0);
  // Compute distinct paper count (based on official_year / source)
  const paperCount = useMemo(() => {
    const set = new Set(initialItems.map(item => item.official_year || '未分类来源'));
    return set.size;
  }, [initialItems]);
  const [isAdding, setIsAdding] = useState(false);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  const router = useRouter();
  
  // Batch Management for Sources
  const [isManagingSources, setIsManagingSources] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingSource, setIsDeletingSource] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const toggleSourceSelection = (source: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedSources);
    if (newSet.has(source)) newSet.delete(source);
    else newSet.add(source);
    setSelectedSources(newSet);
  };

  const handleDeleteSelectedSources = async () => {
    if (selectedSources.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedSources.size} 份试卷吗？\n试卷下的所有题目将被永久删除，操作不可恢复！`)) return;
    
    setIsDeleting(true);
    const result = await deleteReferenceSources(Array.from(selectedSources));
    setIsDeleting(false);
    
    if (result.error) alert(result.error);
    else {
      setSelectedSources(new Set());
      setIsManagingSources(false);
      router.refresh();
    }
  };

  const handleDeleteSource = async (source: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent accordion toggle
    if (!confirm(`警告：确定要删除整份《${source}》的数据吗？\n该试卷下的所有题目（共 ${groupedItems[source]?.length || 0} 题）将被永久删除，操作不可恢复！`)) return;
    
    setIsDeletingSource(source);
    const result = await deleteReferenceSource(source);
    setIsDeletingSource(null);
    
    if (result.error) {
      alert(result.error);
    } else {
      setSelectedItem(null);
      router.refresh();
    }
  };

  // 1. 综合过滤：科目 + 难度
  const filteredItems = useMemo(() => {
    let res = initialItems;
    
    // 科目过滤
    if (activeTab !== "all") {
      res = res.filter(item => item.subject === activeTab);
    }
    
    // 难度过滤
    if (minDifficulty > 0) {
      res = res.filter(item => item.difficulty >= minDifficulty);
    }
    
    return res;
  }, [initialItems, activeTab, minDifficulty]);

  // 2. 按“来源/年份”分组
  const groupedItems = useMemo(() => {
    const groups: Record<string, ReferenceItem[]> = {};
    filteredItems.forEach(item => {
      const source = item.official_year || "未分类来源";
      if (!groups[source]) groups[source] = [];
      groups[source].push(item);
    });
    // 排序：按时间或名称，这里保持当前顺序
    return groups;
  }, [filteredItems]);

  const subjects = ALL_SUBJECTS_WITH_ALL;

  const groupedKeys = Object.keys(groupedItems);

  const handleAddToMistakes = async (id: string) => {
    setIsAdding(true);
    const result = await addReferenceToMistakes(id);
    setIsAdding(false);
    
    if (result.error) {
      alert(`添加失败: ${result.error}`);
    } else {
      setAddedItems(prev => new Set(prev).add(id));
      // alert("该题目已加入您的错题本。"); // Silently succeed structurally, or visually obvious via button state change
    }
  };

  const uploadModal = (
    <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 border-0 bg-transparent shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>上传真题</DialogTitle>
          <DialogDescription>
            上传往届中考真题或高质量模拟卷，ScholarLens 的 AI 将自动为您建立能力基准线。
          </DialogDescription>
        </DialogHeader>
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-zinc-100">
          <ReferenceUploadForm onSuccess={() => setIsUploadModalOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );

  if (initialItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 bg-white rounded-2xl border border-zinc-200/50 shadow-sm p-12">
        <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-sm">
          <UploadCloud className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">真题库空空如也</h2>
          <p className="text-zinc-500 max-w-sm mx-auto">
            上传往届中考真题或高质量模拟卷，ScholarLens 的 AI 将自动为您建立能力基准线。
          </p>
        </div>
        
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-sm px-8" onClick={() => setIsUploadModalOpen(true)}>
          立即上传真题
        </Button>
        {uploadModal}
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white min-h-screen text-zinc-900 rounded-2xl p-8 border border-zinc-200/50 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
        <h2 className="text-xl font-bold text-zinc-800 hidden md:block">题库资源</h2>
        <div className="flex items-center gap-3 ml-auto">
            <Button 
                variant="default" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                onClick={() => setIsUploadModalOpen(true)}
            >
                <UploadCloud className="w-4 h-4 mr-2" />
                上传真题
            </Button>
        </div>
      </div>

      {/* Global Difficulty Legend */}
      <div className="bg-zinc-50/50 border border-zinc-100 rounded-lg px-4 py-3 flex flex-wrap items-center gap-6">
        <span className="text-xs font-bold text-zinc-700 uppercase tracking-widest font-mono hidden sm:block">
          图例说明 / Legend
        </span>
        <div className="w-px h-4 bg-zinc-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-emerald-400" />
          <span className="text-xs font-medium text-zinc-600">基础题 (1-2星)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-blue-400" />
          <span className="text-xs font-medium text-zinc-600">中档题 (3星)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm bg-orange-500" />
          <span className="text-xs font-medium text-zinc-600">压轴题 (4-5星)</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col gap-4">
          {/* Row 1: Subjects Tabs (Full Width, Wrap if needed) */}
          <div className="flex items-center">
            <TabsList className="w-full flex-wrap justify-start h-auto p-1 bg-zinc-50 border border-zinc-200 rounded-lg inline-flex">
              {subjects.map((s) => (
                <TabsTrigger
                  key={s.value}
                  value={s.value}
                  className="px-3 py-1.5 rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm text-zinc-500 hover:text-zinc-700 transition-all whitespace-nowrap"
                >
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Row 2: Controls (Aligned to Right) */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-50 pt-3">
            <div className="flex-1 hidden sm:block">
              <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-tighter uppercase">
                <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-tighter uppercase">
  <span className="text-2xl font-extrabold text-amber-600 mr-1">{initialItems.length}</span>参考题 |
  <span className="text-2xl font-extrabold text-amber-600 ml-1 mr-1">{paperCount}</span>试卷
</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className={`h-8 px-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 border border-transparent hover:border-zinc-200 rounded-lg ${minDifficulty > 0 ? "text-blue-600 bg-blue-50 border-blue-100" : ""}`}>
                    <Filter className="w-3 h-3 mr-2" /> 
                    <span className="text-[11px] font-medium">{minDifficulty > 0 ? `难度 ≥ ${minDifficulty}` : "难度筛选"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white p-1">
                  <DropdownMenuLabel className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest px-2 py-1.5">筛选难度</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-100" />
                  <DropdownMenuItem className="text-xs rounded-md" onClick={() => setMinDifficulty(0)}>
                    全部难度
                    {minDifficulty === 0 && <Check className="ml-auto w-3.5 h-3.5 text-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs rounded-md" onClick={() => setMinDifficulty(3)}>
                    只看中等 (≥3)
                    {minDifficulty === 3 && <Check className="ml-auto w-3.5 h-3.5 text-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs rounded-md" onClick={() => setMinDifficulty(4)}>
                    只看困难 (≥4)
                    {minDifficulty === 4 && <Check className="ml-auto w-3.5 h-3.5 text-blue-500" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs rounded-md" onClick={() => setMinDifficulty(5)}>
                    只看压轴 (5)
                    {minDifficulty === 5 && <Check className="ml-auto w-3.5 h-3.5 text-blue-500" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-8 px-3 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/50 border border-transparent hover:border-zinc-200 rounded-lg ${isManagingSources ? "bg-zinc-100 text-zinc-900 border-zinc-200" : ""}`}
                  onClick={() => {
                    setIsManagingSources(!isManagingSources);
                    if (isManagingSources) setSelectedSources(new Set());
                  }}
              >
                  <Settings2 className="w-3 h-3 mr-2" />
                  <span className="text-[11px] font-medium">{isManagingSources ? "退出管理" : "批量管理"}</span>
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value={activeTab} className="space-y-6 focus-visible:outline-none pt-2">
          {groupedKeys.length === 0 ? (
            <div className="text-center py-32 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 text-zinc-400 font-mono text-xs uppercase tracking-[0.2em]">
              Data Not Available
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {groupedKeys.map((source) => (
                <AccordionItem
                  key={source}
                  value={source}
                  className="relative border border-zinc-200 rounded-xl bg-white overflow-hidden transition-all hover:border-zinc-300 shadow-sm group hover:shadow-md"
                >
                  <AccordionTrigger 
                    className="hover:no-underline py-0 px-4 md:px-6 text-left items-start flex-1 [&>svg]:hidden"
                    onClick={(e) => {
                       if (isManagingSources) {
                         e.preventDefault();
                         toggleSourceSelection(source, e);
                       }
                    }}
                  >
                    <div className="flex flex-col gap-4 w-full py-4 md:py-5">
                      {/* Title Row */}
                      <div className="flex items-center gap-4 w-full">
                        {isManagingSources && (
                          <div className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                            selectedSources.has(source) ? "bg-blue-500 border-blue-500 text-white" : "border-zinc-300 bg-white"
                          }`}>
                            {selectedSources.has(source) && <Check className="w-3 h-3" />}
                          </div>
                        )}
                        <span className="text-base md:text-lg font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors leading-tight break-words pr-12 w-full">
                          {source}
                        </span>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                        <div className="flex flex-col gap-1.5 text-[10px] text-zinc-400 font-mono uppercase tracking-wider min-w-[120px]">
                           <div className="flex items-center gap-1.5 bg-zinc-50 px-2 py-1 rounded w-fit">
                             <FileText className="w-3 h-3" />
                             <span className="text-zinc-600 font-bold">{groupedItems[source].length}</span>
                             <span>Questions</span>
                           </div>
                           <div className="flex items-center gap-1.5 px-2">
                             <Clock className="w-3 h-3" />
                             <span>Updated {new Date(groupedItems[source][0]?.created_at).toLocaleDateString()}</span>
                           </div>
                        </div>

                        {/* Difficulty Profile Area - Stretched to fill space */}
                        <div className="hidden md:block flex-1 md:max-w-[500px] lg:max-w-[650px]">
                          <DifficultyDistribution 
                            questions={groupedItems[source]} 
                            userMistakes={userMistakes} 
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  {/* Desktop Hover Trash Icon */}
                  {!isManagingSources && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 hover:bg-neutral-100/50 h-8 w-8 rounded-full transition-all opacity-0 group-hover:opacity-100 hidden md:flex z-10"
                      disabled={isDeletingSource === source}
                      title="删除整卷"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSource(source, e);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Mobile Mobile/Tablet Trash Icon */}
                  {!isManagingSources && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="md:hidden absolute top-4 right-4 text-zinc-400 hover:text-red-500 h-8 w-8 z-10"
                      disabled={isDeletingSource === source}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSource(source, e);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}


                  <AccordionContent className="pt-4 pb-6 border-t border-zinc-100 mt-4">
                    <div className="md:hidden mb-6">
                      <DifficultyDistribution 
                         questions={groupedItems[source]} 
                         userMistakes={userMistakes} 
                       />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedItems[source].map((item) => (
                        <Card
                          key={item.id}
                          className="bg-zinc-50/50 border-zinc-200/60 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all hover:-translate-y-0.5"
                          onClick={() => setSelectedItem(item)}
                        >
                          <CardHeader className="p-4 space-y-2">
                             <div className="flex justify-between items-start">
                                <Badge variant="outline" className="bg-white border-zinc-200 text-zinc-500 font-mono text-[10px] uppercase font-normal tracking-wide">
                                  难度 {item.difficulty}
                                </Badge>
                                {item.meta_data?.question_type && (
                                  <span className="text-[10px] text-zinc-400 font-medium">
                                    {item.meta_data.question_type}
                                  </span>
                                )}
                             </div>
                             <div className="text-sm font-medium text-zinc-800 h-[4.5em] overflow-hidden relative">
                               <LatexRenderer 
                                 content={item.content} 
                                 className="[&_p]:m-0 [&_p]:inline pointer-events-none" // Force inline style for preview
                               />
                               {/* Fade overlay for truncate effect */}
                               <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none" />
                             </div>
                             {/* Knowledge Tag with new design */}
                             <div className="pt-2">
                                {item.knowledge_points?.[0] && (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded text-[10px] text-zinc-600 font-medium border border-zinc-200/50">
                                     <div className="w-1 h-1 rounded-full bg-blue-500" />
                                     {item.knowledge_points[0]}
                                  </div>
                                )}
                             </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl h-[90vh] md:h-[85vh] w-[95vw] md:w-full flex flex-col p-0 overflow-hidden bg-white border-zinc-200 shadow-2xl rounded-2xl mx-auto">
           <DialogTitle className="sr-only">Question Detail</DialogTitle>
           {selectedItem && (
             <div className="flex flex-col md:flex-row h-full">
                {/* Left: Content (Mobile: Order 2) */}
                <div className="md:w-2/3 h-full overflow-y-auto p-6 md:p-10 bg-white order-2 md:order-1">
                   <div className="mb-6 md:mb-8 flex items-center gap-3">
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100 whitespace-nowrap">
                         Reference ID: {selectedItem.id.slice(0, 8)}
                      </div>
                      <div className="text-zinc-400 text-xs uppercase tracking-wider font-mono hidden sm:block">
                        Vector Distance: 0.00
                      </div>
                   </div>
                   <div className="prose prose-zinc max-w-none">
                      <div className="text-lg md:text-xl font-bold text-zinc-900 mb-6 leading-relaxed">
                        <LatexRenderer content={selectedItem.content} />
                      </div>

                      {selectedItem.images && selectedItem.images.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                           {selectedItem.images.map((img, i) => (
                             <div key={i} className="relative aspect-[4/3] bg-zinc-50 rounded-lg overflow-hidden border border-zinc-100">
                                <img src={img} className="object-contain w-full h-full" alt="Question" />
                             </div>
                           ))}
                        </div>
                      )}

                      <div className="mt-8 pt-8 border-t border-zinc-100">
                         <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <BrainCircuit className="w-4 h-4 text-blue-600" />
                           AI Analysis
                         </h4>
                         <div className="bg-zinc-50 p-4 md:p-6 rounded-xl border border-zinc-100 text-sm leading-7 text-zinc-700">
                            {selectedItem.analysis ? (
                              <LatexRenderer content={selectedItem.analysis} />
                            ) : (
                              "No analysis available."
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Right: Meta & Stats (Mobile: Order 1) */}
                <div className="md:w-1/3 h-auto md:h-full border-b md:border-b-0 md:border-l border-zinc-200 bg-zinc-50/50 p-6 md:p-8 flex flex-col gap-4 md:gap-6 order-1 md:order-2 shrink-0">
                   <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3 md:mb-4">Metadata</h4>
                      <div className="space-y-2 md:space-y-3">
                         <div className="flex justify-between py-2 border-b border-zinc-100">
                            <span className="text-xs text-zinc-500">Subject</span>
                            <span className="text-xs font-semibold text-zinc-900 capitalize">{selectedItem.subject}</span>
                         </div>
                         <div className="flex justify-between py-2 border-b border-zinc-100">
                           <span className="text-xs text-zinc-500">Year/Source</span>
                           <span className="text-xs font-semibold text-zinc-900">{selectedItem.official_year || "N/A"}</span>
                         </div>
                         <div className="flex justify-between py-2 border-b border-zinc-100">
                           <span className="text-xs text-zinc-500">Difficulty</span>
                           <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-1.5 h-3 rounded-sm ${i < selectedItem.difficulty ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                              ))}
                           </div>
                         </div>
                      </div>
                   </div>

                   <div>
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-3 md:mb-4">Knowledge Points</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.knowledge_points?.map((kp, i) => (
                          <Badge key={i} variant="secondary" className="bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
                            {kp}
                          </Badge>
                        ))}
                      </div>
                   </div>

                   <div className="mt-auto hidden md:flex flex-col gap-2">
                      <Button 
                        variant={addedItems.has(selectedItem.id) ? "outline" : "default"}
                        className={`w-full shadow-sm transition-all ${addedItems.has(selectedItem.id) ? "text-green-600 border-green-200 bg-green-50" : "bg-blue-600 text-white hover:bg-blue-700"}`} 
                        onClick={() => !addedItems.has(selectedItem.id) && handleAddToMistakes(selectedItem.id)}
                        disabled={isAdding || addedItems.has(selectedItem.id)}
                      >
                        {isAdding ? (
                          "添加中..."
                        ) : addedItems.has(selectedItem.id) ? (
                          <>
                            <Check className="w-4 h-4 mr-2" /> 已加入错题录
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" /> 快捷加入错题录
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" className="w-full text-zinc-500 hover:text-zinc-900 transition-all mt-4" onClick={() => setSelectedItem(null)}>
                         Close Detail View
                      </Button>
                   </div>
                   
                   {/* Mobile Close Button */}
                    <div className="md:hidden absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-500" onClick={() => setSelectedItem(null)}>
                            <span className="font-bold">×</span>
                        </Button>
                    </div>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>

      {/* 批量管理试卷底部操作栏 */}
      {isManagingSources && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom-full">
          <div className="flex items-center gap-4 max-w-5xl mx-auto w-full px-4 md:px-8">
            <span className="text-sm font-medium text-zinc-600">
              已选择 <span className="text-blue-600 font-bold">{selectedSources.size}</span> 卷
            </span>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => {
              setIsManagingSources(false);
              setSelectedSources(new Set());
            }}>
              取消
            </Button>
            <Button 
              variant="destructive" 
              disabled={selectedSources.size === 0 || isDeleting}
              onClick={handleDeleteSelectedSources}
              className="gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "删除中..." : `删除选中试卷 (${selectedSources.size})`}
            </Button>
          </div>
        </div>
      )}

      {uploadModal}
    </div>
  );
}

