import VacationInfo from "@/components/VacationInfo";
import HomeworkSubmission from "@/components/HomeworkSubmission";
import RankingBoard from "@/components/RankingBoard";
import StampCalendar from "@/components/StampCalendar";
import { BookOpen, Users, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-3xl font-bold">여름방학 과제 포인트 시스템</h1>
          </div>
          <p className="text-center mt-2 text-primary-foreground/90">
            과제를 제출하고 포인트를 모아 랭킹에 도전해보세요!
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Vacation Information */}
        <VacationInfo />

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Homework Submission - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            <HomeworkSubmission />
            
            {/* Stamp Calendar */}
            <StampCalendar 
              submissions={[
                // 예시 데이터 - 실제로는 상태에서 관리될 것
                { date: new Date(2025, 6, 28), type: "diary" },
                { date: new Date(2025, 6, 30), type: "book-report" },
                { date: new Date(2025, 7, 2), type: "free-task" },
                { date: new Date(2025, 7, 5), type: "diary" },
                { date: new Date(2025, 7, 8), type: "book-report" },
              ]}
            />
          </div>
          
          {/* Ranking Board - Takes 1 column */}
          <div>
            <RankingBoard />
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
      </main>
    </div>
  );
};

export default Index;
