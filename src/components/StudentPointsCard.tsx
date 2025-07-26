import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Calendar, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StudentPointsCardProps {
  studentAuth: { name: string; classroomId: string };
}

const StudentPointsCard = ({ studentAuth }: StudentPointsCardProps) => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);
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

      // Fetch homework submissions to calculate points
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('points')
        .eq('student_id', studentData.id);

      if (error) {
        console.error('Error fetching student stats:', error);
        setLoading(false);
        return;
      }

      const total = data.reduce((sum, sub) => sum + sub.points, 0);
      setTotalPoints(total);
      setSubmissionCount(data.length);
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

          {/* 제출한 과제 수 */}
          <div className="text-center bg-accent/10 rounded-lg p-3 border border-accent/20">
            <div className="text-2xl font-bold text-accent-foreground mb-1">
              {submissionCount}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              제출 과제
            </div>
          </div>

          {/* 평균 포인트 */}
          <div className="text-center bg-success/10 rounded-lg p-3 border border-success/20">
            <div className="text-2xl font-bold text-success mb-1">
              {submissionCount > 0 ? Math.round((totalPoints / submissionCount) * 10) / 10 : 0}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              평균 점수
            </div>
          </div>

          {/* 랭킹 위치 */}
          <div className="text-center bg-orange-100 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              ?
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Trophy className="h-3 w-3" />
              랭킹 순위
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