import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Student {
  id: number;
  name: string;
  points: number;
  rank: number;
  completedTasks: number;
}

const RankingBoard = () => {
  const students: Student[] = [
    { id: 1, name: "김민수", points: 250, rank: 1, completedTasks: 15 },
    { id: 2, name: "이지은", points: 230, rank: 2, completedTasks: 14 },
    { id: 3, name: "박준호", points: 210, rank: 3, completedTasks: 13 },
    { id: 4, name: "최서연", points: 190, rank: 4, completedTasks: 12 },
    { id: 5, name: "정우진", points: 170, rank: 5, completedTasks: 11 },
    { id: 6, name: "한소영", points: 150, rank: 6, completedTasks: 10 },
    { id: 7, name: "강도현", points: 130, rank: 7, completedTasks: 9 },
    { id: 8, name: "윤채원", points: 110, rank: 8, completedTasks: 8 },
  ];

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex flex-col items-center">
            <div className="text-6xl">🥇</div>
            <div className="text-lg font-bold text-yellow-600 font-heading">1등</div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center">
            <div className="text-5xl">🥈</div>
            <div className="text-base font-bold text-gray-500 font-heading">2등</div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center">
            <div className="text-4xl">🥉</div>
            <div className="text-sm font-bold text-amber-600 font-heading">3등</div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-xl font-bold font-heading">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 shadow-yellow-200";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400 shadow-gray-200";
      case 3:
        return "bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 shadow-orange-200";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center font-heading">🏆 학급 랭킹</CardTitle>
        <p className="text-lg text-muted-foreground text-center font-body">
          방학 과제를 열심히 해서 상위권에 올라보세요! 🎯
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상위 3등 시상대 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {students.slice(0, 3).map((student, index) => (
            <div
              key={student.id}
              className={cn(
                "text-center p-4 rounded-2xl border-2 shadow-lg transition-all hover:scale-105",
                getRankColor(student.rank),
                index === 0 && "order-2 transform scale-110", // 1등을 가운데, 크게
                index === 1 && "order-1", // 2등을 왼쪽
                index === 2 && "order-3"  // 3등을 오른쪽
              )}
            >
              {getRankDisplay(student.rank)}
              <p className="font-bold text-lg font-heading mt-4">{student.name}</p>
              <p className="text-2xl font-bold text-primary font-heading">{student.points}점</p>
              <p className="text-sm text-muted-foreground font-body">
                과제 {student.completedTasks}개 완료
              </p>
            </div>
          ))}
        </div>
        
        {/* 4등 이하 */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-center mb-4 font-heading">나머지 순위</h3>
          {students.slice(3).map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-4 rounded-xl border-2 bg-card hover:bg-muted/30 transition-all"
            >
              <div className="flex items-center gap-4">
                {getRankDisplay(student.rank)}
                
                <div>
                  <p className="font-bold text-lg font-heading">{student.name}</p>
                  <p className="text-sm text-muted-foreground font-body">
                    과제 완료: {student.completedTasks}개
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-primary font-heading">
                  {student.points}점
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingBoard;