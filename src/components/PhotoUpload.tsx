import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Image } from "lucide-react";

interface PhotoUploadProps {
  onPhotoCapture: (photo: string) => void;
  capturedPhoto?: string;
}

const PhotoUpload = ({ onPhotoCapture, capturedPhoto }: PhotoUploadProps) => {
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        toast({
          title: "파일 크기 초과",
          description: "5MB 이하의 이미지를 선택해주세요.",
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoCapture(result);
        toast({
          title: "사진 업로드 완료!",
          description: "과제와 함께 사진이 첨부됩니다.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    onPhotoCapture("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="text-center space-y-4">
        {capturedPhoto ? (
          <div className="relative">
            <img
              src={capturedPhoto}
              alt="과제 사진"
              className="max-w-full max-h-48 mx-auto rounded-lg border"
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2"
              onClick={removePhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Image className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">과제 사진을 첨부해주세요 <span className="text-destructive">*</span></p>
              <p className="text-xs text-muted-foreground">일기장, 독후감, 자유과제 사진 등 (필수)</p>
            </div>
          </div>
        )}

        {!capturedPhoto && (
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              갤러리에서 선택
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default PhotoUpload;