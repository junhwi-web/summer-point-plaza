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
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [classroom, setClassroom] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for authentication state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if this is a student profile
          const { data: studentData } = await supabase
            .from('student_profiles')
            .select('*, classrooms(*)')
            .eq('id', session.user.id)
            .single();
          
          if (studentData) {
            // This is a student
            setStudentProfile(studentData);
            setClassroom(studentData.classrooms);
          } else {
            // This is a teacher, check for pending classroom creation
            if (event === 'SIGNED_IN') {
              const pendingClassroomName = localStorage.getItem('pendingClassroomName');
              if (pendingClassroomName) {
                try {
                  const classCode = Array(5).fill(0).map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
                  const { data: insertResult, error: classroomError } = await supabase
                    .from('classrooms')
                    .insert({
                      code: classCode,
                      name: pendingClassroomName,
                      teacher_email: session.user.email
                    })
                    .select()
                    .single();

                  if (!classroomError) {
                    setClassroom(insertResult);
                    localStorage.removeItem('pendingClassroomName');
                  }
                } catch (error) {
                  console.error('Error creating classroom:', error);
                }
              }
            }
            
            // Try to fetch existing classroom for teacher
            try {
              const { data: existingClassroom } = await supabase
                .from('classrooms')
                .select('*')
                .eq('teacher_email', session.user.email)
                .maybeSingle();
                
              if (existingClassroom) {
                setClassroom(existingClassroom);
              }
            } catch (error) {
              console.error("Error fetching classroom:", error);
            }
            
            setStudentProfile(null);
          }
        } else {
          setClassroom(null);
          setStudentProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to auth if no user is logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        navigate('/auth');
      }
    }, 1000); // Wait 1 second

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setClassroom(null);
    setStudentProfile(null);
    navigate('/auth');
  };

  const getUserDisplayName = () => {
    if (studentProfile && classroom) {
      return `${studentProfile.name} (${classroom.name})`;
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
  if (!user) {
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
                {classroom && user && (
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
        {studentProfile && classroom ? (
          // Student View  
          <>
            <VacationInfo classroomId={classroom?.id} />
            
              {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Homework Submission - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                <HomeworkSubmission 
                  studentProfile={studentProfile} 
                  onSubmissionUpdate={() => {
                    // Trigger re-fetch of data in other components
                    window.location.reload(); // Simple solution for now
                  }} 
                />
                
                {/* Homework List */}
                <HomeworkList 
                  studentProfile={studentProfile}
                  onUpdate={() => {
                    // Trigger re-fetch of data in other components
                    window.location.reload(); // Simple solution for now
                  }}
                />
                
                {/* Stamp Calendar */}
                <StampCalendar studentProfile={studentProfile} />
              </div>
              
              {/* Ranking Board - Takes 1 column */}
              <div>
                <RankingBoard classroom={classroom} currentStudent={studentProfile} />
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
