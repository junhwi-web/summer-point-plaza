import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Edit, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  created_at: string;
  classroom_id: string;
}

interface StudentManagementProps {
  classroom: any;
}

const StudentManagement = ({ classroom }: StudentManagementProps) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [editStudentName, setEditStudentName] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [classroom?.id]);

  const fetchStudents = async () => {
    if (!classroom?.id) return;

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "학생 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    try {
      const { error } = await supabase
        .from('students')
        .insert({
          name: newStudentName.trim(),
          classroom_id: classroom.id
        });

      if (error) throw error;

      toast({
        title: "학생 추가 완료",
        description: `${newStudentName} 학생이 추가되었습니다.`,
      });
      
      setNewStudentName("");
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editStudentName.trim()) return;

    try {
      const { error } = await supabase
        .from('students')
        .update({ name: editStudentName.trim() })
        .eq('id', editingStudent.id);

      if (error) throw error;

      toast({
        title: "학생 정보 수정 완료",
        description: `학생 이름이 ${editStudentName}으로 변경되었습니다.`,
      });
      
      setEditingStudent(null);
      setEditStudentName("");
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "학생 삭제 완료",
        description: `${studentName} 학생이 삭제되었습니다.`,
      });
      
      fetchStudents();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">학생 목록을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Add Student Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            새 학생 추가
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStudent} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="newStudentName" className="sr-only">학생 이름</Label>
              <Input
                id="newStudentName"
                placeholder="학생 이름을 입력하세요"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                required
              />
            </div>
            <Button type="submit">추가</Button>
          </form>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            등록된 학생 ({students.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 학생이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      가입일: {new Date(student.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStudent(student);
                            setEditStudentName(student.name);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>학생 정보 수정</DialogTitle>
                          <DialogDescription>
                            학생의 이름을 수정할 수 있습니다.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleEditStudent} className="space-y-4">
                          <div>
                            <Label htmlFor="editStudentName">학생 이름</Label>
                            <Input
                              id="editStudentName"
                              value={editStudentName}
                              onChange={(e) => setEditStudentName(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditingStudent(null)}>
                              취소
                            </Button>
                            <Button type="submit">수정</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>학생 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            {student.name} 학생을 삭제하시겠습니까? 
                            이 작업은 되돌릴 수 없으며, 학생의 모든 과제 기록도 함께 삭제됩니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteStudent(student.id, student.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;