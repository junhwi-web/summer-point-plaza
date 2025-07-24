import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, BookOpen, Trophy, Plus, ArrowLeft, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StudentManagement from "./StudentManagement";
import HomeworkStatus from "./HomeworkStatus";
import RankingManagement from "./RankingManagement";
import NoticeManagement from "./NoticeManagement";

interface AdminDashboardProps {
  classroom: any;
  onGenerateNewCode: () => void;
}

type ManagementView = 'dashboard' | 'students' | 'homework' | 'ranking' | 'notices';

const AdminDashboard = ({ classroom, onGenerateNewCode }: AdminDashboardProps) => {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<ManagementView>('dashboard');
  const [customCode, setCustomCode] = useState("");
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);
  const [stats, setStats] = useState({
    studentCount: 0,
    homeworkCount: 0,
    avgParticipation: 0
  });

  // Fetch real stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!classroom?.id) return;

      try {
        // Get student count
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('classroom_id', classroom.id);

        // Get homework submissions count
        const { data: submissions } = await supabase
          .from('homework_submissions')
          .select('student_id')
          .in('student_id', 
            await supabase
              .from('students')
              .select('id')
              .eq('classroom_id', classroom.id)
              .then(res => res.data?.map(s => s.id) || [])
          );

        setStats({
          studentCount: studentCount || 0,
          homeworkCount: submissions?.length || 0,
          avgParticipation: studentCount ? Math.round((submissions?.length || 0) / (studentCount * 3) * 100) : 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [classroom?.id]);

  // Don't render if classroom is null
  if (!classroom) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">학급 정보를 불러오는 중...</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    
    navigator.clipboard.writeText(classroom.code);
    toast({
      title: "학급 코드 복사됨",
      description: `학급 코드 ${classroom.code}가 클립보드에 복사되었습니다.`,
    });
  };

  const handleUpdateCode = async () => {
    if (!customCode.trim()) {
      toast({
        title: "오류",
        description: "학급 코드를 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (customCode.length !== 5) {
      toast({
        title: "오류", 
        description: "학급 코드는 5자리여야 합니다.",
        variant: "destructive"
      });
      return;
    }

    if (!/^[A-Z]+$/.test(customCode)) {
      toast({
        title: "오류",
        description: "학급 코드는 영문 대문자만 입력 가능합니다.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingCode(true);

    try {
      // Check if code already exists
      const { data: existingClassroom } = await supabase
        .from('classrooms')
        .select('id')
        .eq('code', customCode.toUpperCase())
        .neq('id', classroom.id)
        .maybeSingle();

      if (existingClassroom) {
        toast({
          title: "오류",
          description: "이미 사용 중인 학급 코드입니다.",
          variant: "destructive"
        });
        return;
      }

      // Update the code
      const { error } = await supabase
        .from('classrooms')
        .update({ code: customCode.toUpperCase() })
        .eq('id', classroom.id);

      if (error) throw error;

      toast({
        title: "학급 코드 변경 완료",
        description: `새 학급 코드: ${customCode.toUpperCase()}`,
      });

      setIsCodeDialogOpen(false);
      setCustomCode("");
      
      // Update parent component
      window.location.reload(); // Simple solution for now
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingCode(false);
    }
  };

  // Render specific management view
  if (currentView !== 'dashboard') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            대시보드로 돌아가기
          </Button>
          <h2 className="text-xl font-semibold">
            {currentView === 'students' && '학생 관리'}
            {currentView === 'homework' && '과제 현황'}
            {currentView === 'ranking' && '랭킹 관리'}
            {currentView === 'notices' && '공지사항'}
          </h2>
        </div>
        
        {currentView === 'students' && <StudentManagement classroom={classroom} />}
        {currentView === 'homework' && <HomeworkStatus classroom={classroom} />}
        {currentView === 'ranking' && <RankingManagement classroom={classroom} />}
        {currentView === 'notices' && <NoticeManagement classroom={classroom} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Classroom Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            학급 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">학급명</h3>
              <p className="text-2xl font-bold text-primary">{classroom.name}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">학급 코드</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-2xl font-bold font-mono bg-muted px-3 py-1 rounded">
                  {classroom.code}
                </span>
                <Button size="sm" onClick={handleCopyCode}>
                  복사
                </Button>
                <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      <Edit3 className="h-3 w-3" />
                      코드 수정
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>학급 코드 수정</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">새 학급 코드</label>
                        <Input
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5))}
                          placeholder="예: ABCDE"
                          maxLength={5}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          5글자 영문 대문자만 입력 가능합니다.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateCode} disabled={isUpdatingCode} className="flex-1">
                          {isUpdatingCode ? "변경 중..." : "코드 변경"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsCodeDialogOpen(false)} disabled={isUpdatingCode}>
                          취소
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" variant="outline" onClick={onGenerateNewCode}>
                  랜덤 코드 생성
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                학생들이 이 코드로 로그인할 수 있습니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">등록된 학생</h3>
            <p className="text-2xl font-bold text-primary">{stats.studentCount}명</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-accent" />
            <h3 className="font-semibold">총 과제 제출</h3>
            <p className="text-2xl font-bold text-accent">{stats.homeworkCount}개</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-semibold">평균 참여도</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.avgParticipation}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>관리 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button 
              className="h-16 flex-col gap-2"
              onClick={() => setCurrentView('students')}
            >
              <Users className="h-6 w-6" />
              학생 관리
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => setCurrentView('homework')}
            >
              <BookOpen className="h-6 w-6" />
              과제 현황 보기
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => setCurrentView('ranking')}
            >
              <Trophy className="h-6 w-6" />
              랭킹 관리
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={() => setCurrentView('notices')}
            >
              <Plus className="h-6 w-6" />
              공지사항
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;