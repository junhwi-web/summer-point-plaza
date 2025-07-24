import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Trophy, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminDashboardProps {
  classroom: any;
  onGenerateNewCode: () => void;
}

const AdminDashboard = ({ classroom, onGenerateNewCode }: AdminDashboardProps) => {
  const { toast } = useToast();

  // Don't render if classroom is null
  if (!classroom) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">학급 정보를 불러오는 중...</p>
      </div>
    );
  }

  const handleCopyCode = () => {
    if (!classroom?.code) return;
    
    navigator.clipboard.writeText(classroom.code);
    toast({
      title: "학급 코드 복사됨",
      description: `학급 코드 ${classroom.code}가 클립보드에 복사되었습니다.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Classroom Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            학급 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">학급명</h3>
              <p className="text-2xl font-bold text-primary">{classroom.name}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">학급 코드</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono bg-muted px-3 py-1 rounded">
                  {classroom.code}
                </span>
                <Button size="sm" onClick={handleCopyCode}>
                  복사
                </Button>
                <Button size="sm" variant="outline" onClick={onGenerateNewCode}>
                  새 코드 생성
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                학생들이 이 코드로 로그인할 수 있습니다
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold">등록된 학생</h3>
            <p className="text-2xl font-bold text-primary">12명</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-accent" />
            <h3 className="font-semibold">총 과제 제출</h3>
            <p className="text-2xl font-bold text-accent">48개</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <h3 className="font-semibold">평균 참여도</h3>
            <p className="text-2xl font-bold text-yellow-600">85%</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>관리 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button className="h-16 flex-col gap-2">
              <Users className="h-6 w-6" />
              학생 관리
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <BookOpen className="h-6 w-6" />
              과제 현황 보기
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Trophy className="h-6 w-6" />
              랭킹 관리
            </Button>
            <Button variant="outline" className="h-16 flex-col gap-2">
              <Plus className="h-6 w-6" />
              공지사항
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;