import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MessageSquare, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NoticeManagementProps {
  classroom: any;
}

const NoticeManagement = ({ classroom }: NoticeManagementProps) => {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Form states
  const [newNotice, setNewNotice] = useState({
    title: "",
    content: "",
    is_active: true
  });
  
  const [editNotice, setEditNotice] = useState({
    title: "",
    content: "",
    is_active: true
  });

  useEffect(() => {
    fetchNotices();
  }, [classroom?.id]);

  const fetchNotices = async () => {
    if (!classroom?.id) return;

    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('classroom_id', classroom.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "공지사항을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;

    try {
      const { error } = await supabase
        .from('notices')
        .insert({
          title: newNotice.title.trim(),
          content: newNotice.content.trim(),
          is_active: newNotice.is_active,
          classroom_id: classroom.id
        });

      if (error) throw error;

      toast({
        title: "공지사항 작성 완료",
        description: "새 공지사항이 추가되었습니다.",
      });
      
      setNewNotice({ title: "", content: "", is_active: true });
      setIsCreateDialogOpen(false);
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editNotice.title.trim() || !editNotice.content.trim()) return;

    try {
      const { error } = await supabase
        .from('notices')
        .update({
          title: editNotice.title.trim(),
          content: editNotice.content.trim(),
          is_active: editNotice.is_active
        })
        .eq('id', editingNotice.id);

      if (error) throw error;

      toast({
        title: "공지사항 수정 완료",
        description: "공지사항이 수정되었습니다.",
      });
      
      setEditingNotice(null);
      setIsEditDialogOpen(false);
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteNotice = async (noticeId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', noticeId);

      if (error) throw error;

      toast({
        title: "공지사항 삭제 완료",
        description: `"${title}" 공지사항이 삭제되었습니다.`,
      });
      
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_active: !notice.is_active })
        .eq('id', notice.id);

      if (error) throw error;

      toast({
        title: notice.is_active ? "공지사항 비활성화" : "공지사항 활성화",
        description: `"${notice.title}" 공지사항이 ${notice.is_active ? '비활성화' : '활성화'}되었습니다.`,
      });
      
      fetchNotices();
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">공지사항을 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Notice Button */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              공지사항 관리
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  새 공지사항
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>새 공지사항 작성</DialogTitle>
                  <DialogDescription>
                    학생들에게 전달할 공지사항을 작성하세요.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateNotice} className="space-y-4">
                  <div>
                    <Label htmlFor="newTitle">제목</Label>
                    <Input
                      id="newTitle"
                      value={newNotice.title}
                      onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                      placeholder="공지사항 제목을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="newContent">내용</Label>
                    <Textarea
                      id="newContent"
                      value={newNotice.content}
                      onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요"
                      rows={8}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="newActive"
                      checked={newNotice.is_active}
                      onCheckedChange={(checked) => setNewNotice({ ...newNotice, is_active: checked })}
                    />
                    <Label htmlFor="newActive">즉시 게시</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit">작성 완료</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Notices List */}
      <Card>
        <CardHeader>
          <CardTitle>등록된 공지사항 ({notices.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {notices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 공지사항이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className={`p-4 border rounded-lg ${notice.is_active ? 'bg-card' : 'bg-muted/50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{notice.title}</h3>
                        {notice.is_active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                        {notice.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        작성: {new Date(notice.created_at).toLocaleString()}
                        {notice.updated_at !== notice.created_at && (
                          <span> • 수정: {new Date(notice.updated_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(notice)}
                      >
                        {notice.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <Dialog open={isEditDialogOpen && editingNotice?.id === notice.id} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNotice(notice);
                              setEditNotice({
                                title: notice.title,
                                content: notice.content,
                                is_active: notice.is_active
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>공지사항 수정</DialogTitle>
                            <DialogDescription>
                              공지사항 내용을 수정하세요.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleEditNotice} className="space-y-4">
                            <div>
                              <Label htmlFor="editTitle">제목</Label>
                              <Input
                                id="editTitle"
                                value={editNotice.title}
                                onChange={(e) => setEditNotice({ ...editNotice, title: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="editContent">내용</Label>
                              <Textarea
                                id="editContent"
                                value={editNotice.content}
                                onChange={(e) => setEditNotice({ ...editNotice, content: e.target.value })}
                                rows={8}
                                required
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="editActive"
                                checked={editNotice.is_active}
                                onCheckedChange={(checked) => setEditNotice({ ...editNotice, is_active: checked })}
                              />
                              <Label htmlFor="editActive">게시 상태</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                취소
                              </Button>
                              <Button type="submit">수정 완료</Button>
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
                            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{notice.title}" 공지사항을 삭제하시겠습니까? 
                              이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteNotice(notice.id, notice.title)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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

export default NoticeManagement;