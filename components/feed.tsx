"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus,
  FileText,
  User as UserIcon,
  MessageSquare,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import {
  getStorage,
  saveStorage,
  type Post,
  type Comment,
} from "@/lib/storage";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

function TimeAgo({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let result: string;
    if (diffMins < 1) result = "только что";
    else if (diffMins < 60) result = `${diffMins} мин. назад`;
    else if (diffHours < 24) result = `${diffHours} ч. назад`;
    else if (diffDays < 7) result = `${diffDays} дн. назад`;
    else
      result = d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLabel(result);
  }, [iso]);

  return label;
}

function NewPostDialog({
  userId,
  authorName,
  onAdd,
}: {
  userId: string;
  authorName: string;
  onAdd: (post: Post) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setFilePreview(null);
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5 МБ");
      e.target.value = "";
      return;
    }

    setFile(f);
    setIsImage(f.type.startsWith("image/"));

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFilePreview(ev.target?.result as string);
    };
    reader.onerror = () => {
      toast.error("Ошибка чтения файла");
      setFile(null);
      setFilePreview(null);
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText && !file) {
      toast.error("Добавьте текст или файл");
      return;
    }

    let url = filePreview;
    if (file && !url) {
      try {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Ошибка чтения файла"));
          reader.readAsDataURL(file);
        });
      } catch {
        toast.error("Ошибка чтения файла");
        return;
      }
    }

    const post: Post = {
      id: crypto.randomUUID(),
      userId,
      authorName,
      text: trimmedText,
      fileUrl: url,
      fileName: file?.name ?? null,
      createdAt: new Date().toISOString(),
    };

    onAdd(post);
    setOpen(false);
    setText("");
    setFile(null);
    setFilePreview(null);
    toast.success("Пост опубликован");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Новый пост
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый пост</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Текст</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Что вы хотите рассказать?"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Файл (до 5 МБ)</label>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.stl,.gcode"
              className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-0.5 file:text-xs file:font-medium"
              onChange={handleFileChange}
            />
            {filePreview && isImage && (
              <img
                src={filePreview}
                alt="preview"
                className="mt-2 max-h-40 rounded-lg object-cover"
              />
            )}
            {filePreview && !isImage && file && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                {file.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Опубликовать</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditPostDialog({
  post,
  onSave,
}: {
  post: Post;
  onSave: (id: string, newText: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(post.text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      toast.error("Текст не может быть пустым");
      return;
    }
    onSave(post.id, trimmed);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8">
            <Pencil className="size-4" />
          </Button>
        }
      />
      <DialogContent key={post.id}>
        <DialogHeader>
          <DialogTitle>Редактировать пост</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <textarea
            className="flex min-h-[120px] w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit">Сохранить</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CommentSection({
  postId,
  currentUserId,
  currentUserName,
  forceUpdate,
}: {
  postId: string;
  currentUserId: string;
  currentUserName: string;
  forceUpdate: () => void;
}) {
  const [text, setText] = useState("");

  const getComments = useCallback((): Comment[] => {
    const data = getStorage();
    if (!data) return [];
    return data.comments
      .filter((c) => c.postId === postId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  }, [postId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const data = getStorage();
    if (!data) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      postId,
      userId: currentUserId,
      authorName: currentUserName,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    data.comments.push(comment);
    saveStorage(data);
    setText("");
    forceUpdate();
  };

  const comments = getComments();

  return (
    <div className="mt-3 border-t pt-3">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-3">
        <input
          className="flex h-9 w-full rounded-lg border bg-background px-3 py-1 text-sm shadow-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать комментарий..."
        />
        <Button
          type="submit"
          size="icon"
          className="size-9 shrink-0"
          disabled={!text.trim()}
        >
          <Send className="size-4" />
        </Button>
      </form>

      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">Нет комментариев</p>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((c) => (
            <div key={c.id} className="rounded-lg bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">{c.authorName}</span>
                <span className="text-[10px] text-muted-foreground">
                  <TimeAgo iso={c.createdAt} />
                </span>
              </div>
              <p className="text-sm mt-0.5">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  currentUserId,
  currentUserName,
  onEdit,
  onDelete,
  forceUpdate,
}: {
  post: Post;
  currentUserId: string | null;
  currentUserName: string | null;
  onEdit: (id: string, newText: string) => void;
  onDelete: (id: string) => void;
  forceUpdate: () => void;
}) {
  const isAuthor = currentUserId === post.userId;
  const isFileImage =
    post.fileUrl &&
    (post.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
      post.fileUrl.startsWith("data:image/"));

  return (
    <Card className="transition-all hover:border-primary/20">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
          <UserIcon className="size-4 text-primary" />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">{post.authorName}</span>
          <span className="text-xs text-muted-foreground">
            <TimeAgo iso={post.createdAt} />
          </span>
        </div>
        {isAuthor && (
          <div className="flex items-center gap-1">
            <EditPostDialog post={post} onSave={onEdit} />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => {
                toast("Удалить пост?", {
                  action: {
                    label: "Удалить",
                    onClick: () => onDelete(post.id),
                  },
                  cancel: {
                    label: "Отмена",
                    onClick: () => {},
                  },
                });
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {post.text && (
          <p className="text-sm whitespace-pre-wrap">{post.text}</p>
        )}
        {post.fileUrl && isFileImage && (
          <a href={post.fileUrl} target="_blank" rel="noreferrer">
            <img
              src={post.fileUrl}
              alt={post.fileName ?? "Изображение"}
              className="max-h-80 w-full rounded-lg object-cover"
            />
          </a>
        )}
        {post.fileUrl && !isFileImage && (
          <a
            href={post.fileUrl}
            download={post.fileName ?? undefined}
            className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <FileText className="size-4" />
            {post.fileName ?? "Файл"}
          </a>
        )}

        <CommentSection
          postId={post.id}
          currentUserId={currentUserId ?? ""}
          currentUserName={currentUserName ?? ""}
          forceUpdate={forceUpdate}
        />
      </CardContent>
    </Card>
  );
}

export function Feed() {
  const { user } = useAuth();
  const [version, forceUpdate] = useState(0);

  const rerender = useCallback(() => {
    forceUpdate((k) => k + 1);
  }, []);

  const getPosts = useCallback((): Post[] => {
    const data = getStorage();
    if (!data) return [];
    return [...data.posts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const handleAdd = useCallback(
    (post: Post) => {
      const data = getStorage();
      if (!data) return;
      data.posts.push(post);
      saveStorage(data);
      rerender();
    },
    [rerender]
  );

  const handleEdit = useCallback(
    (id: string, newText: string) => {
      const data = getStorage();
      if (!data) return;
      const post = data.posts.find((p) => p.id === id);
      if (!post) return;
      post.text = newText;
      saveStorage(data);
      toast.success("Пост обновлён");
      rerender();
    },
    [rerender]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const data = getStorage();
      if (!data) return;
      data.posts = data.posts.filter((p) => p.id !== id);
      data.comments = data.comments.filter((c) => c.postId !== id);
      saveStorage(data);
      toast.success("Пост удалён");
      rerender();
    },
    [rerender]
  );

  const posts = getPosts();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Лента постов</h2>
        <NewPostDialog
          userId={user?.id ?? ""}
          authorName={user?.name ?? ""}
          onAdd={handleAdd}
        />
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <MessageSquare className="size-12" />
          <p className="text-sm">Пока нет постов. Создайте первый!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id ?? null}
              currentUserName={user?.name ?? null}
              onEdit={handleEdit}
              onDelete={handleDelete}
              forceUpdate={rerender}
            />
          ))}
        </div>
      )}
    </div>
  );
}
