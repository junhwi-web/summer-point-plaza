import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VacationInfo from "@/components/VacationInfo";
import HomeworkSubmission from "@/components/HomeworkSubmission";
import HomeworkList from "@/components/HomeworkList";
import RankingBoard from "@/components/RankingBoard";
import StampCalendar from "@/components/StampCalendar";
import AdminDashboard from "@/components/AdminDashboard";

import { BookOpen, Users, Target, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [studentAuth, setStudentAuth] = useState<any>(null);
  const [classroom, setClassroom] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAuth = async () => {
      // 학생 인증 먼저 확인
      const studentAuthData = sessionStorage.getItem('studentAuth');
      if (studentAuthData) {
        try {
          const parsedData = JSON.parse(studentAuthData);
          setStudentAuth(parsedData);
          setClassroom({
            id: parsedData.classroomId,
            name: parsedData.classroomName,
            code: parsedData.classCode
          });
          setIsAuthLoading(false); // 🚩 로딩 끝!
          return;
        } catch {
          sessionStorage.removeItem('studentAuth');
        }
      }

      // 교사 인증 처리
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setClassroom(null);
            setStudentAuth(null);
            setIsAuthLoading(false);
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            setStudentAuth(null);
            try {
              const { data: existingClassroom } = await supabase
                .from('classrooms')
                .select('*')
                .eq('teacher_email', (session.user.email ?? "").trim())
                .maybeSingle();
              if (existingClassroom && !Array.isArray(existingClassroom)) {
                setClassroom(existingClassroom);
              } else {
                setClassroom(null);
              }
            } catch {
              setClassroom(null);
            }
          } else {
            setClassroom(null);
            setStudentAuth(null);
          }
          setIsAuthLoading(false);
        }
      );

      // 새로고침 시, 기존 세션 있으면 classroom fetch
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          setSession(session);
          setUser(session?.user ?? null);

          try {
            const { data: existingClassroom } = await supabase
              .from('classrooms')
              .select('*')
              .eq('teacher_email', (session.user.email ?? "").trim())
              .maybeSingle();
            if (existingClassroom && !Array.isArray(existingClassroom)) {
              setClassroom(existingClassroom);
            } else {
              setClassroom(null);
            }
          } catch {
            setClassroom(null);
          }
        }
        setIsAuthLoading(false); // 🚩 항상 끝에 false!
      });

      return () => subscription?.unsubscribe();
    };

    fetchAuth();
  }, []);

  // 🚩 반드시 최상단에! 로딩 끝나기 전에는 아무것도 렌더하지 않음
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 1. 로그인 안 되어있으면 (1초 후 강제 이동, useEffect가 따로 처리)
  if (!user && !studentAuth) {
    return null;
  }


  // Redirect to auth if no user is logged in (and no student auth)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && !studentAuth) {
        navigate('/auth');
      }
    }, 1000); // Wait 1 second

    return () => clearTimeout(timer);
  }, [user, studentAuth, navigate]);

  const handleLogout = async () => {
    try {
      console.log("Starting logout...");
      
      // Clear student auth if exists
      if (studentAuth) {
        sessionStorage.removeItem('studentAuth');
        setStudentAuth(null);
        setClassroom(null);
        navigate('/auth', { replace: true });
        return;
      }
      
      // Clear teacher auth
      setUser(null);
      setSession(null);
      setClassroom(null);
      
      // Then sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      
      console.log("Logout completed, navigating...");
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error("Error during logout:", error);
      // Force navigation even if there's an error
      navigate('/auth', { replace: true });
    }
  };

  const getUserDisplayName = () => {
    if (studentAuth && classroom) {
      return `${studentAuth.name} (${classroom.name})`;
    }
    if (user?.email) {
      return user.email;
    }
    return "게스트";
  };

  const handleGenerateNewCode = async () => {
    if (!user || !classroom) return;
    
    try {
      const response = await supabase.rpc('generate_class_code');
      const newCode = response.data;
      
      const { error } = await supabase
        .from('classrooms')
        .update({ code: newCode })
        .eq('id', classroom.id);
        
      if (error) throw error;
      
      setClassroom({ ...classroom, code: newCode });
      toast({
        title: "학급 코드 변경됨",
        description: `새 학급 코드: ${newCode}`,
      });
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Show loading while checking auth state
  if (!user && !studentAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-2 sm:py-3">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
                  빛나는 나의 여름방학
                </h1>
                <p className="text-xs sm:text-sm text-primary-foreground/90 leading-tight hidden sm:block">
                  과제를 제출하고 포인트를 모아 랭킹에 도전해보세요!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="text-left sm:text-right flex-1 sm:flex-initial">
                <p className="text-xs text-primary-foreground/80 hidden sm:block">접속 중</p>
                <p className="font-semibold text-xs sm:text-sm truncate">{getUserDisplayName()}</p>
                {classroom && (user || studentAuth) && (
                  <p className="text-xs text-primary-foreground/80">
                    {classroom.code}
                  </p>
                )}
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-1 flex-shrink-0 px-2 py-1"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline text-xs">로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {studentAuth && classroom ? (
          // Student View  
          <>
            <VacationInfo classroomId={classroom?.id} />
            
              {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Homework Submission - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <HomeworkSubmission 
                  key={`homework-submission-${refreshKey}`}
                  studentAuth={studentAuth} 
                  onSubmissionUpdate={() => {
                    setRefreshKey(prev => prev + 1);
                  }} 
                />
                
                {/* Homework List */}
                <HomeworkList 
                  key={`homework-list-${refreshKey}`}
                  studentAuth={studentAuth}
                  onUpdate={() => {
                    setRefreshKey(prev => prev + 1);
                  }}
                />
                
                {/* Stamp Calendar */}
                <StampCalendar key={`stamp-calendar-${refreshKey}`} studentAuth={studentAuth} />
              </div>
              
              {/* Ranking Board - Takes 1 column */}
              <div>
                <RankingBoard key={`ranking-${refreshKey}`} classroom={classroom} currentStudent={studentAuth} />
              </div>
            </div>

          </>
        ) : user && classroom ? (
          // Admin View - only show if both user and classroom exist
          <>
            <VacationInfo classroomId={classroom.id} />
            <AdminDashboard classroom={classroom} onGenerateNewCode={handleGenerateNewCode} />
          </>
        ) : user && !classroom ? (
          // Admin View but no classroom yet - show create classroom form
          <>
            <VacationInfo />
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>학급 만들기</CardTitle>
                  <CardDescription>
                    새로운 학급을 생성해주세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('classroomName') as string;
                    const customCode = formData.get('classroomCode') as string;
                    
                    if (!name.trim()) return;
                    
                    try {
                      console.log("Creating classroom with name:", name, "and code:", customCode);
                      
                      // Use custom code or generate random one
                      const finalCode = customCode.trim().toUpperCase() || Array(5).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                      
                      // Check if custom code already exists
if (customCode.trim()) {
  const finalCode = customCode.trim().toUpperCase();

  const { data: existingClassroom } = await supabase
    .from('classrooms')
    .select('id')
    .eq('code', finalCode)
    .maybeSingle();

  if (existingClassroom) {
    toast({
      title: "오류 발생",
      description: "이미 사용 중인 학급 코드입니다. 다른 코드를 입력해주세요.",
      variant: "destructive",
    });
    return;
  }
}
                      
                      console.log("Final class code:", finalCode);



                      // Create classroom
                      const { data: newClassroom, error } = await supabase
                        .from('classrooms')
                        .insert({
                          code: finalCode,
                          name: name,
                          teacher_email: user.email
                        })
                        .select()
                        .single();

                      if (error) {
                        console.error("Error creating classroom:", error);
                        toast({
                          title: "오류 발생",
                          description: error.message,
                          variant: "destructive",
                        });
                        return;
                      }

                      console.log("Classroom created successfully:", newClassroom);
                      setClassroom(newClassroom);
                      toast({
                        title: "학급 생성 완료",
                        description: `학급 코드: ${finalCode}`,
                      });
                    } catch (error: any) {
                      console.error('Error creating classroom:', error);
                      toast({
                        title: "오류 발생",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="classroomName">학급명</Label>
                      <Input
                        id="classroomName"
                        name="classroomName"
                        type="text"
                        placeholder="학급명을 입력하세요"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="classroomCode">학급 코드 (선택사항)</Label>
                      <Input
                        id="classroomCode"
                        name="classroomCode"
                        type="text"
                        placeholder="예: ABCDE (비어두면 랜덤 생성)"
                        maxLength={5}
                        onChange={(e) => {
                          e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                        }}
                      />
                      <p className="text-sm text-muted-foreground">
                        5글자 영문 대문자만 입력 가능합니다. 비워두면 랜덤으로 생성됩니다.
                      </p>
                    </div>
                    <Button type="submit" className="w-full">
                      학급 만들기
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
};

export default Index;
