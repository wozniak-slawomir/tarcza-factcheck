"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconCirclePlus } from "@tabler/icons-react";
import { Input } from "./ui/input";

interface AddPostFormProps {
  onAddPost: (text: string, url?: string) => Promise<void>;
  addingPost: boolean;
}

export function AddPostForm({ onAddPost, addingPost }: AddPostFormProps) {
  const [newText, setNewText] = React.useState("");
  const [newUrl, setNewUrl] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    try {
      await onAddPost(newText.trim(), newUrl.trim() || undefined);
      setNewText("");
      setNewUrl("");
    } catch (error) {
      console.error("Error adding post:", error);
      alert("Nie udało się dodać posta");
    }
  };

  const isValidUrl = (raw: string) => {
    if (!raw) return true; // optional

    return /^https?:\/\//i.test(raw.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="relative">
        <Textarea
          placeholder="Wprowadź tekst posta..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          maxLength={1500}
          className="min-h-[80px] max-h-40 pr-10"
        />
        <div className="pointer-events-none absolute right-2 bottom-2 text-xs">
          <span className={newText.length >= 1500 ? "text-destructive" : "text-muted-foreground"}>
            {newText.length}
          </span>
          <span className="text-muted-foreground">/1500</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Input
          placeholder="Opcjonalny URL (http:// lub https://)"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className={!isValidUrl(newUrl) ? "border-destructive focus-visible:border-destructive" : ""}
          maxLength={500}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {newUrl
              ? isValidUrl(newUrl)
                ? "URL zostanie zapisany osobno"
                : "Niepoprawny format URL"
              : "Pole opcjonalne"}
          </span>

          {newUrl && (
            <button
              type="button"
              onClick={() => setNewUrl("")}
              className="text-[10px] underline text-primary hover:text-primary/80"
            >
              Wyczyść
            </button>
          )}
        </div>
      </div>
      <Button type="submit" disabled={addingPost || !newText.trim()}>
        <IconCirclePlus />
        Dodaj
      </Button>
    </form>
  );
}
