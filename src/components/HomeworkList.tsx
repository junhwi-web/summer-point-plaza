import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, PenTool, Star, Edit, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import HomeworkEditDialog from "./HomeworkEditDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Homework {
  id: string;
  type: "diary" | "book-report" | "free-task";
  title: string;
  content: string;
  photo?: string;
  submittedAt: Date;
  points: number;
}

interface HomeworkListProps {
  student?: { id: string; name: string };
  studentProfile?: { id: string; name: string };
  studentAuth?: { name: string; classroomId: string };
  onUpdate?: () => void;
}

const HomeworkList = ({ student, studentProfile, studentAuth, onUpdate }: HomeworkListProps) => {
  // Use studentAuth if available, then studentProfile, fallback to student for backward compatibility
  const currentStudent = studentAuth || studentProfile || student;
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [deletingHomework, setDeletingHomework] = useState<Homework | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const homeworkTypes = {
    diary: { icon: PenTool, label: "일기 쓰기", points: 10, color: "bg-primary" },
    "book-report": { icon: BookOpen, label: "독후감 쓰기", points: 15, color: "bg-accent" },
    "free-task": { icon: Star, label: "자유 과제", points: 5, color: "bg-success" }
  };

  useEffect(() => {
    fetchHomeworks();
  }, [studentAuth?.name, currentStudent?.id]);

  const fetchHomeworks = async () => {
    setLoading(true);
    
    try {
      // For sessionStorage-based auth, fetch from localStorage
      if (studentAuth) {
        const homeworksKey = `homeworks_${studentAuth.name}`;
        const existingHomeworks = JSON.parse(localStorage.getItem(homeworksKey) || '[]');
        setHomeworks(existingHomeworks);
        setLoading(false);
        return;
      }

      // For database-based auth
      if (!currentStudent?.id) {
        setLoading(false);
        return;
      }

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
        title: sub.title || `${homeworkTypes[sub.homework_type as keyof typeof homeworkTypes]?.label || '과제'}`,
        content: sub.content || '',
        photo: sub.photo || '',
        submittedAt: new Date(sub.submitted_at),
        points: sub.points
      }));

      setHomeworks(formattedHomeworks);
    } catch (error) {
      console.error('Error fetching homeworks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (homework: Homework) => {
    try {
      // For sessionStorage-based auth, remove from localStorage
      if (studentAuth) {
        const homeworksKey = `homeworks_${studentAuth.name}`;
        const existingHomeworks = JSON.parse(localStorage.getItem(homeworksKey) || '[]');
        const filteredHomeworks = existingHomeworks.filter((hw: Homework) => hw.id !== homework.id);
        localStorage.setItem(homeworksKey, JSON.stringify(filteredHomeworks));
        
        setHomeworks(filteredHomeworks);
        setDeletingHomework(null);
        
        toast({
          title: "과제 삭제 완료!",
          description: `과제가 삭제되고 ${homework.points}포인트가 차감되었습니다.`,
          variant: "default"
        });
        
        onUpdate?.();
        return;
      }

      // For database-based auth
      const { error } = await supabase
        .from('homework_submissions')
        .delete()
        .eq('id', homework.id);

      if (error) {
        console.error('Error deleting homework:', error);
        toast({
          title: "삭제 실패",
          description: "과제 삭제 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "과제 삭제 완료!",
        description: `과제가 삭제되고 ${homework.points}포인트가 차감되었습니다.`,
        variant: "default"
      });

      setHomeworks(homeworks.filter(hw => hw.id !== homework.id));
      setDeletingHomework(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting homework:', error);
      toast({
        title: "삭제 실패",
        description: "과제 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>제출한 과제 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>제출한 과제 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {homeworks.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 제출한 과제가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-1">위에서 과제를 제출해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {homeworks.map((homework) => {
                const type = homeworkTypes[homework.type];
                const Icon = type.icon;
                
                return (
                  <div key={homework.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium truncate">{homework.title}</h3>
                            <Badge variant="secondary" className="flex-shrink-0">
                              {type.label}
                            </Badge>
                            <Badge variant="outline" className="flex-shrink-0">
                              {homework.points}pt
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {homework.submittedAt.toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingHomework(homework)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingHomework(homework)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {homework.content && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <p className="line-clamp-3">{homework.content}</p>
                      </div>
                    )}
                    
                    {homework.photo && (
                      <div className="mt-2">
                        <img 
                          src={homework.photo} 
                          alt="과제 사진" 
                          className="max-w-full h-auto max-h-32 rounded-md object-cover"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <HomeworkEditDialog
        homework={editingHomework}
        isOpen={!!editingHomework}
        onClose={() => setEditingHomework(null)}
        onUpdate={() => {
          fetchHomeworks();
          onUpdate?.();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingHomework} onOpenChange={() => setDeletingHomework(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>과제를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 과제를 삭제하면 획득한 {deletingHomework?.points}포인트도 함께 차감됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHomework && handleDelete(deletingHomework)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default HomeworkList;