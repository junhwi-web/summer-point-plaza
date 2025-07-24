import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface VacationInfoProps {
  classroomId?: string;
}

const VacationInfo = ({ classroomId }: VacationInfoProps) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNotices, setExpandedNotices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (classroomId) {
      fetchNotices();
    }
  }, [classroomId]);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('classroom_id', classroomId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNoticeExpansion = (noticeId: string) => {
    setExpandedNotices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noticeId)) {
        newSet.delete(noticeId);
      } else {
        newSet.add(noticeId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3 mb-4 sm:mb-6">
      {/* Custom Notices */}
      {notices.length > 0 ? (
        <Card className="w-full p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-blue-600">공지사항</h2>
            </div>
            
            <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2">
              {notices.map((notice) => {
                const isExpanded = expandedNotices.has(notice.id);
                const shouldShowToggle = notice.content.length > 100; // 100자 이상일 때만 토글 버튼 표시
                
                return (
                  <div key={notice.id} className="bg-white p-2 sm:p-3 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-1 text-xs sm:text-sm">{notice.title}</h3>
                    <p className={`text-xs text-gray-700 whitespace-pre-wrap leading-relaxed ${!isExpanded && shouldShowToggle ? 'line-clamp-2' : ''}`}>
                      {notice.content}
                    </p>
                    {shouldShowToggle && (
                      <button
                        onClick={() => toggleNoticeExpansion(notice.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-1 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <span>접기</span>
                            <ChevronUp className="h-3 w-3" />
                          </>
                        ) : (
                          <>
                            <span>전체보기</span>
                            <ChevronDown className="h-3 w-3" />
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="w-full p-3 sm:p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-primary">공지사항</h2>
            </div>
            
            <div className="text-center py-4">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground text-xs sm:text-sm">
                등록된 공지사항이 없습니다.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VacationInfo;