import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Clock } from "lucide-react";

const VacationInfo = () => {
  return (
    <Card className="w-full p-6 mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-primary">여름방학 안내</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-semibold text-primary">방학 기간:</span>
                <p className="text-foreground">2025. 7. 26.(토) ~ 2025. 8. 17.(일), (공휴일 포함 23일간)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
              <div>
                <span className="font-semibold text-primary">개학하는 날:</span>
                <p className="text-foreground">2025. 8. 18.(월) 8시 30분까지 등교, 5교시 수업, 급식 실시</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 bg-primary rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-primary">개학 날 준비물:</span>
                <p className="text-foreground">실내화, 방학 과제물, 필기도구, 물통 (2학기 교과서는 개학날 배부함)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="h-4 w-4 bg-accent rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <span className="font-semibold text-accent-foreground">국기 다는 날:</span>
                <p className="text-foreground">2025. 8. 15.(금) 광복절</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-card p-3 rounded-lg border border-primary/10">
              <span className="font-semibold text-primary text-xs">◉ 유상학습형 늘봄(방과후 학교):</span>
              <p className="text-xs text-foreground mt-1">8. 4.(월) ~ 8. 14.(목) / 유상학습형 늘봄 방학 7. 28.(월) ~ 8. 1.(금)</p>
            </div>
            
            <div className="bg-card p-3 rounded-lg border border-primary/10">
              <span className="font-semibold text-primary text-xs">◉ 학교도서관 개방:</span>
              <p className="text-xs text-foreground mt-1">월~금(공휴일 제외), 09:00 ~ 15:00 / 도서관 휴관일 8. 4.(월)</p>
            </div>
            
            <div className="bg-accent/20 p-3 rounded-lg border border-accent/30">
              <span className="font-semibold text-accent-foreground text-xs">◉ 우리집 책몰이:</span>
              <p className="text-xs text-foreground mt-1">가족과 함께 책 읽고 대화하는 '우리집 책몰이'(책에 몰입하는 20분) 실천하기</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VacationInfo;