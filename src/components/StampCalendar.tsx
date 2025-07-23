import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PenTool, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StampCalendarProps {
  submissions?: Array<{
    date: Date;
    type: "diary" | "book-report" | "free-task";
  }>;
}

const StampCalendar = ({ submissions = [] }: StampCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  };

  const { days, firstDay, lastDay } = getMonthData(currentDate);

  const getSubmissionForDate = (date: Date) => {
    return submissions.find(sub => 
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
        return "bg-primary/20 border-primary/40";
      case "book-report":
        return "bg-accent/20 border-accent/40";
      case "free-task":
        return "bg-success/20 border-success/40";
      default:
        return "";
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">과제 제출 캘린더</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const submission = getSubmissionForDate(day);
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={index}
                className={cn(
                  "relative aspect-square flex items-center justify-center text-sm border rounded-md transition-colors",
                  !isCurrentMonthDay && "text-muted-foreground/40 bg-muted/20",
                  isTodayDate && "bg-primary/10 border-primary font-semibold",
                  submission && getStampBackground(submission.type)
                )}
              >
                <span className={cn(
                  isCurrentMonthDay ? "text-foreground" : "text-muted-foreground/40",
                  isTodayDate && "text-primary"
                )}>
                  {day.getDate()}
                </span>
                
                {/* 스탬프 */}
                {submission && (
                  <div className="absolute top-0.5 right-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      getStampBackground(submission.type)
                    )}>
                      {getStampIcon(submission.type)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* 이번 달 통계 */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-center text-muted-foreground">
            이번 달 과제 제출 현황
          </div>
          <div className="flex justify-center gap-4 mt-2">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {submissions.filter(s => 
                  s.date.getMonth() === currentDate.getMonth() && 
                  s.date.getFullYear() === currentDate.getFullYear() &&
                  s.type === "diary"
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">일기</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-accent-foreground">
                {submissions.filter(s => 
                  s.date.getMonth() === currentDate.getMonth() && 
                  s.date.getFullYear() === currentDate.getFullYear() &&
                  s.type === "book-report"
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">독후감</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-success">
                {submissions.filter(s => 
                  s.date.getMonth() === currentDate.getMonth() && 
                  s.date.getFullYear() === currentDate.getFullYear() &&
                  s.type === "free-task"
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">자유과제</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StampCalendar;