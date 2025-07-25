import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PenTool, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface StampCalendarProps {
  student?: { id: string; name: string };
  studentProfile?: { id: string; name: string };
  studentAuth?: { name: string; classroomId: string };
  submissions?: Array<{
    date: Date;
    type: "diary" | "book-report" | "free-task";
  }>;
}

const StampCalendar = ({ student, studentProfile, studentAuth, submissions = [] }: StampCalendarProps) => {
  // Use studentAuth if available, then studentProfile, fallback to student for backward compatibility
  const currentStudent = studentAuth || studentProfile || student;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [realSubmissions, setRealSubmissions] = useState<Array<{
    date: Date;
    type: "diary" | "book-report" | "free-task";
  }>>([]);

  useEffect(() => {
    fetchSubmissions();
  }, [studentAuth?.name, currentStudent?.id]);

  const fetchSubmissions = async () => {
    // For sessionStorage-based auth, fetch from localStorage
    if (studentAuth) {
      const homeworksKey = `homeworks_${studentAuth.name}`;
      const existingHomeworks = JSON.parse(localStorage.getItem(homeworksKey) || '[]');
      
      const formattedSubmissions = existingHomeworks.map((homework: any) => ({
        date: new Date(homework.submittedAt),
        type: homework.type as "diary" | "book-report" | "free-task"
      }));
      
      setRealSubmissions(formattedSubmissions);
      return;
    }

    // For database-based auth
    if (!currentStudent?.id) return;

    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('homework_type, submitted_at')
        .eq('student_id', currentStudent.id);

      if (error) {
        console.error('Error fetching submissions:', error);
        return;
      }

      const formattedSubmissions = data.map(sub => ({
        date: new Date(sub.submitted_at),
        type: sub.homework_type as "diary" | "book-report" | "free-task"
      }));

      setRealSubmissions(formattedSubmissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  // Use real submissions if student is logged in, otherwise use props
  const activeSubmissions = (studentAuth || currentStudent?.id) ? realSubmissions : submissions;

  const getVacationData = () => {
    const startDate = new Date(2025, 6, 27); // 7/27
    const endDate = new Date(2025, 7, 18); // 8/18
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, startDate, endDate };
  };

  const { days, startDate, endDate } = getVacationData();

  const getSubmissionsForDate = (date: Date) => {
    return activeSubmissions.filter(sub => 
      sub.date.toDateString() === date.toDateString()
    );
  };

  const getStampIcon = (type: "diary" | "book-report" | "free-task") => {
    switch (type) {
      case "diary":
        return <PenTool className="h-4 w-4 text-primary" />;
      case "book-report":
        return <BookOpen className="h-4 w-4 text-accent" />;
      case "free-task":
        return <Star className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getStampBackground = (type: "diary" | "book-report" | "free-task") => {
    switch (type) {
      case "diary":
        return "bg-primary/10 border-primary/30";
      case "book-report":
        return "bg-accent/10 border-accent/30";
      case "free-task":
        return "bg-success/10 border-success/30";
      default:
        return "";
    }
  };

  const isFinishLine = (date: Date) => {
    return date.toDateString() === new Date(2025, 7, 18).toDateString(); // 8/18 개학일
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isVacationPeriod = (date: Date) => {
    return date >= startDate && date <= endDate;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center">
          <CardTitle className="text-2xl font-bold">방학 과제 캘린더 📅</CardTitle>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-2">
          2025년 7월 27일 ~ 8월 18일 (개학일)
        </div>
        
        {/* 범례 */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <PenTool className="h-3 w-3 text-primary" />
            <span>일기</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-accent" />
            <span>독후감</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-success" />
            <span>자유과제</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-2",
                index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const daySubmissions = getSubmissionsForDate(day);
            const isVacationDay = isVacationPeriod(day);
            const isTodayDate = isToday(day);
            const isFinishLineDay = isFinishLine(day);
            
            return (
              <div
                key={index}
                className={cn(
                  "relative h-20 border-2 rounded-xl transition-all duration-200 p-2",
                  isVacationDay ? "bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20" : "bg-muted/10 border-muted/20",
                  isTodayDate && "ring-2 ring-primary shadow-lg scale-105",
                  isFinishLineDay && "bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 ring-2 ring-yellow-400"
                )}
              >
                {/* 날짜 숫자 - 왼쪽 위 */}
                <div className="absolute top-1 left-2">
                  <span className={cn(
                    "text-sm font-bold",
                    isVacationDay ? "text-foreground" : "text-muted-foreground/50",
                    isTodayDate && "text-primary text-base",
                    isFinishLineDay && "text-orange-600"
                  )}>
                    {day.getDate()}
                  </span>
                </div>
                
                {/* 개학일 특별 표시 */}
                {isFinishLineDay && (
                  <div className="absolute top-1 right-1">
                    <span className="text-lg">🏁</span>
                  </div>
                )}
                
                {/* 스탬프들 - 중앙 배치 */}
                {daySubmissions.length > 0 && (
                  <div className="absolute inset-2 flex items-center justify-center">
                    <div className="flex gap-1 flex-wrap justify-center max-w-full">
                      {daySubmissions.slice(0, 3).map((submission, subIndex) => (
                        <div
                          key={subIndex}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-md",
                            getStampBackground(submission.type),
                            "hover:scale-110 transition-transform"
                          )}
                          title={`${submission.type === 'diary' ? '일기' : submission.type === 'book-report' ? '독후감' : '자유과제'}`}
                        >
                          {getStampIcon(submission.type)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 방학 과제 통계 */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-lg text-center font-bold text-primary mb-4">
            🎯 방학 과제 현황
          </div>
          <div className="flex justify-center gap-6">
            <div className="text-center bg-primary/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary">
                {activeSubmissions.filter(s => s.type === "diary").length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">일기 ✏️</div>
            </div>
            <div className="text-center bg-accent/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-accent-foreground">
                {activeSubmissions.filter(s => s.type === "book-report").length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">독후감 📚</div>
            </div>
            <div className="text-center bg-success/10 rounded-xl p-3">
              <div className="text-2xl font-bold text-success">
                {activeSubmissions.filter(s => s.type === "free-task").length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">자유과제 ⭐</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StampCalendar;