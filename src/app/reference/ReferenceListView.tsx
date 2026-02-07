"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileText, Clock, GraduationCap, ChevronRight, BookOpen, Database, Filter, BrainCircuit } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

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
  error_analysis?: string;
  question_type?: string;
}

export function ReferenceListView({ initialItems }: { initialItems: ReferenceItem[] }) {
  const [selectedItem, setSelectedItem] = useState<ReferenceItem | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // 1. 按科目过滤
  const filteredItems = useMemo(() => {
    if (activeTab === "all") return initialItems;
    return initialItems.filter(item => item.subject === activeTab);
  }, [initialItems, activeTab]);

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

  const subjects = [
    { value: "all", label: "全部" },
    { value: "math", label: "数学" },
    { value: "physics", label: "物理" },
    { value: "chemistry", label: "化学" },
  ];

  const groupedKeys = Object.keys(groupedItems);

  return (
    <div className="space-y-8 bg-white min-h-screen text-zinc-900 rounded-2xl p-8 border border-zinc-200/50 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
               <Database className="w-4 h-4" />
             </div>
             基准参考库
           </h2>
           <p className="text-zinc-500 font-mono text-[10px] mt-2 uppercase tracking-wider pl-10">
             Reference Knowledge Base / Vectorized
           </p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50">
               <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <div className="h-4 w-px bg-zinc-200" />
            <span className="text-xs font-mono text-zinc-400">
               {initialItems.length} ITEMS
            </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-none">
          <TabsList className="w-full md:w-auto justify-start h-auto p-1 bg-zinc-50 border border-zinc-200 rounded-lg inline-flex min-w-full md:min-w-0">
            {subjects.map((subject) => (
              <TabsTrigger
                key={subject.value}
                value={subject.value}
                className="flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-md text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm text-zinc-500 hover:text-zinc-700 transition-all font-sans whitespace-nowrap"
              >
                {subject.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="space-y-6 focus-visible:outline-none">
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
                  className="border border-zinc-200 rounded-xl bg-white overflow-hidden px-4 md:px-6 transition-all hover:border-zinc-300 shadow-sm group hover:shadow-md"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:py-5 gap-4">
                     <div className="flex flex-col gap-1">
                        <AccordionTrigger className="hover:no-underline py-0 text-base md:text-lg font-semibold text-zinc-800 group-hover:text-blue-600 transition-colors text-left">
                          {source}
                        </AccordionTrigger>
                        <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider flex items-center gap-2">
                           <span>{groupedItems[source].length} Questions</span>
                           <span className="w-1 h-1 rounded-full bg-zinc-300" />
                           <span>Updated {new Date().toLocaleDateString()}</span>
                        </div>
                     </div>
                     {/* Visual Indicator of items */}
                     <div className="flex -space-x-1 pl-1 md:pl-0 md:mr-4">
                        {groupedItems[source].slice(0, 4).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[8px] text-zinc-400 ring-1 ring-zinc-200">
                             Q{i+1}
                          </div>
                        ))}
                        {groupedItems[source].length > 4 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white bg-zinc-50 flex items-center justify-center text-[8px] text-zinc-400">
                            +
                          </div>
                        )}
                     </div>
                  </div>

                  <AccordionContent className="pt-2 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {groupedItems[source].map((item) => (
                        <Card
                          key={item.id}
                          className="bg-zinc-50/50 border border-zinc-200/60 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all hover:-translate-y-0.5"
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
                             <p className="text-sm font-medium text-zinc-800 line-clamp-3 leading-relaxed">
                               {item.content}
                             </p>
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
                        {selectedItem.content}
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
                            {selectedItem.error_analysis || "No analysis available."}
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

                   <div className="mt-auto hidden md:block">
                      <Button className="w-full bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm transition-all" onClick={() => setSelectedItem(null)}>
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
    </div>
  );
}

