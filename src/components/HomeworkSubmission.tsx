import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, PenTool, Star, Plus } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import { supabase } from "@/integrations/supabase/client";

interface Homework {
  id: string;
  type: "diary" | "book-report" | "free-task";
  title: string;
  content: string;
  photo?: string;
  submittedAt: Date;
  points: number;
}

interface HomeworkSubmissionProps {
  student?: { id: string; name: string };
  studentProfile?: { id: string; name: string };
  studentAuth?: { name: string; classroomId: string };
  onSubmissionUpdate?: () => void;
}

const HomeworkSubmission = ({ student, studentProfile, studentAuth, onSubmissionUpdate }: HomeworkSubmissionProps) => {
  // Use studentAuth if available, then studentProfile, fallback to student for backward compatibility
  const currentStudent = studentAuth || studentProfile || student;
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [activeTab, setActiveTab] = useState<"diary" | "book-report" | "free-task">("diary");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [todaySubmissions, setTodaySubmissions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (studentAuth?.name || (currentStudent && 'id' in currentStudent)) {
      fetchHomeworks();
      checkTodaySubmissions();
    }
  }, [studentAuth?.name, currentStudent]);

  const fetchHomeworks = async () => {
    // For sessionStorage-based auth, we don't fetch from database
    if (studentAuth) {
      setHomeworks([]);
      return;
    }
    
    if (!currentStudent || !('id' in currentStudent)) return;

    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('student_id', currentStudent.id)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching homeworks:', error);
        return;
      }

      const formattedHomeworks: Homework[] = data.map(sub => ({
        id: sub.id,
        type: sub.homework_type as "diary" | "book-report" | "free-task",
        title: `${sub.homework_type} 과제`, // We don't store title separately, using type
        content: sub.homework_type, // We don't store content separately
        submittedAt: new Date(sub.submitted_at),
        points: sub.points
      }));

      setHomeworks(formattedHomeworks);
    } catch (error) {
      console.error('Error fetching homeworks:', error);
    }
  };

  const checkTodaySubmissions = async () => {
    // For sessionStorage-based auth, check database for today's submissions
    if (studentAuth) {
      // Find student in database first
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('name', studentAuth.name)
        .eq('classroom_id', studentAuth.classroomId)
        .single();

      if (studentError || !studentData) {
        console.error('Cannot find student for today submissions check:', studentError);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      try {
        const { data, error } = await supabase
          .from('homework_submissions')
          .select('homework_type')
          .eq('student_id', studentData.id)
          .gte('submitted_at', `${today}T00:00:00.000Z`)
          .lt('submitted_at', `${today}T23:59:59.999Z`);

        if (error) {
          console.error('Error checking today submissions:', error);
          return;
        }

        const todaySubmissionsMap: Record<string, boolean> = {};
        data.forEach(sub => {
          todaySubmissionsMap[sub.homework_type] = true;
        });
        
        setTodaySubmissions(todaySubmissionsMap);
      } catch (error) {
        console.error('Error checking today submissions:', error);
      }
      return;
    }
    
    if (!currentStudent || !('id' in currentStudent)) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('homework_type')
        .eq('student_id', currentStudent.id)
        .gte('submitted_at', `${today}T00:00:00.000Z`)
        .lt('submitted_at', `${today}T23:59:59.999Z`);

      if (error) {
        console.error('Error checking today submissions:', error);
        return;
      }

      const todaySubmissionsMap: Record<string, boolean> = {};
      data.forEach(sub => {
        todaySubmissionsMap[sub.homework_type] = true;
      });
      
      setTodaySubmissions(todaySubmissionsMap);
    } catch (error) {
      console.error('Error checking today submissions:', error);
    }
  };

  const homeworkTypes = {
    diary: { icon: PenTool, label: "일기 쓰기", points: 10, color: "bg-primary", minRequired: 3, photoRequired: false },
    "book-report": { icon: BookOpen, label: "독후감 쓰기", points: 15, color: "bg-accent", minRequired: 3, photoRequired: false },
    "free-task": { icon: Star, label: "자유 과제", points: 5, color: "bg-success", minRequired: 0, photoRequired: true }
  };

  const submitHomework = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    // 사진이 필수인 과제만 사진 검증
    if (homeworkTypes[activeTab].photoRequired && !photo.trim()) {
      toast({
        title: "오류",
        description: "과제 사진을 첨부해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!currentStudent?.name && !studentAuth?.name) {
      toast({
        title: "오류",
        description: "학생 정보를 찾을 수 없습니다.",
        variant: "destructive"
      });
      return;
    }

    // 하루에 각 과제 유형당 1편만 제출 가능
    if (todaySubmissions[activeTab]) {
      toast({
        title: "제출 제한",
        description: `${homeworkTypes[activeTab].label}은 하루에 1편만 제출할 수 있습니다. 내일 다시 시도해주세요.`,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // For sessionStorage-based auth, save to database instead of localStorage
      if (studentAuth) {
        // Find student in students table first
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('name', studentAuth.name)
          .eq('classroom_id', studentAuth.classroomId)
          .single();

        if (studentError || !studentData) {
          toast({
            title: "학생 정보 오류",
            description: "학생 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
            variant: "destructive"
          });
          return;
        }

        // Save homework to database
        const { data, error } = await supabase
          .from('homework_submissions')
          .insert({
            student_id: studentData.id,
            homework_type: activeTab,
            points: homeworkTypes[activeTab].points,
            title: title.trim(),
            content: content.trim(),
            photo: photo,
            user_id: studentData.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error submitting homework:', error);
          toast({
            title: "제출 실패",
            description: "과제 제출 중 오류가 발생했습니다. 다시 시도해주세요.",
            variant: "destructive"
          });
          return;
        }

        // Also save to localStorage for backwards compatibility
        const newHomework: Homework = {
          id: data.id,
          type: activeTab,
          title: title.trim(),
          content: content.trim(),
          photo: photo,
          submittedAt: new Date(data.submitted_at),
          points: data.points
        };

        const today = new Date().toISOString().split('T')[0];
        const submissionsKey = `submissions_${studentAuth.name}_${today}`;
        const homeworksKey = `homeworks_${studentAuth.name}`;
        
        // Update today's submissions
        const newTodaySubmissions = { ...todaySubmissions, [activeTab]: true };
        localStorage.setItem(submissionsKey, JSON.stringify(newTodaySubmissions));
        setTodaySubmissions(newTodaySubmissions);
        
        // Save homework to localStorage
        const existingHomeworks = JSON.parse(localStorage.getItem(homeworksKey) || '[]');
        localStorage.setItem(homeworksKey, JSON.stringify([newHomework, ...existingHomeworks]));
        
        setHomeworks([newHomework, ...homeworks]);
        setTitle("");
        setContent("");
        setPhoto("");

        toast({
          title: "과제 제출 완료!",
          description: `${homeworkTypes[activeTab].points}포인트를 획득했습니다!`,
          variant: "default"
        });

        onSubmissionUpdate?.();
        return;
      }

      // For database-based auth
      const { data, error } = await supabase
        .from('homework_submissions')
        .insert({
          student_id: (currentStudent as any).id,
          homework_type: activeTab,
          points: homeworkTypes[activeTab].points,
          title: title.trim(),
          content: content.trim(),
          photo: photo
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting homework:', error);
        toast({
          title: "제출 실패",
          description: "과제 제출 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      const newHomework: Homework = {
        id: data.id,
        type: activeTab,
        title: title.trim(),
        content: content.trim(),
        photo: photo,
        submittedAt: new Date(data.submitted_at),
        points: data.points
      };

      setHomeworks([newHomework, ...homeworks]);
      setTitle("");
      setContent("");
      setPhoto("");

      toast({
        title: "과제 제출 완료!",
        description: `${homeworkTypes[activeTab].points}포인트를 획득했습니다!`,
        variant: "default"
      });

      // Update today submissions state
      setTodaySubmissions(prev => ({ ...prev, [activeTab]: true }));

      // Notify parent component
      onSubmissionUpdate?.();
    } catch (error) {
      console.error('Error submitting homework:', error);
      toast({
        title: "제출 실패",
        description: "과제 제출 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionCount = (type: string) => {
    return homeworks.filter(hw => hw.type === type).length;
  };

  const getTotalPoints = () => {
    return homeworks.reduce((total, hw) => total + hw.points, 0);
  };

  const getProgress = (type: "diary" | "book-report" | "free-task") => {
    const count = getSubmissionCount(type);
    const required = homeworkTypes[type].minRequired;
    if (required === 0) return 100; // 자유과제는 제한 없음
    return Math.min((count / required) * 100, 100);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
      {/* 과제 제출 폼 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              방학 과제 제출하기
            </CardTitle>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {Object.entries(homeworkTypes).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={key}
                    variant={activeTab === key ? "default" : "outline"}
                    onClick={() => setActiveTab(key as any)}
                    className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                    size="sm"
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                    <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {type.points}pt
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-medium">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${homeworkTypes[activeTab].label} 제목을 입력하세요`}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  activeTab === "free-task" 
                    ? "물놀이 / 봉사활동 / 운동 / 부족한 부분 공부 / 요리 등 나의 방학을 알차게 만드는 모든 자유 과제의 내용을 입력하세요"
                    : `${homeworkTypes[activeTab].label} 내용을 입력하세요`
                }
                rows={4}
                className="text-sm resize-none"
              />
            </div>
            
            {/* 자유과제에만 사진 업로드 */}
            {activeTab === "free-task" && (
              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">과제 사진</label>
                <PhotoUpload 
                  onPhotoCapture={setPhoto}
                  capturedPhoto={photo}
                  required={homeworkTypes[activeTab].photoRequired}
                />
              </div>
            )}
            
            <Button 
              onClick={submitHomework} 
              className="w-full text-sm" 
              disabled={submitting || (!currentStudent?.name && !studentAuth?.name) || todaySubmissions[activeTab] || (homeworkTypes[activeTab].photoRequired && !photo.trim())}
              size="sm"
            >
              {submitting 
                ? "제출 중..." 
                : todaySubmissions[activeTab]
                ? "오늘은 이미 제출했습니다"
                : `과제 제출하기 (+${homeworkTypes[activeTab].points} 포인트)`
              }
            </Button>
            
            {todaySubmissions[activeTab] && (
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                {homeworkTypes[activeTab].label}은 하루에 1편만 제출할 수 있습니다. 내일 다시 시도해주세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 진행상황 */}
      <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-center text-base sm:text-lg">내 포인트</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">{getTotalPoints()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">총 포인트</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">진행 상황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {Object.entries(homeworkTypes).map(([key, type]) => {
              const Icon = type.icon;
              const count = getSubmissionCount(key);
              const progress = getProgress(key as any);
              
              return (
                <div key={key} className="space-y-1 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium">{type.label}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {type.minRequired > 0 ? `${count}/${type.minRequired}` : count}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${type.color}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HomeworkSubmission;