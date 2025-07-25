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
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentName, setStudentName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [isStudentSignUp, setIsStudentSignUp] = useState(false);

  const handleTeacherAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up teacher
        const { error } = await supabase.auth.signUp({
          email: teacherEmail,
          password: teacherPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        // Store classroom name in localStorage for after login
        localStorage.setItem('pendingClassroomName', classroomName);

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
      if (isStudentSignUp) {
        // Find classroom by code first
        const { data: classroom, error: classroomError } = await supabase
          .from("classrooms")
          .select("*")
          .eq("code", classCode.toUpperCase())
          .single();

        if (classroomError || !classroom) {
          throw new Error("유효하지 않은 반 코드입니다.");
        }

        // Sign up the student
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: studentEmail,
          password: studentPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: studentName,
              classroom_id: classroom.id
            }
          }
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (authData.user) {
          // Create student profile
          const { error: profileError } = await supabase
            .from("student_profiles")
            .insert({
              id: authData.user.id,
              name: studentName,
              classroom_id: classroom.id,
            });

          if (profileError) {
            throw new Error("학생 프로필 생성에 실패했습니다.");
          }

          toast({
            title: "회원가입 성공",
            description: `안녕하세요, ${studentName}님! 로그인되었습니다.`,
          });

          navigate("/", { replace: true });
        }
      } else {
        // Sign in the student
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: studentEmail,
          password: studentPassword,
        });

        if (signInError) {
          throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        toast({
          title: "로그인 성공",
          description: `환영합니다!`,
        });

        navigate("/", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: isStudentSignUp ? "회원가입 실패" : "로그인 실패",
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
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={!isStudentSignUp ? "default" : "outline"}
                    onClick={() => setIsStudentSignUp(false)}
                    size="sm"
                  >
                    로그인
                  </Button>
                  <Button
                    type="button"
                    variant={isStudentSignUp ? "default" : "outline"}
                    onClick={() => setIsStudentSignUp(true)}
                    size="sm"
                  >
                    회원가입
                  </Button>
                </div>
                <form onSubmit={handleStudentAuth} className="space-y-4">
                  <div>
                    <Label htmlFor="studentEmail">이메일</Label>
                    <Input
                      id="studentEmail"
                      type="email"
                      placeholder="이메일을 입력하세요"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="studentPassword">비밀번호</Label>
                    <Input
                      id="studentPassword"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  {isStudentSignUp && (
                    <>
                      <div>
                        <Label htmlFor="studentName">이름</Label>
                        <Input
                          id="studentName"
                          type="text"
                          placeholder="이름을 입력하세요"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          required
                        />
                      </div>
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
                    </>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (isStudentSignUp ? "회원가입 중..." : "로그인 중...") : (isStudentSignUp ? "회원가입" : "로그인")}
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