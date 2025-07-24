import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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

interface HomeworkEditDialogProps {
  homework: Homework | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const HomeworkEditDialog = ({ homework, isOpen, onClose, onUpdate }: HomeworkEditDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize form data when homework changes
  useEffect(() => {
    if (homework) {
      setTitle(homework.title || "");
      setContent(homework.content || "");
      setPhoto(homework.photo || "");
    }
  }, [homework]);

  const handleSave = async () => {
    if (!homework || !title.trim() || !content.trim()) {
      toast({
        title: "오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('homework_submissions')
        .update({
          title: title.trim(),
          content: content.trim(),
          photo: photo
        })
        .eq('id', homework.id);

      if (error) {
        console.error('Error updating homework:', error);
        toast({
          title: "수정 실패",
          description: "과제 수정 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "과제 수정 완료!",
        description: "과제가 성공적으로 수정되었습니다.",
        variant: "default"
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating homework:', error);
      toast({
        title: "수정 실패",
        description: "과제 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>과제 수정하기</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">제목</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목을 입력하세요"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">내용</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="과제 내용을 입력하세요"
              rows={8}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">과제 사진</label>
            <PhotoUpload 
              onPhotoCapture={setPhoto}
              capturedPhoto={photo}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomeworkEditDialog;