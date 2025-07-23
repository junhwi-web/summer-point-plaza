import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown } from "lucide-react";

interface Student {
  id: string;
  name: string;
  points: number;
  rank: number;
  level: number;
  completedTasks: number;
}

const RankingBoard = () => {
  // 모의 데이터 - 실제로는 상태관리나 API에서 가져올 것
  const students: Student[] = [
    { id: "1", name: "김민수", points: 120, rank: 1, level: 3, completedTasks: 8 },
    { id: "2", name: "이지은", points: 105, rank: 2, level: 3, completedTasks: 7 },
    { id: "3", name: "박준호", points: 95, rank: 3, level: 2, completedTasks: 6 },
    { id: "4", name: "최서연", points: 85, rank: 4, level: 2, completedTasks: 5 },
    { id: "5", name: "정민재", points: 75, rank: 5, level: 2, completedTasks: 5 },
    { id: "6", name: "한소영", points: 65, rank: 6, level: 1, completedTasks: 4 },
    { id: "7", name: "임태성", points: 55, rank: 7, level: 1, completedTasks: 3 },
    { id: "8", name: "윤수빈", points: 45, rank: 8, level: 1, completedTasks: 3 },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-muted";
    }
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 3) return "bg-success";
    if (level >= 2) return "bg-primary";
    return "bg-accent";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          학급 랭킹
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          방학 과제 제출 포인트 기준 상위 랭킹
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                student.rank <= 3 ? getRankColor(student.rank) : "bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[40px]">
                  {getRankIcon(student.rank)}
                  <span className={`font-bold ${student.rank <= 3 ? "" : "text-muted-foreground"}`}>
                    #{student.rank}
                  </span>
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-medium">
                    {student.name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className={`font-medium ${student.rank <= 3 ? "" : "text-foreground"}`}>
                    {student.name}
                  </div>
                  <div className={`text-xs ${student.rank <= 3 ? "text-white/80" : "text-muted-foreground"}`}>
                    완료한 과제: {student.completedTasks}개
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={`${getLevelBadgeColor(student.level)} text-white border-none`}
                >
                  Lv.{student.level}
                </Badge>
                <div className="text-right">
                  <div className={`font-bold ${student.rank <= 3 ? "" : "text-primary"}`}>
                    {student.points}pt
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2 text-center">레벨 시스템</h4>
          <div className="grid grid-cols-3 gap-2 text-xs text-center">
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-accent text-accent-foreground">Lv.1</Badge>
              <span className="text-muted-foreground">0-49pt</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-primary">Lv.2</Badge>
              <span className="text-muted-foreground">50-99pt</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Badge className="bg-success">Lv.3</Badge>
              <span className="text-muted-foreground">100pt+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingBoard;