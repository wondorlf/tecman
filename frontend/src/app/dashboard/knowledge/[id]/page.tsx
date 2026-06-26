'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeApi } from '@/lib/api';
import { PageHeader, LoadingSpinner } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Eye, ThumbsUp, BookOpen } from 'lucide-react';
import Link from 'next/link';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  difficulty: string;
  estimatedMinutes: number;
  views: number;
  helpful: number;
  category: { id: string; name: string; slug: string; icon: string };
};

const DIFFICULTY_LABELS: Record<string, string> = {
  BASICO: 'Basico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  BASICO: 'bg-emerald-100 text-emerald-700',
  INTERMEDIO: 'bg-amber-100 text-amber-700',
  AVANZADO: 'bg-red-100 text-red-700',
};

export default function KnowledgeArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: article, isLoading } = useQuery({
    queryKey: ['knowledge-article', id],
    queryFn: async () => {
      const res = await knowledgeApi.getArticle(id);
      return res.data as Article;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Articulo no encontrado</h2>
        <Link href="/dashboard/knowledge">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver a la base de conocimiento
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/knowledge">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
        </Link>
      </div>

      <PageHeader
        title={article.title}
        subtitle={
          article.category ? `${article.category.icon} ${article.category.name}` : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {article.difficulty && (
          <Badge className={DIFFICULTY_COLORS[article.difficulty] || 'bg-slate-100 text-slate-600'}>
            {DIFFICULTY_LABELS[article.difficulty] || article.difficulty}
          </Badge>
        )}
        {article.estimatedMinutes > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" /> {article.estimatedMinutes} min
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <Eye className="h-3 w-3" /> {article.views} vistas
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <ThumbsUp className="h-3 w-3" /> {article.helpful} util
        </span>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="prose prose-slate max-w-none">
            {article.content.split('\n').map((line, i) => {
              if (line.startsWith('# '))
                return (
                  <h1 key={i} className="text-2xl font-bold mt-6 mb-3">
                    {line.slice(2)}
                  </h1>
                );
              if (line.startsWith('## '))
                return (
                  <h2 key={i} className="text-xl font-semibold mt-5 mb-2">
                    {line.slice(3)}
                  </h2>
                );
              if (line.startsWith('### '))
                return (
                  <h3 key={i} className="text-lg font-medium mt-4 mb-2">
                    {line.slice(4)}
                  </h3>
                );
              if (line.startsWith('- '))
                return (
                  <li key={i} className="ml-4 text-sm text-slate-700">
                    {line.slice(2)}
                  </li>
                );
              if (line.startsWith('```')) return null;
              if (line.trim() === '') return <br key={i} />;
              return (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">
                  {line}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {article.excerpt && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800 font-medium">Resumen: {article.excerpt}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
