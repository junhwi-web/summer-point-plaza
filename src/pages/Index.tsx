import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import VacationInfo from "@/components/VacationInfo";
import HomeworkSubmission from "@/components/HomeworkSubmission";
import HomeworkList from "@/components/HomeworkList";
import RankingBoard from "@/components/RankingBoard";
import StampCalendar from "@/components/StampCalendar";
import AdminDashboard from "@/components/AdminDashboard";

import { BookOpen, LogOut } from "lucide-react";
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 🚩 useEffect에서 무한로딩 원인 제거 + 정리
  useEffect(() => {
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
        setIsAuthLoading(false);
      } catch (error) {
        sessionStorage.removeItem('studentAuth');
        setIsAuthLoading(false); // 예외시에도 반드시 로딩 종료
      }
      return; // 🚩 cleanup 반환 없음(여기서 끝!)
    }

    // 교사 계정 분기
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
      setIsAuthLoading(false);
    });

    // 🚩 cleanup은 이 분기에서만 리턴
    return () => subscription?.unsubscribe();
  }, []);

  // 로그인 안 했으면 1초 후 /auth로 리디렉션
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && !studentAuth && !isAuthLoading) {
        navigate('/auth');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [user, studentAuth, navigate, isAuthLoading]);

  const handleLogout = async () => {
    try {
      // 학생이면
      if (studentAuth) {
        sessionStorage.removeItem('studentAuth');
        setStudentAuth(null);
        setClassroom(null);
        navigate('/auth', { replace: true });
        return;
      }
      // 교사면
      setUser(null);
      setSession(null);
      setClassroom(null);
      await supabase.auth.signOut();
      navigate('/auth', { replace: true });
    } catch (error: any) {
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

  // 🚩 로딩이 끝나기 전엔 무조건 스피너
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

  // 🚩 여기서부터는 로딩 끝나고 분기
  if (!user && !studentAuth) {
    // 이 분기엔 사실상 거의 안 옴(위에서 /auth 리디렉션됨), 예비용
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
          // 학생뷰
          <>
            <VacationInfo classroomId={classroom?.id} />
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <HomeworkSubmission 
                  key={`homework-submission-${refreshKey}`}
                  studentAuth={studentAuth} 
                  onSubmissionUpdate={() => setRefreshKey(prev => prev + 1)} 
                />
                <HomeworkList 
                  key={`homework-list-${refreshKey}`}
                  studentAuth={studentAuth}
                  onUpdate={() => setRefreshKey(prev => prev + 1)}
                />
                <StampCalendar key={`stamp-calendar-${refreshKey}`} studentAuth={studentAuth} />
              </div>
              <div>
                <RankingBoard key={`ranking-${refreshKey}`} classroom={classroom} currentStudent={studentAuth} />
              </div>
            </div>
          </>
        ) : user && classroom ? (
          // 관리자(교사)뷰
          <>
            <VacationInfo classroomId={classroom.id} />
            <AdminDashboard classroom={classroom} onGenerateNewCode={handleGenerateNewCode} />
          </>
        ) : user && !classroom ? (
          // 교사 - 학급 없음
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
                      // Use custom code or generate random one
                      const finalCode = customCode.trim().toUpperCase() || Array(5).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                      // Check if custom code already exists
                      if (customCode.trim()) {
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
                        toast({
                          title: "오류 발생",
                          description: error.message,
                          variant: "destructive",
                        });
                        return;
                      }

                      setClassroom(newClassroom);
                      toast({
                        title: "학급 생성 완료",
                        description: `학급 코드: ${finalCode}`,
                      });
                    } catch (error: any) {
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
