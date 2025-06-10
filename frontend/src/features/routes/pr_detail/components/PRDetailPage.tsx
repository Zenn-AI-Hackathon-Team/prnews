"use client";
import React, { useState } from "react";
import {
  GitPullRequest,
  ThumbsUp,
  Clock,
  FileText,
  Plus,
  Minus,
  GitBranch,
  Sparkles,
  Code,
  AlertCircle,
  Zap,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// PR詳細の型定義
export type PRDetail = {
  id: number;
  title: string;
  repository: string;
  status: "merged" | "open";
  lastUpdated: string;
  goods: number;
  author: string;
  authorAvatar: string;
  summary: string;
  background: string;
  changes: FileChange[];
  changeSummary: string[];
  highlights: Highlight[];
};

type FileChange = {
  filename: string;
  additions: number;
  deletions: number;
  status: "modified" | "new" | "deleted";
};

type Highlight = {
  type: "technical" | "architecture" | "performance" | "library" | "pattern";
  title: string;
  description: string;
  code?: string;
  language?: string;
};

type PRDetailProps = {
  pr: PRDetail;
};

const highlightIcons = {
  technical: <Sparkles className="h-4 w-4" />,
  architecture: <GitBranch className="h-4 w-4" />,
  performance: <Zap className="h-4 w-4" />,
  library: <Package className="h-4 w-4" />,
  pattern: <Code className="h-4 w-4" />,
};

const highlightColors = {
  technical: "text-purple-600 bg-purple-50",
  architecture: "text-blue-600 bg-blue-50",
  performance: "text-orange-600 bg-orange-50",
  library: "text-green-600 bg-green-50",
  pattern: "text-pink-600 bg-pink-50",
};

const PRDetailPage: React.FC<PRDetailProps> = ({ pr }) => {
  const [isLiked, setIsLiked] = useState(false);
  const goodsCount = pr.goods + (isLiked ? 1 : 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const getStatusColor = (status: FileChange["status"]) => {
    switch (status) {
      case "new":
        return "text-green-600 bg-green-50";
      case "deleted":
        return "text-red-600 bg-red-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`rounded-lg p-2 ${pr.status === "merged" ? "bg-purple-50" : "bg-green-50"}`}
              >
                <GitPullRequest
                  className={`h-6 w-6 ${pr.status === "merged" ? "text-purple-600" : "text-green-600"}`}
                />
              </div>
              <Badge
                variant={pr.status === "merged" ? "secondary" : "outline"}
                className="capitalize"
              >
                {pr.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{pr.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="font-mono">
                {pr.repository}
              </Badge>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Last updated: {pr.lastUpdated}</span>
              </div>
            </div>
          </div>
          <Button
            variant={isLiked ? "default" : "outline"}
            size="lg"
            className={`gap-2 ${
              isLiked
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                : ""
            }`}
            onClick={handleLike}
          >
            <ThumbsUp className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="font-semibold tabular-nums">{goodsCount}</span>
          </Button>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">要約</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">{pr.summary}</p>
          </CardContent>
        </Card>
      </div>

      {/* Background Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            背景・目的
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {pr.background}
          </p>
        </CardContent>
      </Card>

      {/* File Changes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            コードの変更点
          </CardTitle>
          <CardDescription>
            {pr.changes.length} ファイルが変更されました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pr.changes.map((change, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(change.status)}`}
                  >
                    {change.status}
                  </Badge>
                  <span className="font-mono text-sm text-gray-700">
                    {change.filename}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-600">
                    <Plus className="h-3 w-3" />
                    {change.additions}
                  </span>
                  <span className="flex items-center gap-1 text-red-600">
                    <Minus className="h-3 w-3" />
                    {change.deletions}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>変更点の要約</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pr.changeSummary.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 mt-1">•</span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Highlights Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          ハイライト・重要な変更点
        </h2>

        {pr.highlights.map((highlight, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${highlightColors[highlight.type]}`}
                >
                  {highlightIcons[highlight.type]}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{highlight.title}</CardTitle>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {highlight.type === "technical" && "技術的に面白い"}
                    {highlight.type === "architecture" && "アーキテクチャ"}
                    {highlight.type === "performance" && "パフォーマンス"}
                    {highlight.type === "library" && "新技術・ライブラリ"}
                    {highlight.type === "pattern" && "デザインパターン"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                {highlight.description}
              </p>
              {highlight.code && (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {highlight.language || "code"}
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm">{highlight.code}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PRDetailPage;
