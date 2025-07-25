import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  points: number;
  rank: number;
  completedTasks: number;
}

interface RankingBoardProps {
  classroom?: { id: string };
  currentStudent?: { id: string; name: string };
}

const RankingBoard = ({ classroom, currentStudent }: RankingBoardProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classroom?.id) {
      fetchRankings();
    }
  }, [classroom?.id]);

  const fetchRankings = async () => {
    if (!classroom?.id) return;

    try {
      setLoading(true);
      console.log('🏆 RankingBoard: Fetching rankings for classroom:', classroom.id);

      // Fetch all students in the classroom
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name')
        .eq('classroom_id', classroom.id);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        return;
      }

      console.log('📚 RankingBoard: Found students:', studentsData);

      // Fetch submissions for all students
      const studentRankings: Student[] = [];

      for (const student of studentsData || []) {
        const { data: submissions, error: submissionsError } = await supabase
          .from('homework_submissions')
          .select('points')
          .eq('student_id', student.id);

        if (submissionsError) {
          console.error('Error fetching submissions for student:', student.id, submissionsError);
          continue;
        }

        const totalPoints = submissions.reduce((sum, sub) => sum + sub.points, 0);
        const completedTasks = submissions.length;

        console.log(`📝 Student ${student.name}: ${totalPoints} points, ${completedTasks} tasks`);

        studentRankings.push({
          id: student.id,
          name: student.name,
          points: totalPoints,
          rank: 0, // Will be set after sorting
          completedTasks
        });
      }

      // Sort by points and assign ranks
      studentRankings.sort((a, b) => b.points - a.points);
      studentRankings.forEach((student, index) => {
        student.rank = index + 1;
      });

      console.log('🏅 Final rankings:', studentRankings);
      setStudents(studentRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center font-heading">🏆 학급 랭킹</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">랭킹을 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center font-heading">🏆 학급 랭킹</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">아직 제출된 과제가 없습니다.</div>
        </CardContent>
      </Card>
    );
  }

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <div className="text-6xl">🥇</div>
            <div className="text-lg font-bold text-yellow-600 font-heading">1등</div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <div className="text-5xl">🥈</div>
            <div className="text-base font-bold text-gray-500 font-heading">2등</div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <div className="text-4xl">🥉</div>
            <div className="text-sm font-bold text-amber-600 font-heading">3등</div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-xl font-bold font-heading">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 shadow-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400 shadow-gray-200";
      case 3:
        return "bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 shadow-orange-200";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center font-heading">🏆 학급 랭킹</CardTitle>
        <p className="text-lg text-muted-foreground text-center font-body">
          방학 과제를 열심히 해서 상위권에 올라보세요! 🎯
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상위 3등 시상대 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {students.slice(0, 3).map((student, index) => (
            <div
              key={student.id}
              className={cn(
                "text-center p-4 rounded-2xl border-2 shadow-lg transition-all hover:scale-105",
                getRankColor(student.rank),
                index === 0 && "order-2 transform scale-110", // 1등을 가운데, 크게
                index === 1 && "order-1", // 2등을 왼쪽
                index === 2 && "order-3"  // 3등을 오른쪽
              )}
            >
              {getRankDisplay(student.rank)}
              <p className="font-bold text-lg font-heading mt-4">{student.name}</p>
              <p className="text-2xl font-bold text-primary font-heading">{student.points}점</p>
              <p className="text-sm text-muted-foreground font-body">
                과제 {student.completedTasks}개 완료
              </p>
            </div>
          ))}
        </div>
        
        {/* 4등 이하 */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-center mb-4 font-heading">나머지 순위</h3>
          {students.slice(3).map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 rounded-xl border-2 bg-card hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-4">
                {getRankDisplay(student.rank)}
                
                <div>
                  <p className="font-bold text-lg font-heading">{student.name}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    과제 완료: {student.completedTasks}개
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-primary font-heading">
                  {student.points}점
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingBoard;