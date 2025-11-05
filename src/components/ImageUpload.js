"use client";
import { useState } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress.jsx";
import { useToast } from "@/hooks/use-toast";

export function ImageUpload({ onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `logos/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        setUploading(false);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUploading(false);
          onUploadComplete(downloadURL);
          toast({
            title: "Upload successful",
            description: "Logo has been uploaded.",
          });
        });
      }
    );
  };

  return (
    <div className="space-y-2">
      <Input type="file" onChange={handleFileChange} accept="image/*" />
      {uploading && <Progress value={progress} className="w-full" />}
      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
