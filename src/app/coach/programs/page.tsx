"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProgramsPage() {
  const [type, setType] = useState<"workout" | "meal">("workout");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file || !title) {
      alert("Please complete all required fields");
      return;
    }

    try {
      setLoading(true);

      const bucket = type === "workout" ? "workout-plans" : "meal-plans";

      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      if (type === "workout") {
        const { error } = await supabase.from("workout_plans").insert({
          title,
          description,
          pdf_url: publicUrl,
        });

        if (error) {
          alert(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("meal_plans").insert({
          title,
          description,
          pdf_url: publicUrl,
        });

        if (error) {
          alert(error.message);
          return;
        }
      }

      alert("Program uploaded successfully");

      setTitle("");
      setDescription("");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Program Library</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="mb-6">
          <label className="block mb-2">Program Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as "workout" | "meal")}
            className="w-full bg-zinc-800 rounded-xl p-3"
          >
            <option value="workout">Workout Plan</option>

            <option value="meal">Meal Plan</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block mb-2">Title</label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-800 rounded-xl p-3"
            placeholder="Fat Loss Beginner Program"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-800 rounded-xl p-3"
            rows={4}
            placeholder="Program description..."
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2">PDF File</label>

          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-bold"
        >
          {loading ? "Uploading..." : "Upload Program"}
        </button>
      </div>
    </div>
  );
}
