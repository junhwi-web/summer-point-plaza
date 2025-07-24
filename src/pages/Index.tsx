import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VacationInfo from "@/components/VacationInfo";
import HomeworkSubmission from "@/components/HomeworkSubmission";
import RankingBoard from "@/components/RankingBoard";
import StampCalendar from "@/components/StampCalendar";
import { BookOpen, Users, Target, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [classroom, setClassroom] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Check for student session
    const studentData = sessionStorage.getItem('student');
    const classroomData = sessionStorage.getItem('classroom');
    
    if (studentData && classroomData) {
      setStudent(JSON.parse(studentData));
      setClassroom(JSON.parse(classroomData));
    }

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to auth if no user or student is logged in
  useEffect(() => {
    if (!user && !student) {
      navigate('/auth');
    }
  }, [user, student, navigate]);

  const handleLogout = async () => {
    if (user) {
      await supabase.auth.signOut();
    }
    
    // Clear student session
    sessionStorage.removeItem('student');
    sessionStorage.removeItem('classroom');
    
    navigate('/auth');
  };

  const getUserDisplayName = () => {
    if (student) {
      return `${student.name} (${classroom?.name})`;
    }
    if (user) {
      return user.email;
    }
    return "게스트";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">여름방학 과제 포인트 시스템</h1>
                <p className="text-primary-foreground/90">
                  과제를 제출하고 포인트를 모아 랭킹에 도전해보세요!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-primary-foreground/80">접속 중</p>
                <p className="font-semibold">{getUserDisplayName()}</p>
                {classroom && user && (
                  <p className="text-sm text-primary-foreground/80">
                    학급 코드: {classroom.code}
                  </p>
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Vacation Information */}
        <VacationInfo />

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Homework Submission - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            <HomeworkSubmission />
            
            {/* Stamp Calendar */}
            <StampCalendar 
              submissions={[
                // 예시 데이터 - 실제로는 상태에서 관리될 것
                { date: new Date(2025, 6, 28), type: "diary" },
                { date: new Date(2025, 6, 30), type: "book-report" },
                { date: new Date(2025, 7, 2), type: "free-task" },
                { date: new Date(2025, 7, 5), type: "diary" },
                { date: new Date(2025, 7, 5), type: "book-report" }, // 같은 날 여러 과제
                { date: new Date(2025, 7, 8), type: "book-report" },
                { date: new Date(2025, 7, 10), type: "diary" },
                { date: new Date(2025, 7, 10), type: "free-task" }, // 같은 날 여러 과제
                { date: new Date(2025, 7, 10), type: "book-report" }, // 같은 날 3개 과제
                { date: new Date(2025, 7, 15), type: "free-task" },
              ]}
            />
          </div>
          
          {/* Ranking Board - Takes 1 column */}
          <div>
            <RankingBoard />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-card p-6 rounded-lg border text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold text-lg">과제 목표</h3>
            <p className="text-sm text-muted-foreground mt-1">
              일기 3편, 독후감 3편 이상 작성
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
            <h3 className="font-semibold text-lg">참여 학생</h3>
            <p className="text-sm text-muted-foreground mt-1">
              전체 학급이 함께 참여하는 활동
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-success" />
            <h3 className="font-semibold text-lg">자유 과제</h3>
            <p className="text-sm text-muted-foreground mt-1">
              나만의 특별한 과제로 추가 포인트 획득
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
