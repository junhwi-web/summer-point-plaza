
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, BookOpen, PenTool, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StudentPointsCardProps {
  studentAuth: { name: string; classroomId: string };
}

const StudentPointsCard = ({ studentAuth }: StudentPointsCardProps) => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [diaryCount, setDiaryCount] = useState(0);
  const [bookReportCount, setBookReportCount] = useState(0);
  const [freeAssignmentCount, setFreeAssignmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentStats();
  }, [studentAuth?.name]);

  const fetchStudentStats = async () => {
    setLoading(true);
    
    try {
      // Find student in database first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('name', studentAuth.name)
        .eq('classroom_id', studentAuth.classroomId)
        .maybeSingle();

      if (studentError || !studentData) {
        console.error('Cannot find student for points card:', studentError);
        setLoading(false);
        return;
      }

      // Fetch homework submissions to calculate points and counts by type
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('points, homework_type')
        .eq('student_id', studentData.id);

      if (error) {
        console.error('Error fetching student stats:', error);
        setLoading(false);
        return;
      }

      // Calculate total points
      const total = data.reduce((sum, sub) => sum + sub.points, 0);
      setTotalPoints(total);

      // Count submissions by type
      const diary = data.filter(sub => sub.homework_type === 'diary').length;
      const bookReport = data.filter(sub => sub.homework_type === 'book_report').length;
      const freeAssignment = data.filter(sub => sub.homework_type === 'free_assignment').length;

      setDiaryCount(diary);
      setBookReportCount(bookReport);
      setFreeAssignmentCount(freeAssignment);
    } catch (error) {
      console.error('Error fetching student stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          {studentAuth.name}의 현재 상황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 총 포인트 */}
          <div className="text-center bg-primary/10 rounded-lg p-3 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">
              {totalPoints}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Star className="h-3 w-3" />
              총 포인트
            </div>
          </div>

          {/* 일기 개수 */}
          <div className="text-center bg-blue-100 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {diaryCount}/3
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <PenTool className="h-3 w-3" />
              일기
            </div>
          </div>

          {/* 독후감 개수 */}
          <div className="text-center bg-green-100 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {bookReportCount}/3
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <BookOpen className="h-3 w-3" />
              독후감
            </div>
          </div>

          {/* 자유과제 개수 */}
          <div className="text-center bg-purple-100 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {freeAssignmentCount}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Lightbulb className="h-3 w-3" />
              자유과제
            </div>
          </div>
        </div>

        {/* 진행 상황 */}
        <div className="mt-4 p-3 bg-background/50 rounded-lg border">
          <div className="text-sm font-medium mb-2">방학 과제 진행 상황</div>
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="bg-primary/10">
              일기: 목표 3편
            </Badge>
            <Badge variant="outline" className="bg-accent/10">
              독후감: 목표 3편
            </Badge>
            <Badge variant="outline" className="bg-success/10">
              자유과제: 자유롭게
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentPointsCard;
