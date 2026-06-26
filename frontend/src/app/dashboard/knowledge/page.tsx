'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { knowledgeApi, discoveryApi } from '@/lib/api';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/shared/page-header';
import { SearchBar } from '@/components/shared/search-bar';
import { SectionWrapper, StaggeredItem } from '@/components/shared/section-wrapper';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Eye,
  ThumbsUp,
  HelpCircle,
  Search,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Article = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  difficulty: string;
  estimatedMinutes: number;
  views: number;
  helpful: number;
  category: { id: string; name: string; slug: string; icon: string };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
};

export default function KnowledgePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['knowledge-categories'],
    queryFn: async () => {
      const r = await knowledgeApi.listCategories();
      return r.data as Category[];
    },
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ['knowledge-articles', selectedCategory, search],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (selectedCategory) params.categoryId = selectedCategory;
      if (search) params.search = search;
      const r = await knowledgeApi.listArticles(params);
      return r.data as Article[];
    },
  });

  const openArticle = (article: Article) => {
    setDetailArticle(article);
  };

  const isLoading = catsLoading || articlesLoading;

  return (
    <div className="max-w-7xl space-y-4">
      <PageHeader
        title="Base de Conocimiento"
        subtitle="Guías y soluciones para problemas comunes — autoayuda y soporte guiado"
        action={
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <HelpCircle size={14} className="text-amber-600" />
            <span>
              ¿No encuentras lo que buscas? Usa el asistente flotante para crear un ticket.
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar de categorías */}
        <SectionWrapper className="lg:col-span-1">
          <Card className="border-slate-100 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen size={15} className="text-slate-400" />
                Categorías
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Search size={14} />
                Todas
              </button>
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="flex-1 text-left">{cat.name}</span>
                  <ChevronRight size={12} className="text-slate-400" />
                </button>
              ))}
            </CardContent>
          </Card>
        </SectionWrapper>

        {/* Lista de artículos */}
        <SectionWrapper delay={100} className="lg:col-span-3 space-y-3">
          <SearchBar
            id="search-knowledge"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setSelectedCategory(null);
            }}
            placeholder="Buscar en la base de conocimiento..."
            className="w-full max-w-md"
          />

          {isLoading ? (
            <LoadingSpinner label="Cargando artículos..." />
          ) : articles.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin artículos"
              subtitle="Intenta con otra búsqueda o categoría"
            />
          ) : (
            <div className="grid gap-3">
              {articles.map((article: any, i: number) => (
                <StaggeredItem key={article.id} index={i} baseDelay={0}>
                  <Card
                    className="border-slate-100 rounded-2xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
                    onClick={() => openArticle(article)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge
                              variant="secondary"
                              className="text-[10px] font-medium h-5 px-2 rounded-lg"
                            >
                              {article.category?.icon} {article.category?.name}
                            </Badge>
                            <Badge className="text-[10px] font-medium h-5 px-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-100">
                              {article.difficulty === 'BASICO'
                                ? '🟢 Básico'
                                : article.difficulty === 'INTERMEDIO'
                                  ? '🟡 Intermedio'
                                  : '🔴 Avanzado'}
                            </Badge>
                            {article.estimatedMinutes && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock size={10} /> {article.estimatedMinutes} min
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {article.excerpt}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Eye size={10} /> {article.views || 0}
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-slate-300 group-hover:text-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </StaggeredItem>
              ))}
            </div>
          )}
        </SectionWrapper>
      </div>

      {/* Dialog de detalle del artículo */}
      <Dialog open={!!detailArticle} onOpenChange={(open) => !open && setDetailArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailArticle?.category?.icon && <span>{detailArticle.category.icon}</span>}
              {detailArticle?.title}
            </DialogTitle>
          </DialogHeader>

          {detailArticle && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  {detailArticle.category?.name}
                </Badge>
                <Badge className="text-xs bg-slate-100 text-slate-600">
                  {detailArticle.difficulty === 'BASICO' ? '🟢 Básico' : '🟡 Intermedio'}
                </Badge>
                {detailArticle.estimatedMinutes && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> {detailArticle.estimatedMinutes} min lectura
                  </span>
                )}
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-sm">
                {detailArticle.content}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {detailArticle.views || 0} vistas
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} className="text-emerald-500" /> {detailArticle.helpful || 0}{' '}
                    útil
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => {
                      // Aquí podrías marcar como no útil / cerrar
                      setDetailArticle(null);
                    }}
                  >
                    Cerrar
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-blue-600 text-white text-xs"
                    onClick={() => {
                      setDetailArticle(null);
                      router.push('/dashboard/tickets');
                    }}
                  >
                    <HelpCircle size={12} className="mr-1.5" />
                    ¿No fue útil? Crear ticket
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
