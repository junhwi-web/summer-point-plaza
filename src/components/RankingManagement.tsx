import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Medal, Award, Star, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StudentRanking {
  id: string;
  name: string;
  totalPoints: number;
  submissionCount: number;
  submissions: Array<{
    id: string;
    homework_type: string;
    points: number;
    submitted_at: string;
  }>;
}

interface RankingManagementProps {
  classroom: any;
}

const RankingManagement = ({ classroom }: RankingManagementProps) => {
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentRanking | null>(null);

  useEffect(() => {
    fetchRankings();
  }, [classroom?.id]);

  const fetchRankings = async () => {
    if (!classroom?.id) return;

    try {
      // Fetch students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroom.id);

      if (studentsError) throw studentsError;

      // Fetch submissions for each student
      const studentRankings: StudentRanking[] = [];
      
      for (const student of students || []) {
        const { data: submissions, error: submissionsError } = await supabase
          .from('homework_submissions')
          .select('*')
          .eq('student_id', student.id)
          .order('submitted_at', { ascending: false });

        if (submissionsError) throw submissionsError;

        const totalPoints = submissions?.reduce((sum, sub) => sum + sub.points, 0) || 0;
        
        studentRankings.push({
          id: student.id,
          name: student.name,
          totalPoints,
          submissionCount: submissions?.length || 0,
          submissions: submissions || []
        });
      }

      // Sort by total points (descending)
      studentRankings.sort((a, b) => b.totalPoints - a.totalPoints);
      
      setRankings(studentRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return <Star className="h-6 w-6 text-muted-foreground" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-100 text-gray-800";
    if (rank === 3) return "bg-amber-100 text-amber-800";
    return "bg-blue-100 text-blue-800";
  };

  const getHomeworkTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'diary': '일기',
      'book-report': '독후감',
      'free-task': '자유과제'
    };
    return types[type] || type;
  };

  const getHomeworkTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'diary': 'bg-blue-100 text-blue-800',
      'book-report': 'bg-green-100 text-green-800',
      'free-task': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-8">랭킹을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Students */}
      {rankings.length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              상위 3명
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {rankings.slice(0, 3).map((student, index) => (
                <div key={student.id} className="text-center p-4 border rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getRankIcon(index + 1)}
                  </div>
                  <Badge className={getRankBadgeColor(index + 1)}>
                    {index + 1}위
                  </Badge>
                  <h3 className="font-semibold mt-2 mb-1">{student.name}</h3>
                  <p className="text-2xl font-bold text-primary">{student.totalPoints}점</p>
                  <p className="text-sm text-muted-foreground">
                    {student.submissionCount}개 제출
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            전체 랭킹
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 과제를 제출한 학생이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {rankings.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(index + 1)}
                      <Badge className={getRankBadgeColor(index + 1)}>
                        {index + 1}위
                      </Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {student.submissionCount}개 과제 제출
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {student.totalPoints}점
                      </div>
                      <div className="text-sm text-muted-foreground">
                        평균: {student.submissionCount > 0 ? Math.round(student.totalPoints / student.submissionCount) : 0}점
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student)}
                        >
                          세부 내역
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5" />
                            {student.name}의 포인트 세부 내역
                          </DialogTitle>
                          <DialogDescription>
                            총 {student.totalPoints}점 ({student.submissionCount}개 과제)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto">
                          {student.submissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              아직 제출한 과제가 없습니다.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {student.submissions.map((submission) => (
                                <div
                                  key={submission.id}
                                  className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge className={getHomeworkTypeColor(submission.homework_type)}>
                                      {getHomeworkTypeLabel(submission.homework_type)}
                                    </Badge>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Calendar className="h-4 w-4" />
                                      {new Date(submission.submitted_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="font-semibold text-yellow-600">
                                      +{submission.points}점
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingManagement;