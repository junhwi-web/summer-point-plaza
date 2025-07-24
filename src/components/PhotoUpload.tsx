import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, Image, Loader2 } from "lucide-react";
import imageCompression from "browser-image-compression";

interface PhotoUploadProps {
  onPhotoCapture: (photo: string) => void;
  capturedPhoto?: string;
  required?: boolean;
}

const PhotoUpload = ({ onPhotoCapture, capturedPhoto, required = true }: PhotoUploadProps) => {
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한 (압축 전)
      toast({
        title: "파일 크기 초과",
        description: "10MB 이하의 이미지를 선택해주세요.",
        variant: "destructive"
      });
      return;
    }

    setCompressing(true);

    try {
      // 이미지 압축 설정
      const options = {
        maxSizeMB: required ? 0.05 : 0.1, // 자유과제(필수): 50KB, 기타(선택): 100KB
        maxWidthOrHeight: 600,
        useWebWorker: true,
        quality: 0.8
      };

      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onPhotoCapture(result);
        
        const originalSize = (file.size / 1024).toFixed(1);
        const compressedSize = (compressedFile.size / 1024).toFixed(1);
        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
        
        toast({
          title: "사진 압축 완료!",
          description: `${originalSize}KB → ${compressedSize}KB (${compressionRatio}% 절약)`,
        });
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Image compression failed:', error);
      toast({
        title: "압축 실패",
        description: "이미지 압축 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setCompressing(false);
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
              <p className="text-sm font-medium">
                과제 사진을 첨부해주세요 
                {required ? (
                  <span className="text-destructive"> *</span>
                ) : (
                  <span className="text-muted-foreground"> (선택사항)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {required 
                  ? "자유과제 사진 (필수, 자동 압축됩니다)" 
                  : "일기장, 독후감 사진 등 (선택사항, 자동 압축됩니다)"
                }
              </p>
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
              disabled={compressing}
            >
              {compressing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  압축 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  갤러리에서 선택
                </>
              )}
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