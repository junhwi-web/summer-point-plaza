import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Teacher login state
  const [teacherEmail, setTeacherEmail] = useState("");
  const [teacherPassword, setTeacherPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [classroomName, setClassroomName] = useState("");

  // Student auth state
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");

const handleTeacherAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    if (isSignUp) {
      // 1) 교사 회원가입
      const { data, error } = await supabase.auth.signUp({
        email: teacherEmail,
        password: teacherPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;

      // 2) classroom insert
      // 이메일 인증(verify) 후에 user가 활성화되는 정책이라도, DB에는 바로 insert해도 무방 (teacher_email로 식별)
        const classCode = Array.from({ length: 5 }, () => 
          String.fromCharCode(65 + Math.floor(Math.random() * 26))
        ).join('');

    const { error: classError } = await supabase
      .from('classrooms')
      .insert({
        name: classroomName,
        code: classCode,
        teacher_email: teacherEmail.trim()
      });

      if (classError) throw classError;

      toast({
        title: "회원가입 성공",
        description: "이메일을 확인하고 로그인해주세요.",
      });
    } else {
        // Sign in teacher
        console.log("Attempting to sign in with:", teacherEmail);
        const { error } = await supabase.auth.signInWithPassword({
          email: teacherEmail,
          password: teacherPassword,
        });

        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }

        console.log("Sign in successful, navigating to /");
        toast({
          title: "로그인 성공",
          description: "관리자 페이지로 이동합니다.",
        });
      }

      console.log("About to navigate to /");
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find classroom by code first (public access, no auth needed)
const cleanCode = classCode.trim().toUpperCase();
const response = await fetch(`https://rcombszhlvafzpkfhooe.supabase.co/rest/v1/classrooms?select=*&code=eq.${cleanCode}`, {
  headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjb21ic3pobHZhZnpwa2Zob29lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDY5MjcsImV4cCI6MjA2ODg4MjkyN30.KOreS5iaoH9MlTI5rt-lfu01vjQXKXRisPEUteGmTjo',
          'Content-Type': 'application/json'
        }
      });
      
      const classrooms = await response.json();
      const classroom = classrooms && classrooms.length > 0 ? classrooms[0] : null;

      if (!classroom) {
        throw new Error("유효하지 않은 반 코드입니다.");
      }

      // Check if student already exists in the database
      const { data: existingStudent } = await supabase
        .from('students')
        .select('*')
        .eq('name', studentName)
        .eq('classroom_id', classroom.id)
        .maybeSingle();

      let studentId;
      if (!existingStudent) {
        // Create new student record
        const { data: newStudent, error: studentError } = await supabase
          .from('students')
          .insert({
            name: studentName,
            classroom_id: classroom.id
          })
          .select()
          .single();

        if (studentError) throw studentError;
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }

      // Store student info in sessionStorage (simple auth)
      const studentData = {
        name: studentName,
        classroomId: classroom.id,
        classroomName: classroom.name,
        classCode: classroom.code,
        studentId: studentId
      };
      
      sessionStorage.setItem('studentAuth', JSON.stringify(studentData));

      toast({
        title: "로그인 성공",
        description: `안녕하세요, ${studentName}님!`,
      });

      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">여름방학 과제 시스템</h1>
          <p className="text-muted-foreground">로그인하여 시작하세요</p>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student">학생 로그인</TabsTrigger>
            <TabsTrigger value="teacher">관리자 로그인</TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle>학생 로그인</CardTitle>
                <CardDescription>
                  학급 코드와 이름을 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStudentAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="classCode">반 코드</Label>
                    <Input
                      id="classCode"
                      type="text"
                      placeholder="5자리 반 코드를 입력하세요"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      required
                      maxLength={5}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentName">이름</Label>
                     <Input
                      id="studentName"
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value.trim())}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "로그인 중..." : "로그인"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>관리자 {isSignUp ? "회원가입" : "로그인"}</CardTitle>
                <CardDescription>
                  {isSignUp ? "새 학급을 만들어보세요" : "이메일과 비밀번호를 입력하세요"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTeacherAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호</Label>
                    <Input
                      id="password"
                      type="password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      required
                    />
                  </div>
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="classroomName">학급명</Label>
                      <Input
                        id="classroomName"
                        type="text"
                        value={classroomName}
                        onChange={(e) => setClassroomName(e.target.value)}
                        placeholder="학급명을 입력하세요"
                        required
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "처리 중..." : (isSignUp ? "회원가입" : "로그인")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "이미 계정이 있나요? 로그인" : "계정이 없나요? 회원가입"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;