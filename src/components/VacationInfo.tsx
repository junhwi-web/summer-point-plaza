import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Clock, MessageSquare } from "lucide-react";
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
  return (
    <div className="space-y-4 mb-8">
      {/* Custom Notices */}
      {notices.length > 0 ? (
        <Card className="w-full p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-blue-600">공지사항</h2>
            </div>
            
            <div className="space-y-3">
              {notices.map((notice) => (
                <div key={notice.id} className="bg-white p-3 sm:p-4 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">{notice.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="w-full p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-primary">공지사항</h2>
            </div>
            
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                아직 등록된 공지사항이 없습니다.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                선생님이 공지사항을 등록하면 여기에 표시됩니다.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VacationInfo;