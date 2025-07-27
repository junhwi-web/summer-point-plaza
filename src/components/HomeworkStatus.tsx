import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  created_at: string;
}

interface HomeworkSubmission {
  id: string;
  homework_type: string;
  points: number;
  submitted_at: string;
  student_id: string;
  title?: string;
  content?: string;
  photo?: string;
}

interface HomeworkStatusProps {
  classroom: any;
}

const HomeworkStatus = ({ classroom }: HomeworkStatusProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, [classroom?.id]);

  useEffect(() => {
    if (selectedStudent) {
      fetchSubmissions(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    if (!classroom?.id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
      
      // Auto-select first student if available
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (studentId: string) => {
    setSubmissionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setSubmissionsLoading(false);
    }
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

  const getTotalPoints = () => {
    return submissions.reduce((total, submission) => total + submission.points, 0);
  };

  if (loading) {
    return <div className="text-center py-8">학생 목록을 불러오는 중...</div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Students List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            학생 목록 ({students.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 학생이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <Button
                  key={student.id}
                  variant={selectedStudent?.id === student.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedStudent(student)}
                >
                  {student.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Homework Details */}
      <div className="lg:col-span-2 space-y-6">
        {selectedStudent ? (
          <>
            {/* Student Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedStudent.name}의 과제 현황
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{submissions.length}</div>
                    <div className="text-sm text-muted-foreground">총 제출</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">{getTotalPoints()}</div>
                    <div className="text-sm text-muted-foreground">총 포인트</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {submissions.length > 0 ? Math.round(getTotalPoints() / submissions.length) : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">평균 포인트</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submissions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  제출한 과제
                </CardTitle>
              </CardHeader>
              <CardContent>
  {submissionsLoading ? (
    <div className="text-center py-8">과제를 불러오는 중...</div>
  ) : submissions.length === 0 ? (
    <div className="text-center py-8 text-muted-foreground">
      아직 제출한 과제가 없습니다.
    </div>
  ) : (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-muted/30">
            <div className="flex items-center gap-3">
              <Badge className={getHomeworkTypeColor(submission.homework_type)}>
                {getHomeworkTypeLabel(submission.homework_type)}
              </Badge>
              <div>
                {submission.title && (
                  <div className="font-medium">{submission.title}</div>
                )}
                <div className="text-sm text-muted-foreground">
                  {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-yellow-600">
                {submission.points}점
              </span>
              {/* 👇 삭제 버튼 추가 */}
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!window.confirm("정말로 이 과제를 삭제할까요?")) return;
                  // 삭제 처리
                  const { error } = await supabase
                    .from('homework_submissions')
                    .delete()
                    .eq('id', submission.id);
                  if (error) {
                    alert("삭제 실패: " + error.message);
                    return;
                  }
                  // 삭제 후 새로고침
                  setSubmissions((prev) => prev.filter((hw) => hw.id !== submission.id));
                }}
              >
                삭제
              </Button>
            </div>
          </div>
          {(submission.content || submission.photo) && (
            <div className="p-4 space-y-3">
              {submission.content && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">내용</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{submission.content}</p>
                </div>
              )}
              {submission.photo && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">첨부 사진</h4>
                  <img 
                    src={submission.photo} 
                    alt="과제 사진" 
                    className="max-w-full h-auto rounded border max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                왼쪽에서 학생을 선택하면 과제 현황을 볼 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomeworkStatus;