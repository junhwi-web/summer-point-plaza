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
  onSubmissionUpdate?: () => void;
}

const HomeworkSubmission = ({ student, onSubmissionUpdate }: HomeworkSubmissionProps) => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [activeTab, setActiveTab] = useState<"diary" | "book-report" | "free-task">("diary");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [todaySubmissions, setTodaySubmissions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (student?.id) {
      fetchHomeworks();
      checkTodaySubmissions();
    }
  }, [student?.id]);

  const fetchHomeworks = async () => {
    if (!student?.id) return;

    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('student_id', student.id)
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
    if (!student?.id) return;

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('homework_submissions')
        .select('homework_type')
        .eq('student_id', student.id)
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
    diary: { icon: PenTool, label: "일기 쓰기", points: 10, color: "bg-primary", minRequired: 3 },
    "book-report": { icon: BookOpen, label: "독후감 쓰기", points: 15, color: "bg-accent", minRequired: 3 },
    "free-task": { icon: Star, label: "자유 과제", points: 5, color: "bg-success", minRequired: 0 }
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

    if (!student?.id) {
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
      const { data, error } = await supabase
        .from('homework_submissions')
        .insert({
          student_id: student.id,
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
    <div className="grid lg:grid-cols-3 gap-6">
      {/* 과제 제출 폼 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              방학 과제 제출하기
            </CardTitle>
            <div className="flex gap-2">
              {Object.entries(homeworkTypes).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <Button
                    key={key}
                    variant={activeTab === key ? "default" : "outline"}
                    onClick={() => setActiveTab(key as any)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                    <Badge variant="secondary" className="ml-1">
                      {type.points}pt
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${homeworkTypes[activeTab].label} 제목을 입력하세요`}
              />
            </div>
            <div>
              <label className="text-sm font-medium">내용</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`${homeworkTypes[activeTab].label} 내용을 입력하세요`}
                rows={6}
              />
            </div>
            
            {/* 사진 업로드 */}
            <div>
              <label className="text-sm font-medium mb-2 block">과제 사진</label>
              <PhotoUpload 
                onPhotoCapture={setPhoto}
                capturedPhoto={photo}
              />
            </div>
            
            <Button 
              onClick={submitHomework} 
              className="w-full" 
              disabled={submitting || !student?.id || todaySubmissions[activeTab]}
            >
              {submitting 
                ? "제출 중..." 
                : todaySubmissions[activeTab]
                ? "오늘은 이미 제출했습니다"
                : `과제 제출하기 (+${homeworkTypes[activeTab].points} 포인트)`
              }
            </Button>
            
            {todaySubmissions[activeTab] && (
              <p className="text-sm text-muted-foreground text-center">
                {homeworkTypes[activeTab].label}은 하루에 1편만 제출할 수 있습니다. 내일 다시 시도해주세요.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 진행상황 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">내 포인트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{getTotalPoints()}</div>
              <div className="text-sm text-muted-foreground">총 포인트</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>진행 상황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(homeworkTypes).map(([key, type]) => {
              const Icon = type.icon;
              const count = getSubmissionCount(key);
              const progress = getProgress(key as any);
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {type.minRequired > 0 ? `${count}/${type.minRequired}` : count}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${type.color}`}
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